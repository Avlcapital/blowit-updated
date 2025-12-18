import axios from "axios";
import Stripe from "stripe";
import Order from "../models/Order.js";
import { mpesaAuthToken, mpesaConfig, mpesaPasswordAndTimestamp } from "../config/mpesa.js";
//import { mpesaAuthToken, mpesaPasswordAndTimestamp, mpesaConfig } from "../config/mpesa.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------------------
// Helpers
// ------------------------------
const normalizePhone = (phone) => {
  // Accepts 07..., 2547..., +2547...
  let p = String(phone || "").trim();
  p = p.replace(/\s+/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  return p;
};

// ------------------------------
// 1) M-Pesa STK Push Initiate
// POST /api/payments/mpesa/stk/initiate
// body: { orderId, phone }
// ------------------------------
export const initiateMpesaStkPush = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({ success: false, message: "orderId and phone are required" });
    }

    const order = await Order.findOne({ _id: orderId, customer: userId }).populate("vehicle");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // only deposit
    const amount = Number(order.depositAmount || 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid deposit amount" });
    }

    // if already paid
    if (order.depositPaid || order.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Deposit already paid" });
    }

    const token = await mpesaAuthToken();
    const { password, timestamp } = mpesaPasswordAndTimestamp();

    const msisdn = normalizePhone(phone);
    const accountRef = `BLOWIT-${order._id.toString().slice(-6)}`;
    const transactionDesc = `Deposit for ${order.vehicle?.title || "vehicle import"}`;

    const payload = {
      BusinessShortCode: mpesaConfig.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: msisdn,
      PartyB: mpesaConfig.MPESA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: mpesaConfig.MPESA_CALLBACK_URL,
      AccountReference: "0810282343619",
      TransactionDesc: transactionDesc,
    };

    const stkRes = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Save refs to order
    order.paymentProvider = "MPESA";
    order.paymentStatus = "PENDING";
    order.paymentRef = stkRes.data.CheckoutRequestID; // best unique ref
    order.paymentMeta = {
      ...(order.paymentMeta || {}),
      mpesa: {
        MerchantRequestID: stkRes.data.MerchantRequestID,
        CheckoutRequestID: stkRes.data.CheckoutRequestID,
        CustomerMSISDN: msisdn,
        Amount: amount,
      },
    };

    await order.save();

    return res.json({
      success: true,
      message: "STK Push sent. Enter PIN on your phone.",
      checkoutRequestId: stkRes.data.CheckoutRequestID,
      merchantRequestId: stkRes.data.MerchantRequestID,
    });
  } catch (err) {
    console.error("initiateMpesaStkPush error:", err?.response?.data || err.message);
    return res.status(500).json({ success: false, message: err?.response?.data?.errorMessage || err.message });
  }
};

// ------------------------------
// 2) M-Pesa Callback
// POST /api/payments/mpesa/callback
// (Safaricom calls this)
// ------------------------------
export const mpesaCallback = async (req, res) => {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.status(400).json({ success: false, message: "Invalid callback payload" });

    const { CheckoutRequestID, ResultCode, ResultDesc } = stk;

    const order = await Order.findOne({ paymentRef: CheckoutRequestID });
    if (!order) {
      // Still return OK so Safaricom doesn't retry forever
      return res.json({ ResultCode: 0, ResultDesc: "OK" });
    }

    // Save raw callback
    order.paymentMeta = {
      ...(order.paymentMeta || {}),
      mpesaCallback: stk,
    };

    if (Number(ResultCode) === 0) {
      // SUCCESS: extract metadata
      const items = stk.CallbackMetadata?.Item || [];
      const getItem = (name) => items.find((i) => i.Name === name)?.Value;

      const amount = Number(getItem("Amount") || 0);
      const receipt = getItem("MpesaReceiptNumber");
      const phone = String(getItem("PhoneNumber") || "");
      const trxDate = getItem("TransactionDate");

      order.paymentStatus = "PAID";
      order.depositPaid = true;
      order.stageTimestamps = order.stageTimestamps || {};
      order.stageTimestamps.depositPaidAt = new Date();

      // balance handling (deposit is what we requested)
      order.balanceAmount = Math.max(Number(order.totalPrice || 0) - Number(order.depositAmount || amount), 0);

      // Optionally move order into Processing
      if (order.status === "Pending") order.status = "Processing";

      order.paymentMeta = {
        ...(order.paymentMeta || {}),
        receiptId: receipt,
        paidAmount: amount,
        phone,
        trxDate,
      };
    } else {
      // FAILED / CANCELLED
      order.paymentStatus = "FAILED";
      order.paymentMeta = {
        ...(order.paymentMeta || {}),
        lastStatus: ResultDesc,
      };
    }

    await order.save();

    // Safaricom requires this standard OK response format
    return res.json({ ResultCode: 0, ResultDesc: "OK" });
  } catch (err) {
    console.error("mpesaCallback error:", err.message);
    return res.json({ ResultCode: 0, ResultDesc: "OK" });
  }
};

// ------------------------------
// 3) Stripe - Create Checkout Session (Card)
// POST /api/payments/stripe/checkout
// body: { orderId }
// ------------------------------
export const createStripeCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: userId }).populate("vehicle");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.depositPaid || order.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Deposit already paid" });
    }

    const amount = Number(order.depositAmount || 0);
    if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid deposit amount" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: order.email || req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "kes",
            unit_amount: Math.round(amount * 100), // cents
            product_data: {
              name: `Deposit for ${order.vehicle?.title || "Vehicle Import"}`,
              description: `Order ${order._id}`,
            },
          },
        },
      ],
      metadata: {
        orderId: order._id.toString(),
        customerId: userId.toString(),
        purpose: "deposit",
      },
      success_url: `${process.env.FRONTEND_URL}/customer/orders/${order._id}?paid=1`,
      cancel_url: `${process.env.FRONTEND_URL}/customer/orders/${order._id}?paid=0`,
    });

    // Save stripe pending details
    order.paymentProvider = "STRIPE";
    order.paymentStatus = "PENDING";
    order.paymentRef = session.id;
    order.paymentMeta = { ...(order.paymentMeta || {}), stripeSessionId: session.id };
    await order.save();

    return res.json({ success: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("createStripeCheckout error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------
// 4) Stripe Webhook
// POST /api/payments/stripe/webhook
// IMPORTANT: raw body required in route
// ------------------------------
export const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentProvider = "STRIPE";
          order.paymentStatus = "PAID";
          order.depositPaid = true;
          order.stageTimestamps = order.stageTimestamps || {};
          order.stageTimestamps.depositPaidAt = new Date();

          order.paymentMeta = {
            ...(order.paymentMeta || {}),
            stripe: {
              sessionId: session.id,
              paymentIntent: session.payment_intent,
              amountTotal: session.amount_total,
              currency: session.currency,
            },
          };

          // update balance
          order.balanceAmount = Math.max(Number(order.totalPrice || 0) - Number(order.depositAmount || 0), 0);
          if (order.status === "Pending") order.status = "Processing";

          await order.save();
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("stripeWebhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
