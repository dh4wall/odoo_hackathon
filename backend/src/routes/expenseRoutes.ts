import { Router } from "express";
import { applyForReimbursement, getReimbursements } from "../controllers/expenseController";
import { authMiddleware } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Setup multer for handling PDF file uploads
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    },
});

// Protect all expense routes
router.use(authMiddleware);

router.post("/", upload.single("receiptFile"), applyForReimbursement);
router.get("/", getReimbursements);

export default router;
