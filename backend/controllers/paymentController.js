// backend/controllers/paymentController.js
import Order from "../models/Order.js"; // or ImportRequest if you prefer
import { IPAY_INIT_URL, IPAY_VENDOR, generateIpayHash } from "../config/ipay.js";
import crypto from "crypto";

export const initiatePesaLink = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { orderId, amount, phone, email } = req.body;

    // 1. Validate order
    const order = await Order.findOne({ _id: orderId, customer: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 2. Decide how much to pay now (deposit or full)
    const payAmount = amount || order.depositAmount || order.totalPrice;

    // 3. Build iPay payload
    const invoiceId = `BW-${order._id}-${Date.now()}`;

    const fields = {
      vid: IPAY_VENDOR,
      amount: payAmount.toFixed(0),
      tel: phone || order.customerPhone || "",
      eml: email || order.customerEmail || "",
      curr: "KES",
      ref: invoiceId,
      cbk: process.env.IPAY_CALLBACK_URL,
      cst: "1", // 1 = iPay will show its response page then redirect back
      crl: "2", // 2 = always callback
      // channel specifies payment method; for PesaLink use "PESALINK" or per iPay docs
      p1: "PESALINK", // you can use p1..p4 for metadata
      p2: order._id.toString(),
      p3: userId.toString(),
      p4: "blowit-import",
    };

    // 4. Generate hash as iPay expects – adjust order if needed
    const hash = generateIpayHash(fields);

    // 5. Save a pending payment record in DB (optional but recommended)
    order.paymentProvider = "IPAY";
    order.paymentRef = invoiceId;
    order.paymentStatus = "PENDING";
    await order.save();

    // 6. Respond with a redirect URL for frontend
    const query = new URLSearchParams({
      ...fields,
      hsh: hash,
      // if iPay wants explicit payment method use "pesalink" param as per docs
      pesalink: "1",
    }).toString();

    const redirectUrl = `${IPAY_INIT_URL}?${query}`;

    res.json({
      success: true,
      redirectUrl,
      orderId: order._id,
      invoiceId,
    });
  } catch (err) {
    console.error("iPay PesaLink init error:", err);
    res.status(500).json({ success: false, message: "Payment init failed" });
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