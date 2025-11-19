import express from "express";
import multer from "multer";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
  uploadOrderDocs,
  getMyOrderById,
  requestOrderCancellation,
  generateOrderSummaryPDF,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// CUSTOMER
router.post("/create", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, getMyOrderById);
router.post("/:id/request-cancel", protect, requestOrderCancellation);
router.get("/:id/summary-pdf", protect, generateOrderSummaryPDF);


// ADMIN / AVLC
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id", protect, adminOnly, updateOrderStatus);
router.delete("/:id", protect, adminOnly, deleteOrder);
router.post("/:id/upload", protect, adminOnly, upload.array("files"), uploadOrderDocs);

export default router;
