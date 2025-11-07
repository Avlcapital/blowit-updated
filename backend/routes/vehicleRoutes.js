import express from "express";
import { getVehicles, getVehicle, addVehicle } from "../controllers/vehicleController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getVehicles);
router.get("/:id", getVehicle);
router.post("/", protect, adminOnly, upload.array("images", 5), addVehicle);

export default router;
