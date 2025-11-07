import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleRef: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    pricing: {
      fob: Number,
      cif: Number,
      duties: Number,
      fees: Number,
      serviceFee: Number,
      totalEstimate: { type: Number, required: true },
      currency: { type: String, default: "KES" },
    },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    status: {
      type: String,
      default: "DEPOSIT_PENDING",
      enum: [
        "DRAFT",
        "DEPOSIT_PENDING",
        "DEPOSIT_PAID",
        "FINANCE_REVIEW",
        "FINANCE_APPROVED",
        "SUPPLIER_PAID",
        "IN_TRANSIT",
        "AT_PORT",
        "CLEARANCE",
        "WAREHOUSE",
        "READY_FOR_PICKUP",
        "BALANCE_PENDING",
        "BALANCE_PAID",
        "RELEASED",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
    },
    logistics: {
      supplier: String,
      vessel: String,
      eta: Date,
      container: String,
      blNo: String,
    },
    warehouse: {
      name: String,
      slot: String,
      fees: Number,
      readyDate: Date,
    },
    documents: [
      {
        type: { type: String },
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        verified: Boolean,
      },
    ],
    history: [
      {
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
