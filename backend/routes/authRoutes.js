import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
  getProfile,
  
} from "../controllers/authController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Example protected routes
router.get("/profile", protect, adminOnly, getProfile);

router.get("/admin/dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin access granted" });
});

router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);


export default router;
