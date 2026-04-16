import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "balance"], required: true },
    method: { type: String, enum: ["MPESA", "CARD"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    txRef: { type: String, required: true },
    receiptNumber: String,
    paidAt: Date,
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    gatewayMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
