import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

// Initiate Pesalink payment (simulated for now)
export const initiatePesalinkPayment = async (req, res) => {
  try {
    const { orderId, type, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const txRef = `PESALINK-${Date.now()}`;
    const payment = await Payment.create({
      orderId,
      type,
      method: "Pesalink",
      amount,
      txRef,
      status: "success",
    });

    // Update order status
    if (type === "deposit") order.status = "DEPOSIT_PAID";
    if (type === "balance") order.status = "BALANCE_PAID";
    await order.save();

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
