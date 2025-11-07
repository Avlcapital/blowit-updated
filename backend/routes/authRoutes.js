import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyLoginOTP,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/login/verify-otp", verifyLoginOTP);
router.post("/reset-password", resetPassword);

export default router;
