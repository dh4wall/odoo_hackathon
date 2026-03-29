import { Router } from "express";
import { getExpenses, assignApprovers, createMockExpense } from "../controllers/expenseController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// Admin / Manager / Employee shared view logic (For now strictly ADMIN for assignments)
router.get("/", authMiddleware, requireRole("ADMIN"), getExpenses);
router.post("/:id/assign-approvers", authMiddleware, requireRole("ADMIN"), assignApprovers);

// TEMPORARY: Testing
router.post("/mock", authMiddleware, requireRole("ADMIN"), createMockExpense);

export default router;
