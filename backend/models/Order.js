import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fullName: String,
    phone: String,
    email: String,

    depositPercent: { type: Number, default: 30 },

    totalPrice: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    balanceAmount: { type: Number, required: true },

    depositPaid: { type: Boolean, default: false },
    financedByAvlc: { type: Boolean, default: false },
    finalPaymentDone: { type: Boolean, default: false },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "PARTIALLY_PAID", "PAID", "FAILED"],
      default: "UNPAID",
    },
    paymentProvider: {
      type: String,
      enum: ["MPESA", "STRIPE"],
    },
    paymentRef: String,
    paymentMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Financed",
        "Shipped",
        "Arrived",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    stageTimestamps: {
      depositPaidAt: Date,
      balancePaidAt: Date,
      financedAt: Date,
      shippedAt: Date,
      arrivedAt: Date,
      completedAt: Date,
    },

    notes: String,

    cancellationRequested: { type: Boolean, default: false },
    cancellationReason: { type: String, default: "" },
    cancellationRequestedAt: Date,

    shippingDocs: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
