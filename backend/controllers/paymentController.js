// backend/controllers/paymentController.js
import Order from "../models/Order.js"; // or ImportRequest if you prefer
import { IPAY_INIT_URL, IPAY_VENDOR, generateIpayHash } from "../config/ipay.js";
import crypto from "crypto";

export const initiatePesaLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId, phone, email } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const payAmount = order.depositAmount;

    const invoiceId = `BW-${order._id}-${Date.now()}`;

    const fields = {
      vid: IPAY_VENDOR,
      amount: payAmount,
      tel: phone,
      eml: email,
      curr: "KES",
      ref: invoiceId,
      cbk: process.env.IPAY_CALLBACK_URL,
      cst: "1",
      crl: "2",
      p1: "PESALINK",
      p2: order._id.toString(),
      p3: userId.toString(),
    };

    const hash = generateIpayHash(fields);

    order.paymentProvider = "IPAY";
    order.paymentRef = invoiceId;
    order.paymentStatus = "PENDING";
    await order.save();

    const redirectUrl = `${IPAY_INIT_URL}?${new URLSearchParams({
      ...fields,
      hsh: hash,
      pesalink: "1",
    }).toString()}`;

    res.json({ success: true, redirectUrl });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const ipayCallback = async (req, res) => {
  try {
    // iPay sends various fields (check their docs)
    const {
      // common fields
      ref,        // our invoiceId
      amt,        // amount paid
      msisdn_id,  // phone
      status,     // "SUCCESS", "FAILED", etc.
      id,         // iPay receipt ID
      hsh,        // received hash
      p1, p2, p3, p4,
    } = req.body;

    // 1. Rebuild hash to verify integrity (same order of fields as iPay docs)
    const fields = {
      ref,
      amt,
      msisdn_id,
      status,
      id,
      p1,
      p2,
      p3,
      p4,
    };

    const expectedHash = crypto
      .createHmac("sha256", process.env.IPAY_HASH_KEY)
      .update(Object.values(fields).join(""))
      .digest("hex");

    if (expectedHash !== hsh) {
      console.warn("iPay callback hash mismatch");
      return res.status(400).send("INVALID HASH");
    }

    // 2. Find order using p2 (we passed orderId in p2)
    const orderId = p2;
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn("Order not found for iPay callback:", orderId);
      return res.status(404).send("ORDER NOT FOUND");
    }

    // 3. Update order payment status
    if (status === "SUCCESS") {
      order.paymentStatus = "PAID";
      order.paymentProvider = "IPAY";
      order.paymentRef = ref;
      order.paymentMeta = {
        receiptId: id,
        amount: Number(amt || 0),
        channel: p1,
        phone: msisdn_id,
      };

      // optionally mark deposit paid / reduce balance
      const paidAmount = Number(amt || 0);
      order.depositPaid = true;
      order.balanceAmount = Math.max(order.totalPrice - paidAmount, 0);
    } else {
      order.paymentStatus = "FAILED";
      order.paymentMeta = {
        ...(order.paymentMeta || {}),
        lastStatus: status,
        lastReceiptId: id,
      };
    }

    await order.save();

    // 4. Respond 200 so iPay knows we processed it
    res.status(200).send("OK");
  } catch (err) {
    console.error("iPay callback error:", err);
    res.status(500).send("SERVER ERROR");
  }
};