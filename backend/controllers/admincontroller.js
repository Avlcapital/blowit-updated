import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

export const getAdminSummary = async (req, res) => {
  try {
    const vehiclesCount = await Vehicle.countDocuments();
    const customersCount = await User.countDocuments({ role: "customer" });
    const ordersCount = await Order.countDocuments();
    const totalPayments = await Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      summary: {
        vehicles: vehiclesCount,
        customers: customersCount,
        orders: ordersCount,
        payments: totalPayments[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
