// backend/routes/paymentRoutes.js
import express from "express";
import { initiatePesaLink, ipayCallback } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ipay/pesa-link", protect, initiatePesaLink);
router.post("/ipay/callback", ipayCallback); // callback doesn't need auth

export default router;
