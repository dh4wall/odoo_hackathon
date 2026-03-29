import { Router } from "express";
import { 
  getRules, 
  createRule, 
  updateRule, 
  deleteRule, 
  getCategories 
} from "../controllers/approvalRuleController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// Only ADMIN can configure rules
router.get("/categories", authMiddleware, requireRole("ADMIN"), getCategories);
router.get("/", authMiddleware, requireRole("ADMIN"), getRules);
router.post("/", authMiddleware, requireRole("ADMIN"), createRule);
router.put("/:id", authMiddleware, requireRole("ADMIN"), updateRule);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteRule);

export default router;
