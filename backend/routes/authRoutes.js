import express from "express";
import {
  registerUser,
  loginUser,
  
} from "../controllers/authController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Example protected routes
router.get("/profile", protect, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}`, user: req.user });
});

router.get("/admin/dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin access granted" });
});


export default router;
