import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import pool from "../config/database";

// Returns all expenses currently waiting directly on this manager
export const getManagerQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, userId } = req;
    if (!companyId || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT
         e.id,
         e.description,
         e.category,
         e.date             AS expense_date,
         e.amount_in_base   AS amount,
         e.base_currency    AS currency,
         e.receipt_url,
         e.status           AS overall_status,
         s.status           AS status,
         e.created_at,
         u.name             AS employee_name,
         u.designation      AS employee_designation
       FROM expenses e
       JOIN users u ON u.id = e.submitted_by_id
       JOIN approval_steps s ON s.expense_id = e.id
       WHERE e.company_id = $1
         AND s.approver_id = $2
         AND s.status = 'PENDING'
         AND e.status = 'PENDING'
       ORDER BY e.created_at ASC`,
      [companyId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Manager queue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Returns all expenses that this manager is uniquely involved in the route for
export const getAllExpensesForManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, userId } = req;
    if (!companyId || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT
         e.id,
         e.description,
         e.category,
         e.date             AS expense_date,
         e.amount_in_base   AS amount,
         e.base_currency    AS currency,
         e.receipt_url,
         e.status           AS overall_status,
         s.status           AS status,
         e.created_at,
         u.name             AS employee_name,
         u.designation      AS employee_designation
       FROM expenses e
       JOIN users u ON u.id = e.submitted_by_id
       JOIN approval_steps s ON s.expense_id = e.id
       WHERE e.company_id = $1
         AND s.approver_id = $2
       ORDER BY e.created_at DESC`,
      [companyId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Manager all-expenses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/manager/action/:expenseId ─────────────────────────────────────
// Manager approves or rejects their specific active step in the sequence
export const processAction = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { companyId, userId } = req;
    const { expenseId } = req.params;
    const { action, note } = req.body;

    if (!companyId || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (action !== "APPROVED" && action !== "REJECTED") {
      res.status(400).json({ error: "action must be APPROVED or REJECTED" });
      return;
    }

    if (action === "REJECTED" && (!note || !String(note).trim())) {
      res.status(400).json({ error: "A note is required when rejecting an expense" });
      return;
    }

    await client.query("BEGIN");

    // 1. Lock the active Step and the Expense safely
    const stepRes = await client.query(
      `SELECT id, sequence, is_priority FROM approval_steps 
       WHERE expense_id = $1 AND approver_id = $2 AND status = 'PENDING' 
       FOR UPDATE`,
      [expenseId, userId]
    );

    if (stepRes.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "You do not have a pending approval step for this expense." });
      return;
    }

    const currentStep = stepRes.rows[0];

    // Read the ad-hoc approval rule attached to this expense
    const ruleRes = await client.query(
      `SELECT r.rule_type, r.threshold_pct 
       FROM expenses e 
       LEFT JOIN approval_rules r ON e.approval_rule_id = r.id 
       WHERE e.id = $1`,
      [expenseId]
    );
    const rule = ruleRes.rows[0];
    const isPriorityApprover = currentStep.is_priority === true;

    // 2. Resolve the action onto the active Step
    await client.query(
      `UPDATE approval_steps SET status = $1, comment = $2, acted_at = NOW() WHERE id = $3`,
      [action, note || null, currentStep.id]
    );

    // Write base audit log for step action
    await client.query(
      `INSERT INTO audit_logs (expense_id, actor_id, action, comment) VALUES ($1, $2, $3, $4)`,
      [expenseId, userId, action, note || null]
    );

    // ────────────────────────────────────────────────────────────────────────
    // MATRIX BRANCH 1: KEY APPROVER OVERRIDE (FAST-TRACK)
    if (isPriorityApprover) {
      // They instantly trigger the global expense status 
      await client.query(`UPDATE expenses SET status = $1, updated_at = NOW() WHERE id = $2`, [action, expenseId]);
      
      // Cancel any remaining steps
      await client.query(
        `UPDATE approval_steps SET status = 'SKIPPED' WHERE expense_id = $1 AND status IN ('PENDING', 'LOCKED')`, 
        [expenseId]
      );
      
      await client.query(
        `INSERT INTO audit_logs (expense_id, actor_id, action, comment) VALUES ($1, $2, $3, $4)`,
        [expenseId, userId, 'PRIORITY_OVERRIDE', `Key Approver directly finalized the expense as ${action}.`]
      );
      
      await client.query("COMMIT");
      res.json({ message: `Expense ${action.toLowerCase()} permanently via priority override.` });
      return;
    }

    // ────────────────────────────────────────────────────────────────────────
    // MATRIX BRANCH 2: NORMAL MANAGER PERCENTAGE FLOW
    
    // Irrespective of Approve/Reject, attempt to find the next manager sequentially!
    const nextStepRes = await client.query(
      `SELECT id, approver_id, sequence FROM approval_steps 
       WHERE expense_id = $1 AND sequence > $2 
       ORDER BY sequence ASC LIMIT 1`,
      [expenseId, Number(currentStep.sequence)]
    );

    if (nextStepRes.rows.length > 0) {
      // Move to Next Manager independently of the current decision
      const nextStepId = nextStepRes.rows[0].id;
      const nextSequence = nextStepRes.rows[0].sequence;
      await client.query(`UPDATE approval_steps SET status = 'PENDING' WHERE id = $1`, [nextStepId]);
      
      await client.query(
        `INSERT INTO audit_logs (expense_id, actor_id, action, comment) VALUES ($1, $2, $3, $4)`,
        [expenseId, userId, 'ROUTED', `Automatically routed to sequence step ${nextSequence}.`]
      );
      
      await client.query("COMMIT");
      res.json({ message: "Your decision is recorded. Routed to the next manager." });
      return;
    } else {
      // 3. Final Approver reached -> Calculate mathematically!
      const allStepsRes = await client.query(`SELECT status FROM approval_steps WHERE expense_id = $1`, [expenseId]);
      
      const total = allStepsRes.rows.length;
      const approvedCount = allStepsRes.rows.filter((s: any) => s.status === 'APPROVED').length;
      
      const ratio = (approvedCount / total) * 100;
      const threshold = rule && rule.threshold_pct ? Number(rule.threshold_pct) : 60.00;

      const finalStatus = ratio >= threshold ? 'APPROVED' : 'REJECTED';

      await client.query(`UPDATE expenses SET status = $1, updated_at = NOW() WHERE id = $2`, [finalStatus, expenseId]);
      
      await client.query(
        `INSERT INTO audit_logs (expense_id, actor_id, action, comment) VALUES ($1, $2, $3, $4)`,
        [expenseId, userId, 'FINAL_EVALUATION', `Sequence resolved mathematically: ${ratio.toFixed(1)}% Approved (Threshold: ${threshold}%). Outcome: ${finalStatus}`]
      );

      await client.query("COMMIT");
      res.json({ message: `Expense fully resolved mathematically (${finalStatus}).` });
      return;
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Manager action error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
