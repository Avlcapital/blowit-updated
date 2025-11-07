import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    beForwardId: { type: String, required: true, unique: true },
    title: String,
    make: String,
    model: String,
    year: Number,
    mileage: Number,
    engine: String,
    fuel: String,
    transmission: String,
    priceFOB: Number,
    priceCIF: Number,
    location: String,
    category: String,
    images: [String],
    videos: [String],
    vr360Url: String,
    syncedFromBeForward: { type: Boolean, default: false },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
