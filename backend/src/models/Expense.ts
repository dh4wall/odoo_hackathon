import pool from "../config/database";

export interface Expense {
    id: string;
    company_id: string;
    submitted_by_id: string;
    approval_rule_id: string | null;
    description: string;
    category: string;
    date: Date;
    amount: number;
    currency: string;
    amount_in_base: number;
    base_currency: string;
    exchange_rate: number;
    receipt_url: string;
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    created_at: Date;
    updated_at: Date;
}

export const createExpense = async (
    company_id: string,
    submitted_by_id: string,
    description: string,
    category: string,
    date: string,
    amount: number,
    currency: string,
    receipt_url: string
): Promise<Expense> => {
    // For simplicity, auto-converting to base is skipped or mocked
    const amount_in_base = amount;
    const base_currency = currency;
    const exchange_rate = 1.0;

    try {
        const result = await pool.query(
            `INSERT INTO expenses (
        id, company_id, submitted_by_id, description, category, date, 
        amount, currency, amount_in_base, base_currency, exchange_rate, 
        receipt_url, status
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING'
      ) RETURNING *`,
            [company_id, submitted_by_id, description, category, date, amount, currency, amount_in_base, base_currency, exchange_rate, receipt_url]
        );
        return result.rows[0] as Expense;
    } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
    }
};

export const findExpensesByUserId = async (user_id: string): Promise<Expense[]> => {
    try {
        const result = await pool.query(
            `SELECT * FROM expenses WHERE submitted_by_id = $1 ORDER BY created_at DESC`,
            [user_id]
        );
        return result.rows as Expense[];
    } catch (error) {
        console.error("Error finding expenses for user:", error);
        throw error;
    }
};
