import Order from "../models/Order.js";

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Total orders
    const orders = await Order.countDocuments({
      customer: customerId,
    });

    // Pending payments (FIXED case)
    const pendingPayments = await Order.countDocuments({
      customer: customerId,
      status: { $ne: "Cancelled" },
      $or: [
        { depositPaid: false },
        { depositPaid: true, finalPaymentDone: false, balanceAmount: { $gt: 0 } },
      ],
    });

    // Count uploaded shipping documents (FIXED field)
    const docsAgg = await Order.aggregate([
      { $match: { customer: customerId } },
      { $unwind: "$shippingDocs" },
      { $count: "totalDocs" },
    ]);

    const documents = docsAgg.length ? docsAgg[0].totalDocs : 0;

    //MATCH FRONTEND EXPECTATION
    res.json({
      success: true,
      stats: {
        orders,
        pendingPayments,
        documents,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
