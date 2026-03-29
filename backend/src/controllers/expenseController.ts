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

        if (!req.file) {
            res.status(400).json({ error: "Receipt (PDF) is required" });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            res.status(400).json({ error: "Invalid amount provided" });
            return;
        }

        // Convert the file buffer to a Base64 Data URI to store it directly in the DB
        const base64Data = req.file.buffer.toString("base64");
        const receipt_url = `data:${req.file.mimetype};base64,${base64Data}`;

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
