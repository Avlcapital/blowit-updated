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

    //Payment details
    totalPrice: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    financedByAvlc: { type: Boolean, default: false },
    finalPaymentDone: { type: Boolean, default: false },

    //Status flow
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

    //Stage timestamps
    stageTimestamps: {
      depositPaidAt: Date,
      financedAt: Date,
      shippedAt: Date,
      arrivedAt: Date,
      completedAt: Date,
    },

    //Supporting info
    notes: String,
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
