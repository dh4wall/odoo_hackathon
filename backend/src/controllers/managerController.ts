import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import pool from "../config/database";

// ─── GET /api/manager/queue ───────────────────────────────────────────────────
// Returns all expenses in the company that are PENDING — scoped to this
// manager's company only. (approval_steps not yet wired => simple filter for now)
export const getManagerQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
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
         e.status,
         e.created_at,
         u.name             AS employee_name,
         u.designation      AS employee_designation
       FROM expenses e
       JOIN users u ON u.id = e.submitted_by_id
       WHERE e.company_id = $1
         AND e.status = 'PENDING'
       ORDER BY e.created_at ASC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Manager queue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/manager/all ─────────────────────────────────────────────────────
// Returns all expenses in the company (any status) — for the "All Requests" tab.
export const getAllExpensesForManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
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
         e.status,
         e.created_at,
         u.name             AS employee_name,
         u.designation      AS employee_designation
       FROM expenses e
       JOIN users u ON u.id = e.submitted_by_id
       WHERE e.company_id = $1
       ORDER BY e.created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Manager all-expenses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/manager/action/:expenseId ─────────────────────────────────────
// Manager approves or rejects a specific expense.
// Body: { action: "APPROVED" | "REJECTED", note?: string }
export const processAction = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Verify the expense belongs to this manager's company and is still PENDING
    const checkResult = await pool.query(
      `SELECT id FROM expenses WHERE id = $1 AND company_id = $2 AND status = 'PENDING'`,
      [expenseId, companyId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Expense not found, already actioned, or not in your company" });
      return;
    }

    // Update expense status
    await pool.query(
      `UPDATE expenses SET status = $1, updated_at = NOW() WHERE id = $2`,
      [action, expenseId]
    );

    // Append audit log entry
    await pool.query(
      `INSERT INTO audit_logs (id, expense_id, actor_id, action, comment)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [expenseId, userId, action, note || null]
    );

    res.json({ message: `Expense ${action.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Manager action error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
