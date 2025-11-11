import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },

    mileage: { type: Number, required: true },
    transmission: { type: String, enum: ["Automatic", "Manual"], required: true },
    fuelType: { type: String, enum: ["Petrol", "Diesel", "Hybrid", "Electric"], required: true },
    engineCapacity: { type: String },
    color: { type: String },
    condition: { type: String, enum: ["New", "Used", "Reconditioned"], default: "Used" },
    price: { type: Number, required: true },
    description: { type: String },

    status: { type: String, enum: ["Available", "Sold", "Pending"], default: "Available", index: true },
    stockNumber: { type: String, default: null, sparse: true },
    location: { type: String, default: "Japan" },

    images: [{ url: String, public_id: String }],

    source: { type: String, enum: ["local", "beforward"], default: "local" },
    beForwardId: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

vehicleSchema.index({ brand: 1, model: 1, year: -1 });
export default mongoose.model("Vehicle", vehicleSchema);
