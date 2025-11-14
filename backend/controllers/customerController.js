import Order from "../models/Order.js";

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    const orders = await Order.countDocuments({ customer: customerId });

    const pendingPayments = await Order.countDocuments({
      customer: customerId,
      paymentStatus: "Pending",
    });

    const documents = await Order.aggregate([
      { $match: { customer: customerId } },
      { $unwind: "$documents" },
      { $count: "totalDocs" },
    ]);

    res.json({
      orders,
      pendingPayments,
      documents: documents?.[0]?.totalDocs || 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
};
