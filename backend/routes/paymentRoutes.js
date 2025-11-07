import express from "express";
import { initiatePesalinkPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, initiatePesalinkPayment);

export default router;
