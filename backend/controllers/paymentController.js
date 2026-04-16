import axios from "axios";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { sendMail } from "../utils/email.js";
import { orderEmails } from "../utils/templates/orderEmails.js";
import {
  buildReceiptFilename,
  generateReceiptPdfBuffer,
} from "../utils/paymentReceipts.js";
import {
  mpesaAuthToken,
  mpesaConfig,
  mpesaPasswordAndTimestamp,
} from "../config/mpesa.js";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const normalizePhone = (phone) => {
  let value = String(phone || "").trim().replace(/\s+/g, "");
  if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("0")) value = `254${value.slice(1)}`;
  return value;
};

const parseMpesaTransactionDate = (value) => {
  const raw = String(value || "");
  if (!/^\d{14}$/.test(raw)) return new Date();

  return new Date(
    `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(
      8,
      10
    )}:${raw.slice(10, 12)}:${raw.slice(12, 14)}+03:00`
  );
};

const buildReceiptNumber = (payment) =>
  `RCT-${payment.type.toUpperCase()}-${String(payment._id).slice(-6).toUpperCase()}`;

const getPaymentMethodLabel = (method) =>
  method === "CARD" ? "Credit Card" : "M-Pesa";

const getPaymentTypeLabel = (type) =>
  type === "balance" ? "Balance Payment" : "Deposit Payment";

const getNumericCode = (value) => {
  const code = Number(value);
  return Number.isNaN(code) ? null : code;
};

const isTerminalMpesaFailure = (resultCode, resultDesc = "") => {
  if (resultCode === null || resultCode === 0) {
    return false;
  }

  if ([1, 1032, 1037, 2001].includes(resultCode)) {
    return true;
  }

  return /(cancel(?:l)?ed|declined|failed|timeout|insufficient|wrong pin|invalid)/i.test(
    String(resultDesc || "")
  );
};

const buildPaymentStatusSummary = (payment) => {
  const gatewayMeta = payment.gatewayMeta || {};
  const rawMessage = String(
    gatewayMeta.configMismatchMessage ||
    gatewayMeta.callbackResultDesc ||
    gatewayMeta.queryResultDesc ||
    gatewayMeta.errorMessage ||
    gatewayMeta.lastQueryError ||
    gatewayMeta.reason ||
    ""
  ).trim();
  const callbackCode = getNumericCode(
    gatewayMeta.callbackResultCode ?? gatewayMeta.queryResultCode
  );

  if (payment.status === "success") {
    return {
      status: "success",
      resolution: "success",
      message: "Payment confirmed successfully.",
    };
  }

  if (payment.status === "failed") {
    const wasCancelled =
      callbackCode === 1032 || /cancel(?:l)?ed/i.test(rawMessage);

    return {
      status: "failed",
      resolution: wasCancelled ? "cancelled" : "failed",
      message:
        rawMessage ||
        (wasCancelled
          ? "The payment was cancelled on the phone."
          : "The payment was not completed."),
    };
  }

  if (gatewayMeta.configMismatchMessage) {
    return {
      status: "pending",
      resolution: "attention",
      message: gatewayMeta.configMismatchMessage,
    };
  }

  if (
    gatewayMeta.lastQueryError &&
    /(bad request|invalid|shortcode|credential|authorization|passkey)/i.test(
      gatewayMeta.lastQueryError
    )
  ) {
    return {
      status: "pending",
      resolution: "attention",
      message: gatewayMeta.lastQueryError,
    };
  }

  return {
    status: "pending",
    resolution: "pending",
    message: "Waiting for payment confirmation.",
  };
};

const enrichSuccessfulMpesaPayment = async (payment, extra = {}) => {
  payment.gatewayMeta = {
    ...(payment.gatewayMeta || {}),
    ...extra,
  };

  if (extra.paidAt && !payment.paidAt) {
    payment.paidAt = extra.paidAt;
  }

  await payment.save();
};

const buildFrontendReturnUrl = ({ paymentStatus, order, payment }) =>
  `${FRONTEND_URL}/customer/orders?payment=${paymentStatus}&orderId=${order._id}&paymentId=${payment._id}&type=${payment.type}`;

const getCustomerOrder = (orderId, userId) =>
  Order.findOne({ _id: orderId, customer: userId })
    .populate("vehicle")
    .populate("customer", "name email phone");

