import express from "express";
import multer from "multer";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  addImagesToVehicle,
  deleteVehicleImage,
  exportVehiclesCSV,
  importVehiclesCSV,
  importFromBeForward,
  getPublicVehicles,
  uploadVehicleAuctionSheet,
  removeVehicleAuctionSheet,
  uploadVehicleSpinImages,
  deleteVehicleSpinImage,
} from "../controllers/vehicleController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Admin / internal
router.post("/", createVehicle);
router.get("/", getVehicles);
router.get("/:id", getVehicleById);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

// Main gallery images
router.post("/upload", upload.array("images"), uploadVehicleImages);
router.post("/:id/images", upload.array("images"), addImagesToVehicle);
router.delete("/:id/images/:publicId", deleteVehicleImage);

// Auction sheet
router.post(
  "/:id/auction-sheet",
  upload.single("auctionSheet"),
  uploadVehicleAuctionSheet
);
router.delete("/:id/auction-sheet", removeVehicleAuctionSheet);

// 360° spin images
router.post(
  "/:id/spin-images",
  upload.array("spinImages"),
  uploadVehicleSpinImages
);
router.delete("/:id/spin-images/:publicId", deleteVehicleSpinImage);

// CSV
router.get("/export/csv", exportVehiclesCSV);
router.post(
  "/import/csv",
  upload.single("file"),
  importVehiclesCSV
);

// BeForward sync
router.post("/import/beforward", importFromBeForward);

// Public list (if you want a separate endpoint like /public)
router.get("/public/list", getPublicVehicles);

export default router;
