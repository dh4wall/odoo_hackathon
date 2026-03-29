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
    try {
        // Query the Company payload to calculate target base currency
        const companyRes = await pool.query('SELECT base_currency FROM companies WHERE id = $1', [company_id]);
        const base_currency = companyRes.rows[0]?.base_currency || 'USD';

        let exchange_rate = 1.0;
        let amount_in_base = amount;

        // Perform external live math if currencies mistmach
        if (currency && currency !== base_currency) {
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base_currency}`);
                if (res.ok) {
                    const data = await res.json() as any;
                    if (data && data.rates && data.rates[currency]) {
                        exchange_rate = data.rates[currency];
                        // "1 Base = N File Currency", thus Base = File / N
                        amount_in_base = Math.round((amount / exchange_rate) * 100) / 100;
                    }
                }
            } catch (err) {
                console.error("Failed to ping exchange rate API. Falling back to 1.0", err);
            }
        }

        const result = await pool.query(
            `INSERT INTO expenses (
        id, company_id, submitted_by_id, description, category, date, 
        amount, currency, amount_in_base, base_currency, exchange_rate, 
        receipt_url, status
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'DRAFT'
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
            `SELECT e.*, 
               (
                 SELECT comment 
                 FROM approval_steps s 
                 WHERE s.expense_id = e.id AND s.status = 'REJECTED' AND s.comment IS NOT NULL
                 ORDER BY s.sequence DESC 
                 LIMIT 1
               ) as rejection_comment
             FROM expenses e 
             WHERE e.submitted_by_id = $1 
             ORDER BY e.created_at DESC`,
            [user_id]
        );
        return result.rows as (Expense & { rejection_comment?: string })[];
    } catch (error) {
        console.error("Error finding expenses for user:", error);
        throw error;
    }
};
