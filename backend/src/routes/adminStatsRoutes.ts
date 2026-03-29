import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { getAdminStats } from "../controllers/adminStatsController";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.get("/stats", getAdminStats);

export default router;
