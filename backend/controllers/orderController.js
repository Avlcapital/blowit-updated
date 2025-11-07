import Order from "../models/Order.js";
import Vehicle from "../models/Vehicle.js";

export const createOrder = async (req, res) => {
  try {
    const { vehicleId, totalEstimate } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const order = await Order.create({
      customerId: req.user.id,
      vehicleRef: vehicle._id,
      pricing: { totalEstimate },
      status: "DEPOSIT_PENDING",
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate("vehicleRef")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
