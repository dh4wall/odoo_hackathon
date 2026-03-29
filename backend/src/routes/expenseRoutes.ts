import { Router } from "express";
import { applyForReimbursement, getReimbursements, getExpenses, assignApprovers, getExpenseAuditLogs } from "../controllers/expenseController";
import { authMiddleware, requireRole } from "../middleware/auth";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Setup multer for handling PDF file uploads directly in memory

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req: any, file: any, cb: FileFilterCallback) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
});

// Protect all expense routes
router.use(authMiddleware);

router.post("/", (req, res, next) => {
    upload.single("receiptFile")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, applyForReimbursement);
router.get("/", getReimbursements);

// Admin manual routing endpoints
router.get("/all", requireRole("ADMIN"), getExpenses);
router.get("/:id/audit-logs", requireRole("ADMIN"), getExpenseAuditLogs);
router.post("/:id/assign-approvers", requireRole("ADMIN"), assignApprovers);

export default router;
