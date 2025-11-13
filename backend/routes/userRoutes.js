import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getAllUsers, getUserById, updateUser, deleteUser, getAllUsersPaginated } from "../controllers/userController.js";

const router = express.Router();

// Admin-only user management routes
router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserById);
router.put("/:id", protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);
router.get("/", protect, adminOnly, getAllUsersPaginated);

export default router;
