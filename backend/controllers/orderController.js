import Order from "../models/Order.js";
import Vehicle from "../models/Vehicle.js";
import cloudinary from "../config/cloudinary.js";
import { sendMail } from "../utils/email.js";
import { orderEmails } from "../utils/templates/orderEmails.js";

import { getIO } from "../socket.js";

/* CREATE ORDER */
export const createOrder = async (req, res) => {
  try {
    const { vehicleId, totalPrice, depositAmount } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const balanceAmount = totalPrice - (depositAmount || 0);

    const order = await Order.create({
      vehicle: vehicleId,
      customer: req.user._id,
      totalPrice,
      depositAmount,
      balanceAmount,
    });

    // notify customer (non-blocking)
    const { subject, html } = orderEmails.created({
      customerName: req.user.name || "Customer",
      orderId: order._id.toString(),
      vehicleTitle: `${vehicle.title || `${vehicle.brand} ${vehicle.model}`} (${vehicle.year || ""})`,
      totalPrice,
      depositAmount: depositAmount || Math.round(totalPrice * 0.5),
    });
    sendMail({ to: req.user.email, subject, html });

    await order.save();

    getIO().emit("order:created", { order });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*GET ALL ORDERS (Admin/AVLC)*/
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email phone")
      .populate("vehicle", "title brand model year price images");
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*GET CUSTOMER’S ORDERS*/
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).populate(
      "vehicle",
      "title brand model year price images"
    );
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE ORDER (Admin = AVLC) */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findById(id)
      .populate("customer", "name email")
      .populate("vehicle", "title brand model year");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const before = {
      depositPaid: order.depositPaid,
      financedByAvlc: order.financedByAvlc,
      finalPaymentDone: order.finalPaymentDone,
      status: order.status,
    };

    // Payment + status automation
    if (updates.depositPaid && !order.depositPaid) {
      order.depositPaid = true;
      order.stageTimestamps.depositPaidAt = new Date();
      order.status = "Processing";
      const { subject, html } = orderEmails.depositPaid({
        customerName: order.customer?.name || "Customer",
        orderId: order._id.toString(),
      });
      sendMail({ to: order.customer?.email, subject, html });
    }

    if (updates.financedByAvlc && !order.financedByAvlc) {
      order.financedByAvlc = true;
      order.stageTimestamps.financedAt = new Date();
      order.status = "Financed";
      const { subject, html } = orderEmails.financed({
        customerName: order.customer?.name || "Customer",
        orderId: order._id.toString(),
      });
      sendMail({ to: order.customer?.email, subject, html });
    }

    if (updates.status === "Shipped" && order.status !== "Shipped") {
      order.status = "Shipped";
      order.stageTimestamps.shippedAt = new Date();
      const { subject, html } = orderEmails.shipped({
        customerName: order.customer?.name || "Customer",
        orderId: order._id.toString(),
        portFrom: updates.portFrom, // optional
      });
      sendMail({ to: order.customer?.email, subject, html });
    }

    if (updates.status === "Arrived" && order.status !== "Arrived") {
      order.status = "Arrived";
      order.stageTimestamps.arrivedAt = new Date();
      const { subject, html } = orderEmails.arrived({
        customerName: order.customer?.name || "Customer",
        orderId: order._id.toString(),
      });
      sendMail({ to: order.customer?.email, subject, html });
    }

    if (updates.finalPaymentDone && !order.finalPaymentDone) {
      order.finalPaymentDone = true;
      order.stageTimestamps.completedAt = new Date();
      order.status = "Completed";
      order.balanceAmount = 0;
      const { subject, html } = orderEmails.completed({
        customerName: order.customer?.name || "Customer",
        orderId: order._id.toString(),
      });
      sendMail({ to: order.customer?.email, subject, html });
    }

    if (updates.notes !== undefined) order.notes = updates.notes;

    await order.save();

    getIO().emit("order:updated", { orderId: order._id, order });

    res.json({ success: true, message: "Order updated", order, before });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*DELETE ORDER (Admin/AVLC)*/
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();

    getIO().emit("order:deleted", { orderId: id });
    
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPLOAD DOCS (Admin) */
export const uploadOrderDocs = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    const uploaded = [];
    for (const f of req.files) {
      const r = await cloudinary.uploader.upload(f.path, { folder: "blowit/orders/docs", resource_type:"auto" });
      uploaded.push({ url: r.secure_url, public_id: r.public_id });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $push: { shippingDocs: { $each: uploaded } } },
      { new: true }
    ).populate("customer", "name email");

    // notify customer
    const { subject, html } = orderEmails.docsUploaded({
      customerName: order.customer?.name || "Customer",
      orderId: order._id.toString(),
    });
    sendMail({ to: order.customer?.email, subject, html });


    getIO().emit("order:docs", { orderId: order._id, order });


    res.json({ success: true, message: "Documents uploaded", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
