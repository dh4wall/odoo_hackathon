import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createExpense, findExpensesByUserId } from "../models/Expense";

export const applyForReimbursement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { description, category, date, amount, currency } = req.body;

        if (!req.userId || !req.companyId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const file = (req as any).file;

        if (!file) {
            res.status(400).json({ error: "Receipt (PDF) is required" });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            res.status(400).json({ error: "Invalid amount provided" });
            return;
        }

        // Convert the file buffer to a Base64 Data URI to store it directly in the DB
        const base64Data = file.buffer.toString("base64");
        const receipt_url = `data:${file.mimetype};base64,${base64Data}`;

        const newExpense = await createExpense(
            req.companyId,
            req.userId,
            description,
            category,
            date,
            parsedAmount,
            currency,
            receipt_url
        );

        res.status(201).json(newExpense);
    } catch (error: any) {
        console.error("Apply Reimb Error:", error);
        res.status(500).json({ error: error.message || error.toString() });
    }
};

export const getReimbursements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Employees fetch their own expenses. 
        const expenses = await findExpensesByUserId(req.userId);
        res.json(expenses);
    } catch (error) {
        console.error("Get Reimb Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

import pool from "../config/database";

// Admin: Get all expenses for a company
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const expensesRes = await pool.query(
      `SELECT e.*, u.name as submitted_by_name, u.email as submitted_by_email
       FROM expenses e
       JOIN users u ON e.submitted_by_id = u.id
       WHERE e.company_id = $1
       ORDER BY e.created_at DESC`,
      [companyId]
    );

    // Also fetch approval steps for all these expenses
    const expenses = expensesRes.rows;
    if (expenses.length === 0) {
      res.json([]);
      return;
    }

    const expenseIds = expenses.map(e => e.id);
    const stepsRes = await pool.query(
      `SELECT s.*, u.name as approver_name
       FROM approval_steps s
       JOIN users u ON s.approver_id = u.id
       WHERE s.expense_id = ANY($1)
       ORDER BY s.expense_id, s.sequence ASC`,
      [expenseIds]
    );

    const stepsMap = new Map<string, any[]>();
    for (const step of stepsRes.rows) {
      if (!stepsMap.has(step.expense_id)) stepsMap.set(step.expense_id, []);
      stepsMap.get(step.expense_id)!.push(step);
    }

    for (const e of expenses) {
      e.approval_steps = stepsMap.get(e.id) || [];
    }

    res.json(expenses);
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Admin: Manually assign an approval route
export const assignApprovers = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { companyId } = req;
    const { id } = req.params;
    const { approverIds, priorityApproverIds = [] } = req.body;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!Array.isArray(approverIds) || approverIds.length === 0) {
      res.status(400).json({ error: "approverIds array is required and must not be empty." });
      return;
    }

    await client.query("BEGIN");

    // Block unless expense is DRAFT or PENDING
    const expRes = await client.query(
      "SELECT id, status, category FROM expenses WHERE id = $1 AND company_id = $2 FOR UPDATE",
      [id, companyId]
    );

    if (expRes.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const expense = expRes.rows[0];
    if (expense.status !== "DRAFT" && expense.status !== "PENDING") {
      await client.query("ROLLBACK");
      res.status(400).json({ error: `Cannot re-route an expense that is already ${expense.status}` });
      return;
    }

    // Insert into approval_rules dynamically mapping to this individual expense sequence
    const ruleRes = await client.query(
      `INSERT INTO approval_rules (company_id, name, category, rule_type, threshold_pct, key_approver_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        companyId, 
        `Manual Sequence - ${id.slice(0, 8)}`, 
        expense.category, 
        priorityApproverIds.length > 0 ? 'HYBRID' : 'PERCENTAGE', 
        60.00, 
        null
      ]
    );

    const customRuleId = ruleRes.rows[0].id;

    // Delete any existing steps
    await client.query("DELETE FROM approval_steps WHERE expense_id = $1", [id]);

    // Insert new steps
    for (let i = 0; i < approverIds.length; i++) {
      // First is PENDING, rest are LOCKED
      const stepStatus = i === 0 ? "PENDING" : "LOCKED";
      const isPriority = priorityApproverIds.includes(approverIds[i]);
      await client.query(
        `INSERT INTO approval_steps (expense_id, approver_id, sequence, status, is_priority) 
         VALUES ($1, $2, $3, $4, $5)`,
        [id, approverIds[i], i + 1, stepStatus, isPriority]
      );
    }

    // Update expense status to PENDING and lock the ad-hoc rule
    await client.query(
      `UPDATE expenses SET status = 'PENDING', approval_rule_id = $2, updated_at = NOW() WHERE id = $1`, 
      [id, customRuleId]
    );

    // Also write to audit_logs
    await client.query(
      `INSERT INTO audit_logs (expense_id, actor_id, action, comment) VALUES ($1, $2, $3, $4)`,
      [id, req.userId, 'ROUTED', 'Manually assigned approval route sequence']
    );

    await client.query("COMMIT");
    res.json({ message: "Approval route successfully assigned and application marked as PENDING." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign approvers error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// Admin: Get detailed chronological audit log of a single expense
export const getExpenseAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req;
    const { id } = req.params;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Ensure expense exists within company bounds
    const expRes = await pool.query("SELECT id FROM expenses WHERE id = $1 AND company_id = $2", [id, companyId]);
    if (expRes.rows.length === 0) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const logsRes = await pool.query(
      `SELECT a.*, u.name as actor_name, u.role as actor_role
       FROM audit_logs a
       JOIN users u ON a.actor_id = u.id
       WHERE a.expense_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    );

    res.json(logsRes.rows);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
