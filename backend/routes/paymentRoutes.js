// backend/routes/paymentRoutes.js
import express from "express";
import { createStripeCheckout, initiateMpesaStkPush, mpesaCallback, stripeWebhook } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// M-Pesa STK push (auth)
router.post("/mpesa/stk/initiate", protect, initiateMpesaStkPush);

// Callback from Safaricom (NO auth)
router.post("/mpesa/callback", mpesaCallback);

// Stripe checkout (auth)
router.post("/stripe/checkout", protect, createStripeCheckout);

// Stripe webhook (NO auth) - raw body required; handled in server.js/app.js
router.post("/stripe/webhook", stripeWebhook);
export default router;