const getPayableAmount = (order, requestedType = "deposit") => {
  const paymentType = requestedType === "balance" ? "balance" : "deposit";

  if (paymentType === "deposit") {
    if (order.depositPaid) {
      return { error: "Deposit already paid" };
    }

    const amount = Number(order.depositAmount || 0);
    if (amount <= 0) {
      return { error: "Invalid deposit amount" };
    }

    return { paymentType, amount };
  }

  if (!order.depositPaid) {
    return { error: "Pay the deposit first before completing the balance" };
  }

  if (order.finalPaymentDone || Number(order.balanceAmount || 0) <= 0) {
    return { error: "This order does not have any outstanding balance" };
  }

  return { paymentType, amount: Number(order.balanceAmount || 0) };
};

const markOrderPaymentPending = async (order, payment, extra = {}) => {
  order.paymentProvider = payment.method === "CARD" ? "STRIPE" : "MPESA";
  order.paymentStatus = "PENDING";
  order.paymentRef = payment.txRef;
  order.paymentMeta = {
    ...(order.paymentMeta || {}),
    lastPendingPayment: {
      paymentId: payment._id,
      type: payment.type,
      method: payment.method,
      amount: payment.amount,
      txRef: payment.txRef,
      requestedAt: new Date(),
      ...extra,
    },
  };

  await order.save();
};

const markOrderPaymentFailed = async (order, payment, extra = {}) => {
  payment.status = "failed";
  payment.gatewayMeta = {
    ...(payment.gatewayMeta || {}),
    ...extra,
  };
  await payment.save();

  order.paymentStatus = order.depositPaid ? "PARTIALLY_PAID" : "FAILED";
  order.paymentMeta = {
    ...(order.paymentMeta || {}),
    lastFailedPayment: {
      paymentId: payment._id,
      type: payment.type,
      method: payment.method,
      txRef: payment.txRef,
      failedAt: new Date(),
      ...extra,
    },
  };
  await order.save();
};

