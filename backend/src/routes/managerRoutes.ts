import { Router } from "express";
import { getManagerQueue, getAllExpensesForManager, processAction } from "../controllers/managerController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All routes require auth + MANAGER role
router.use(authMiddleware, requireRole("MANAGER"));

router.get("/queue", getManagerQueue);
router.get("/all", getAllExpensesForManager);
router.post("/action/:expenseId", processAction);

export default router;
