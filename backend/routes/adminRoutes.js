import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getAdminSummary } from "../controllers/admincontroller.js";


const router = express.Router();

// Protected admin dashboard summary
router.get("/summary", protect, adminOnly, getAdminSummary);

export default router;
