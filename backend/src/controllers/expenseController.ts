import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import pool from "../config/database";

// Get all expenses for a company
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

// Manually assign an approval route (sequence of managers) to an expense
export const assignApprovers = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { companyId } = req;
    const { id } = req.params;
    const { approverIds } = req.body;

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
      "SELECT id, status FROM expenses WHERE id = $1 AND company_id = $2 FOR UPDATE",
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

    // Delete any existing steps
    await client.query("DELETE FROM approval_steps WHERE expense_id = $1", [id]);

    // Insert new steps
    for (let i = 0; i < approverIds.length; i++) {
      // First is PENDING, rest are LOCKED
      const stepStatus = i === 0 ? "PENDING" : "LOCKED";
      await client.query(
        `INSERT INTO approval_steps (expense_id, approver_id, sequence, status) 
         VALUES ($1, $2, $3, $4)`,
        [id, approverIds[i], i + 1, stepStatus]
      );
    }

    // Update expense status to PENDING
    await client.query("UPDATE expenses SET status = 'PENDING', updated_at = NOW() WHERE id = $1", [id]);

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

// TEMPORARY: For testing only - create a mock expense
export const createMockExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, userId } = req;
    const { description, category, amount } = req.body;

    if (!description || !category || !amount) {
      res.status(400).json({ error: "description, category, and amount required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO expenses (company_id, submitted_by_id, description, category, date, amount, currency, amount_in_base, base_currency, exchange_rate, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'USD', $5, 'USD', 1.0, 'DRAFT')
       RETURNING *`,
      [companyId, userId, description, category, amount]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
