import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Vehicle from "../models/Vehicle.js";
import cloudinary from "../config/cloudinary.js";
import { sendMail } from "../utils/email.js";
import { orderEmails } from "../utils/templates/orderEmails.js";

import { getIO } from "../socket.js";
import PDFDocument from "pdfkit";

/* CREATE ORDER */
export const createOrder = async (req, res) => {
  try {
    const { vehicleId, fullName, phone, email, depositPercent } = req.body;
    const customerId = req.user._id;
    const resolvedFullName = fullName || req.user.name || "Customer";
    const resolvedPhone = phone || req.user.phone || "";
    const resolvedEmail = email || req.user.email || "";

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const price = Number(vehicle.price);
    const dp = Number(depositPercent);

    const depositAmount = Math.round((dp / 100) * price);
    const balanceAmount = price - depositAmount;

    const order = await Order.create({
      vehicle: vehicleId,
      customer: customerId,
      fullName: resolvedFullName,
      phone: resolvedPhone,
      email: resolvedEmail,
      depositPercent: dp,
      totalPrice: price,
      depositAmount,
      balanceAmount,
      status: "Pending",
    });

    const { subject, html } = orderEmails.created({
      customerName: req.user.name || "Customer",
      orderId: order._id.toString(),
      vehicleTitle: `${vehicle.title || `${vehicle.brand} ${vehicle.model}`} (${vehicle.year || ""})`,
      totalPrice: price,
      depositAmount,
      depositPercent: dp,
    });

    sendMail({ to: req.user.email, subject, html });

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
    const {
      status,
      page = 1,
      limit = 10,
      sort = "latest",
    } = req.query;

    const query = { customer: req.user._id };
    if (status && status !== "all") {
      query.status = status;
    }

    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate(
          "vehicle",
          "title brand model year price images fuelType transmission stockNumber"
        )
        .sort(sortMap[sort] || sortMap.latest)
        .skip(skip)
        .limit(parsedLimit),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*export const getMyOrders = async (req, res) => {
  try {
    const {
      status,           // optional: filter by status
      page = 1,
      limit = 10,
      sort = "latest",  // latest | oldest
    } = req.query;

    const query = { customer: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sorting = sortMap[sort] || sortMap.latest;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("vehicle")
        .sort(sorting)
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};*/

/* ============================
   CUSTOMER: SINGLE ORDER DETAIL
   ============================ */
export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).populate("vehicle");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const payments = await Payment.find({ orderId: order._id })
      .sort({ createdAt: -1 })
      .select("type method amount currency status receiptNumber paidAt createdAt txRef gatewayMeta");

    res.json({ success: true, order, payments });
  } catch (err) {
    console.error("getMyOrderById error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ============================
   CUSTOMER: REQUEST CANCELLATION
   ============================ */
export const requestOrderCancellation = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Optional: disallow if already completed / cancelled
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled.",
      });
    }

    order.cancellationRequested = true;
    order.cancellationReason = reason || "";
    order.cancellationRequestedAt = new Date();

    await order.save();

    // TODO: notify admin via email / socket if you want
    res.json({
      success: true,
      message: "Cancellation request sent. AVLC will contact you.",
      order,
    });
  } catch (err) {
    console.error("requestOrderCancellation error:", err);
    res.status(500).json({ success: false, message: err.message });
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

    getIO().emit(`customer:${order.customer}`, {
     type: "dashboard-update",
    });



    res.json({ success: true, message: "Documents uploaded", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const generateOrderSummaryPDF = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).populate("vehicle");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=order_${order._id}.pdf`);

    doc.pipe(res);

    doc.fontSize(22).text("AVLC Vehicle Order Summary", { underline: true });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${order.createdAt}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    doc.fontSize(16).text("Vehicle Details", { underline: true });
    doc.fontSize(12).text(`Brand: ${order.vehicle.brand}`);
    doc.text(`Model: ${order.vehicle.model}`);
    doc.text(`Year: ${order.vehicle.year}`);
    doc.text(`Mileage: ${order.vehicle.mileage}`);
    doc.moveDown();

    doc.fontSize(16).text("Financials", { underline: true });
    doc.fontSize(12).text(`Total Price: KES ${order.totalPrice}`);
    doc.text(`Deposit: KES ${order.depositAmount}`);
    doc.text(`Balance: KES ${order.balanceAmount}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
