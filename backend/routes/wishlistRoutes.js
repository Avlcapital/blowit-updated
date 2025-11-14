import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addFavourite, removeFavourite, getFavourites } from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/add", protect, addFavourite);
router.delete("/:vehicleId", protect, removeFavourite);
router.get("/", protect, getFavourites);

export default router;
