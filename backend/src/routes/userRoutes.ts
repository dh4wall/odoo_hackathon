import { Router } from "express";
import { getUsers, createNewUser, sendCredentials } from "../controllers/userController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// Only ADMIN can view users and create new ones
router.get("/", authMiddleware, requireRole("ADMIN"), getUsers);
router.post("/", authMiddleware, requireRole("ADMIN"), createNewUser);
router.post("/:id/send-credentials", authMiddleware, requireRole("ADMIN"), sendCredentials);

export default router;
