import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    type: { type: String, enum: ["deposit", "balance"], required: true },
    method: { type: String, default: "Pesalink" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    txRef: { type: String, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    gatewayMeta: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
