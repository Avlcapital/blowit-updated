import express from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  importFromBeForward,
  addImagesToVehicle,
  deleteVehicleImage,
  exportVehiclesCSV,
  importVehiclesCSV,
} from "../controllers/vehicleController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/", getVehicles);
router.get("/:id", getVehicleById);

//admin CRUD
router.post("/", protect, adminOnly, createVehicle);
router.put("/:id", protect, adminOnly, updateVehicle);
router.delete("/:id", protect, adminOnly, deleteVehicle);

//Images
router.post("/upload", protect, adminOnly, upload.array("images"), uploadVehicleImages);
router.post("/:id/images", protect, adminOnly, upload.array("images"), addImagesToVehicle); 
router.delete("/:id/images/:publicId", protect, adminOnly, deleteVehicleImage); 

//CSV
router.get("/export/csv", protect, adminOnly, exportVehiclesCSV);
router.post("/import/csv", protect, adminOnly, upload.single("file"), importVehiclesCSV);

//Befoward sync
router.post("/import/beforward", protect, adminOnly, importFromBeForward);


export default router;
