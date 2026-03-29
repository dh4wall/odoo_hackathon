import { Router } from "express";
import { signup, login, logout, getMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

export default router;
