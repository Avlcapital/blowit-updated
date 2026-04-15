// backend/models/Vehicle.js
import mongoose from "mongoose";

const imageSubSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },

    mileage: { type: Number, required: true },
    transmission: {
      type: String,
      enum: ["Automatic", "Manual"],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
      required: true,
    },
    engineCapacity: { type: String },
    color: { type: String },
    exteriorColor: { type: String },
    interiorColor: { type: String },
    bodyType: { type: String },
    condition: {
      type: String,
      enum: ["New", "Used", "Reconditioned"],
      default: "Used",
    },
    price: { type: Number, required: true },
    description: { type: String },

    status: {
      type: String,
      enum: ["Available", "Sold", "Pending"],
      default: "Available",
      index: true,
    },
    stockNumber: { type: String, default: null, sparse: true },
    location: { type: String, default: "Japan" },
    sourceUrl: { type: String },
    sourcePrice: { type: Number },
    sourceCurrency: { type: String },
    sourceUpdatedAt: { type: Date },
    lastSyncedAt: { type: Date },

    images: [imageSubSchema],

    // === NEW: 360° spin images (Option A) ===
    spinImages: [imageSubSchema], // used for 360° gallery/spin

    // === NEW: Auction sheet ===
    auctionSheetUrl: { type: String },
    auctionSheetPublicId: { type: String },

    // === Extra specs used in CustomerVehicleDetails ===
    driveType: { type: String, default: "2WD" }, // e.g. 2WD, 4WD, AWD
    doors: { type: Number },
    wheels: { type: Number },
    seats: { type: Number },
    interiorType: { type: String }, // e.g. Fabric, Leather
    chassisNumber: { type: String },
    engineNumber: { type: String },
    exteriorGrade: { type: String },
    interiorGrade: { type: String },
    hasAC: { type: Boolean, default: true },
    powerWindows: { type: Boolean, default: true },

    // Technology
    bluetooth: { type: Boolean, default: false },
    navigation: { type: Boolean, default: false },
    reverseCamera: { type: Boolean, default: false },
    hasScreen: { type: Boolean, default: false },
    keylessEntry: { type: Boolean, default: false },
    climateControl: { type: Boolean, default: false },
    sunroof: { type: Boolean, default: false },
    fogLights: { type: Boolean, default: false },
    alloyWheels: { type: Boolean, default: false },
    airbags: { type: Boolean, default: false },
    abs: { type: Boolean, default: false },

    // For backwards compatibility if you ever decide to use a 3D URL
    model3dUrl: { type: String },
    videoUrl: { type: String },
    has360: { type: Boolean, default: false },

    source: { type: String, enum: ["local", "beforward"], default: "local" },
    beForwardId: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

vehicleSchema.index({ brand: 1, model: 1, year: -1 });

export default mongoose.model("Vehicle", vehicleSchema);