const emailPaymentReceipt = async ({ order, payment }) => {
  const vehicle = order.vehicle || {};
  const customer = order.customer || {};
  const receiptBuffer = await generateReceiptPdfBuffer({
    order,
    payment,
    customer,
    vehicle,
  });

  const { subject, html } = orderEmails.paymentReceipt({
    customerName: order.fullName || customer.name || "Customer",
    orderId: order._id.toString(),
    vehicleTitle:
      vehicle.title ||
      [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" "),
    paymentType: payment.type,
    amount: payment.amount,
    balanceAmount: order.balanceAmount,
    method: getPaymentMethodLabel(payment.method),
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt || payment.createdAt,
  });

  await sendMail({
    to: order.email || customer.email,
    subject,
    html,
    attachments: [
      {
        filename: buildReceiptFilename(payment),
        content: receiptBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

const reconcilePendingMpesaPayment = async (payment) => {
  if (!payment || payment.method !== "MPESA" || payment.status !== "pending") {
    return payment;
  }

  if (mpesaConfig.hasShortcodeMismatch) {
    payment.gatewayMeta = {
      ...(payment.gatewayMeta || {}),
      configMismatchMessage: mpesaConfig.shortcodeMismatchMessage,
      lastQueryFailedAt: new Date(),
    };
    await payment.save();
    return payment;
  }

  const checkoutRequestId = payment.gatewayMeta?.checkoutRequestId || payment.txRef;
  if (!checkoutRequestId) {
    return payment;
  }

  try {
    const token = await mpesaAuthToken();
    const { password, timestamp } = mpesaPasswordAndTimestamp();
    const queryPayload = {
      BusinessShortCode: mpesaConfig.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const queryResponse = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpushquery/v1/query`,
      queryPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      }
    );

    const queryData = queryResponse.data || {};
    const resultCode = getNumericCode(queryData.ResultCode);
    const resultDesc = queryData.ResultDesc || queryData.ResponseDescription || "";

    payment.gatewayMeta = {
      ...(payment.gatewayMeta || {}),
      queryCheckedAt: new Date(),
      queryResponseCode: queryData.ResponseCode,
      queryResultCode: queryData.ResultCode,
      queryResultDesc: resultDesc,
      lastQueryResponse: queryData,
    };

    if (resultCode === 0) {
      const hydratedPayment = await Payment.findById(payment._id).populate({
        path: "orderId",
        populate: [
          { path: "vehicle" },
          { path: "customer", select: "name email phone" },
        ],
      });

      if (hydratedPayment?.orderId && hydratedPayment.status === "pending") {
        await markOrderPaymentSuccessful(hydratedPayment.orderId, hydratedPayment, {
          paidAt: new Date(),
          queryResultCode: queryData.ResultCode,
          queryResultDesc: resultDesc,
          queryResponseCode: queryData.ResponseCode,
          queriedFromStatusEndpoint: true,
        });
        return hydratedPayment;
      }

      return hydratedPayment || payment;
    }

    if (isTerminalMpesaFailure(resultCode, resultDesc)) {
      const hydratedPayment = await Payment.findById(payment._id).populate("orderId");

      if (hydratedPayment?.orderId && hydratedPayment.status === "pending") {
        await markOrderPaymentFailed(hydratedPayment.orderId, hydratedPayment, {
          queryResultCode: queryData.ResultCode,
          queryResultDesc: resultDesc,
          queryResponseCode: queryData.ResponseCode,
          queriedFromStatusEndpoint: true,
        });
        return hydratedPayment;
      }

      return hydratedPayment || payment;
    }

    await payment.save();
    return payment;
  } catch (error) {
    payment.gatewayMeta = {
      ...(payment.gatewayMeta || {}),
      lastQueryError:
        error.response?.data?.errorMessage ||
        error.response?.data?.ResponseDescription ||
        error.message,
      lastQueryFailedAt: new Date(),
    };

    try {
      await payment.save();
    } catch {
      // Ignore secondary save issues here; the endpoint can still return pending.
    }

    return payment;
  }
};

const markOrderPaymentSuccessful = async (order, payment, extra = {}) => {
  const paidAt = extra.paidAt || new Date();

  if (payment.status !== "success") {
    payment.status = "success";
    payment.paidAt = paidAt;
    payment.receiptNumber = payment.receiptNumber || buildReceiptNumber(payment);
    payment.gatewayMeta = {
      ...(payment.gatewayMeta || {}),
      ...extra,
    };
    await payment.save();
  }

  order.paymentProvider = payment.method === "CARD" ? "STRIPE" : "MPESA";
  order.paymentRef = payment.txRef;
  order.paymentMeta = {
    ...(order.paymentMeta || {}),
    lastSuccessfulPayment: {
      paymentId: payment._id,
      type: payment.type,
      method: payment.method,
      amount: payment.amount,
      txRef: payment.txRef,
      receiptNumber: payment.receiptNumber,
      paidAt,
      ...extra,
    },
  };

  order.stageTimestamps = order.stageTimestamps || {};

  if (payment.type === "deposit") {
    order.depositPaid = true;
    order.paymentStatus = "PARTIALLY_PAID";
    order.stageTimestamps.depositPaidAt =
      order.stageTimestamps.depositPaidAt || paidAt;
    order.balanceAmount = Math.max(
      Number(order.totalPrice || 0) - Number(order.depositAmount || payment.amount),
      0
    );
    if (order.status === "Pending") {
      order.status = "Processing";
    }
  } else {
    order.finalPaymentDone = true;
    order.balanceAmount = 0;
    order.paymentStatus = "PAID";
    order.stageTimestamps.balancePaidAt =
      order.stageTimestamps.balancePaidAt || paidAt;
  }

  await order.save();
  await emailPaymentReceipt({ order, payment });
};

export const initiateMpesaStkPush = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId, phone, paymentType = "deposit" } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: "orderId and phone are required",
      });
    }

    const order = await getCustomerOrder(orderId, userId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const paymentInfo = getPayableAmount(order, paymentType);
    if (paymentInfo.error) {
      return res.status(400).json({ success: false, message: paymentInfo.error });
    }

    if (mpesaConfig.hasShortcodeMismatch) {
      return res.status(400).json({
        success: false,
        message: mpesaConfig.shortcodeMismatchMessage,
      });
    }

    if (mpesaConfig.isInferredSandbox) {
      return res.status(400).json({
        success: false,
        message:
          "M-Pesa is still using sandbox shortcode/passkey values. Replace MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CONSUMER_KEY, and MPESA_CONSUMER_SECRET with the live Daraja credentials for your paybill before initiating production payments.",
      });
    }

    const token = await mpesaAuthToken();
    const { password, timestamp } = mpesaPasswordAndTimestamp();
    const msisdn = normalizePhone(phone);
    const orderReference = `BLOWIT-${order._id.toString().slice(-6)}`;
    const partyB = mpesaConfig.MPESA_SHORTCODE;
    const accountReference = process.env.ACCOUNT_NO || orderReference;
    const transactionDesc = `${getPaymentTypeLabel(
      paymentInfo.paymentType
    )} for ${order.vehicle?.title || "vehicle import"}`;

    const payload = {
      BusinessShortCode: mpesaConfig.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: paymentInfo.amount,
      PartyA: msisdn,
      PartyB: partyB,
      PhoneNumber: msisdn,
      CallBackURL: mpesaConfig.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    const stkRes = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const payment = await Payment.create({
      orderId: order._id,
      customerId: order.customer?._id || userId,
      type: paymentInfo.paymentType,
      method: "MPESA",
      amount: paymentInfo.amount,
      currency: "KES",
      txRef: stkRes.data.CheckoutRequestID,
      status: "pending",
      gatewayMeta: {
        merchantRequestId: stkRes.data.MerchantRequestID,
        checkoutRequestId: stkRes.data.CheckoutRequestID,
        msisdn,
        requestedAmount: paymentInfo.amount,
        accountReference,
        partyB,
      },
    });

    await markOrderPaymentPending(order, payment, {
      checkoutRequestId: stkRes.data.CheckoutRequestID,
      merchantRequestId: stkRes.data.MerchantRequestID,
    });

    return res.json({
      success: true,
      message: "STK Push sent. Enter PIN on your phone.",
      checkoutRequestId: stkRes.data.CheckoutRequestID,
      merchantRequestId: stkRes.data.MerchantRequestID,
      paymentId: payment._id,
    });
  } catch (err) {
    console.error("MPESA FULL ERROR:", err.response?.data || err);
    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
      message:
        err.response?.data?.errorMessage ||
        err.response?.data?.errorMessage ||
        err.message ||
        "M-Pesa payment initiation failed",
    });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) {
      return res.status(400).json({ success: false, message: "Invalid callback payload" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stk;
    const payment = await Payment.findOne({ txRef: CheckoutRequestID }).populate({
      path: "orderId",
      populate: [
        { path: "vehicle" },
        { path: "customer", select: "name email phone" },
      ],
    });

    if (!payment?.orderId) {
      return res.json({ ResultCode: 0, ResultDesc: "OK" });
    }

    const order = payment.orderId;

    const callbackMeta = {
      callbackResultCode: ResultCode,
      callbackResultDesc: ResultDesc,
      rawCallback: stk,
    };

    if (Number(ResultCode) === 0) {
      const items = stk.CallbackMetadata?.Item || [];
      const getItem = (name) => items.find((item) => item.Name === name)?.Value;

      const amount = Number(getItem("Amount") || payment.amount || 0);
      const receipt = getItem("MpesaReceiptNumber");
      const phone = String(getItem("PhoneNumber") || "");
      const trxDate = parseMpesaTransactionDate(getItem("TransactionDate"));

      payment.amount = amount || payment.amount;

      if (payment.status === "success") {
        await enrichSuccessfulMpesaPayment(payment, {
          ...callbackMeta,
          externalReceipt: receipt,
          mpesaReceiptNumber: receipt,
          phone,
          transactionDate: trxDate,
          paidAt: trxDate,
        });

        return res.json({ ResultCode: 0, ResultDesc: "OK" });
      }

      await markOrderPaymentSuccessful(order, payment, {
        ...callbackMeta,
        paidAt: trxDate,
        externalReceipt: receipt,
        mpesaReceiptNumber: receipt,
        phone,
        transactionDate: trxDate,
      });
    } else if (payment.status !== "success") {
      await markOrderPaymentFailed(order, payment, callbackMeta);
    }

    return res.json({ ResultCode: 0, ResultDesc: "OK" });
  } catch (err) {
    console.error("mpesaCallback error:", err.message);
    return res.json({ ResultCode: 0, ResultDesc: "OK" });
  }
};

export const createStripeCheckout = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: "Card payments are not configured yet on this server",
      });
    }

    const userId = req.user._id;
    const { orderId, paymentType = "deposit" } = req.body;

    const order = await getCustomerOrder(orderId, userId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const paymentInfo = getPayableAmount(order, paymentType);
    if (paymentInfo.error) {
      return res.status(400).json({ success: false, message: paymentInfo.error });
    }

    const payment = await Payment.create({
      orderId: order._id,
      customerId: order.customer?._id || userId,
      type: paymentInfo.paymentType,
      method: "CARD",
      amount: paymentInfo.amount,
      currency: "KES",
      txRef: `stripe-pending-${Date.now()}-${order._id}`,
      status: "pending",
      gatewayMeta: {
        settlementTarget: {
          paybillNo: process.env.PAYBILL_NO || "",
          accountNo: process.env.ACCOUNT_NO || "",
        },
      },
    });

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: order.email || order.customer?.email || req.user.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "kes",
              unit_amount: Math.round(paymentInfo.amount * 100),
              product_data: {
                name: getPaymentTypeLabel(paymentInfo.paymentType),
                description: `Order ${order._id}`,
              },
            },
          },
        ],
        metadata: {
          orderId: order._id.toString(),
          paymentId: payment._id.toString(),
          purpose: paymentInfo.paymentType,
          customerId: userId.toString(),
          settlementPaybillNo: process.env.PAYBILL_NO || "",
          settlementAccountNo: process.env.ACCOUNT_NO || "",
        },
        success_url: buildFrontendReturnUrl({
          paymentStatus: "success",
          order,
          payment,
        }),
        cancel_url: buildFrontendReturnUrl({
          paymentStatus: "cancelled",
          order,
          payment,
        }),
      });

      payment.txRef = session.id;
      payment.gatewayMeta = {
        ...(payment.gatewayMeta || {}),
        stripeSessionId: session.id,
      };
      await payment.save();

      await markOrderPaymentPending(order, payment, {
        stripeSessionId: session.id,
      });

      return res.json({
        success: true,
        checkoutUrl: session.url,
        paymentId: payment._id,
      });
    } catch (stripeError) {
      await payment.deleteOne();
      throw stripeError;
    }
  } catch (err) {
    console.error("createStripeCheckout error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const stripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(500).send("Stripe is not configured");
  }

  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      const payment = await Payment.findById(paymentId).populate({
        path: "orderId",
        populate: [
          { path: "vehicle" },
          { path: "customer", select: "name email phone" },
        ],
      });

      if (payment?.orderId && payment.status !== "success") {
        payment.txRef = session.id;

        await markOrderPaymentSuccessful(payment.orderId, payment, {
          paidAt: session.created ? new Date(session.created * 1000) : new Date(),
          stripeSessionId: session.id,
          paymentIntent: session.payment_intent,
          externalReceipt: session.payment_intent,
          amountTotal: session.amount_total,
          currency: session.currency,
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      const payment = await Payment.findById(paymentId).populate("orderId");

      if (payment?.orderId && payment.status === "pending") {
        await markOrderPaymentFailed(payment.orderId, payment, {
          stripeSessionId: session.id,
          reason: "checkout.session.expired",
        });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("stripeWebhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    let payment = await Payment.findById(req.params.id).populate({
      path: "orderId",
      select: "customer paymentStatus depositPaid finalPaymentDone balanceAmount",
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const order = payment.orderId;
    const isOwner =
      String(payment.customerId) === String(req.user._id) ||
      String(order?.customer) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    payment = await reconcilePendingMpesaPayment(payment);

    if (!payment.orderId) {
      await payment.populate({
        path: "orderId",
        select: "customer paymentStatus depositPaid finalPaymentDone balanceAmount",
      });
    }

    const statusSummary = buildPaymentStatusSummary(payment);

    return res.json({
      success: true,
      payment: {
        _id: payment._id,
        method: payment.method,
        type: payment.type,
        amount: payment.amount,
        currency: payment.currency,
        receiptNumber: payment.receiptNumber,
        paidAt: payment.paidAt,
        updatedAt: payment.updatedAt,
        gatewayReference:
          payment.gatewayMeta?.mpesaReceiptNumber ||
          payment.gatewayMeta?.externalReceipt ||
          payment.txRef,
        ...statusSummary,
      },
      order: order
        ? {
            _id: order._id,
            paymentStatus: order.paymentStatus,
            depositPaid: order.depositPaid,
            finalPaymentDone: order.finalPaymentDone,
            balanceAmount: order.balanceAmount,
          }
        : null,
    });
  } catch (err) {
    console.error("getPaymentStatus error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({
      path: "orderId",
      populate: [
        { path: "vehicle" },
        { path: "customer", select: "name email phone" },
      ],
    });

    if (!payment?.orderId) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const order = payment.orderId;
    const customerId = order.customer?._id || order.customer;
    const isOwner = String(customerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "A receipt is only available for successful payments",
      });
    }

    const receiptBuffer = await generateReceiptPdfBuffer({
      order,
      payment,
      customer: order.customer,
      vehicle: order.vehicle,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${buildReceiptFilename(payment)}`
    );

    return res.send(receiptBuffer);
  } catch (err) {
    console.error("downloadPaymentReceipt error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
