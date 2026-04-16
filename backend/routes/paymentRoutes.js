// backend/routes/paymentRoutes.js
import express from "express";
import {
  createStripeCheckout,
  downloadPaymentReceipt,
  getPaymentStatus,
  initiateMpesaStkPush,
  mpesaCallback,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// M-Pesa STK push (auth)
router.post("/mpesa/stk/initiate", protect, initiateMpesaStkPush);

// Callback from Safaricom (NO auth)
router.post("/mpesa/callback", mpesaCallback);

// Stripe checkout (auth)
router.post("/stripe/checkout", protect, createStripeCheckout);

// Payment status (auth)
router.get("/:id/status", protect, getPaymentStatus);

// Receipt download (auth)
router.get("/receipts/:id/download", protect, downloadPaymentReceipt);

export default router;
