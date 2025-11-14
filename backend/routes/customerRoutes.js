import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCustomerDashboard } from "../controllers/customerController.js";

const router = express.Router();

router.get("/dashboard", protect, getCustomerDashboard);

export default router;
