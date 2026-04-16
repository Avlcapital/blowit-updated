import React, { useEffect, useState } from "react";
import { FaCreditCard, FaMobileAlt, FaTimes } from "react-icons/fa";
import "../../styles/customer/RequestImportModal.css";

import {
  createImportOrder,
  createStripeCheckout,
  getPaymentStatus,
  initiateMpesaStk,
} from "../../utils/apiOrders";

const MPESA_STATUS_POLL_MS = 4000;
const MPESA_STATUS_TIMEOUT_MS = 120000;

const getMpesaFeedback = (payment) => {
  if (!payment) {
    return {
      tone: "warning",
      message:
        "We could not confirm the payment result right now. Check My Orders in a moment.",
    };
  }

  if (payment.resolution === "success") {
    return {
      tone: "success",
      message:
        "Payment confirmed successfully. Your receipt has been generated and sent to your email.",
    };
  }

  if (payment.resolution === "cancelled") {
    return {
      tone: "danger",
      message:
        payment.message ||
        "The payment was cancelled on the phone. You can try again from My Orders.",
    };
  }

  if (payment.resolution === "attention") {
    return {
      tone: "warning",
      message:
        payment.message ||
        "We could not confirm this payment because the M-Pesa setup needs attention.",
    };
  }

  if (payment.resolution === "failed") {
    return {
      tone: "danger",
      message:
        payment.message ||
        "The payment was not completed. You can retry it from My Orders.",
    };
  }

  return {
    tone: "info",
    message:
      payment.message ||
      "STK push sent. Complete the prompt on your phone to finish the payment.",
  };
};

const RequestImportModal = ({ vehicle, onClose }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [depositPercent, setDepositPercent] = useState(30);
  const [payMethod, setPayMethod] = useState("mpesa"); // "mpesa" | "card"
  const [loading, setLoading] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState({
    tone: "info",
    message: "",
  });

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setFullName(savedUser.name || "");
      setPhone(savedUser.phone || "");
      setEmail(savedUser.email || "");
    } catch {
      // Ignore local storage parse issues and keep fields empty.
    }
  }, []);

  useEffect(() => {
    if (!pendingPaymentId) return undefined;

    let isActive = true;
    let isChecking = false;
    const startedAt = Date.now();

    const finishPolling = (feedback) => {
      if (!isActive) return;
      setPaymentFeedback(feedback);
      setPendingPaymentId("");
    };

    const pollPayment = async () => {
      if (isChecking) return;

      if (Date.now() - startedAt >= MPESA_STATUS_TIMEOUT_MS) {
        finishPolling({
          tone: "warning",
          message:
            "The STK prompt was sent, but confirmation is taking longer than usual. Check My Orders shortly.",
        });
        return;
      }

      isChecking = true;

      try {
        const response = await getPaymentStatus(pendingPaymentId);
        const payment = response.data?.payment;
        const feedback = getMpesaFeedback(payment);

        if (payment?.resolution === "pending") {
          if (isActive) {
            setPaymentFeedback(feedback);
          }
          return;
        }

        finishPolling(feedback);
      } catch {
        // Keep polling for transient network or callback delays.
      } finally {
        isChecking = false;
      }
    };

    pollPayment();
    const intervalId = window.setInterval(pollPayment, MPESA_STATUS_POLL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [pendingPaymentId]);

  const handleSubmit = async () => {
    if (payMethod === "mpesa" && (!fullName || !phone || !email)) {
      return alert("Please fill full name, contact phone, and email for M-Pesa.");
    }

    try {
      setLoading(true);

      // 1) Create Order
      const orderPayload = {
        vehicleId: vehicle._id,
        fullName,
        phone,
        email,
        depositPercent,
      };

      const resOrder = await createImportOrder(orderPayload);
      if (!resOrder.data?.success) return alert("Order creation failed");

      const orderId = resOrder.data.order._id;

      // 2) Pay
      if (payMethod === "mpesa") {
        const resPay = await initiateMpesaStk({
          orderId,
          phone,
          paymentType: "deposit",
        });
        if (!resPay.data?.success) return alert(resPay.data?.message || "STK push failed");
        if (!resPay.data?.paymentId) {
          return alert("The payment prompt was sent, but we could not track its status.");
        }

        setPaymentFeedback({
          tone: "info",
          message:
            "STK push sent. Complete the prompt on your phone and wait here for confirmation.",
        });
        setPendingPaymentId(resPay.data.paymentId);
        return;
      }

      if (payMethod === "card") {
        const resPay = await createStripeCheckout({
          orderId,
          paymentType: "deposit",
        });
        if (!resPay.data?.success) return alert("Card payment failed");
        window.location.href = resPay.data.checkoutUrl;
        return;
      }
    } catch (err) {
      console.error("RequestImport error:", err);
      alert(
        err?.response?.data?.message ||
          "The order may have been created, but payment did not finish. You can retry from My Orders."
      );
    } finally {
      setLoading(false);
    }
  };

  const depositValue = Math.round((depositPercent / 100) * vehicle.price);
  const balanceValue = Math.max(Number(vehicle.price || 0) - depositValue, 0);
  const isWaitingForMpesa = Boolean(pendingPaymentId);
  const hasMpesaResolution =
    payMethod === "mpesa" &&
    !isWaitingForMpesa &&
    ["success", "danger", "warning"].includes(paymentFeedback.tone) &&
    Boolean(paymentFeedback.message);

  return (
    <>
      <div className="rim-overlay" onClick={onClose}></div>

      <div className="rim-modal">
        <div className="rim-header">
          <h2>Complete Import Request</h2>
          <FaTimes className="rim-close" onClick={onClose} />
        </div>

        <div className="rim-section">
          <p><strong>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</strong></p>
          <p>Price: KES {Number(vehicle.price).toLocaleString()}</p>
        </div>

        {/* Deposit slider */}
        <div className="rim-section">
          <label>Deposit Percentage ({depositPercent}%)</label>
          <input
            type="range"
            min="20"
            max="70"
            value={depositPercent}
            disabled={loading || isWaitingForMpesa}
            onChange={(e) => setDepositPercent(Number(e.target.value))}
          />
          <p>
            Deposit: <strong>KES {depositValue.toLocaleString()}</strong>
          </p>
          <p className="rim-balance-note">
            Balance after deposit: <strong>KES {balanceValue.toLocaleString()}</strong>
          </p>
        </div>

        <div className="rim-method-block">
          <div className="rim-section-head">
            <span>Payment Method</span>
          </div>

          <div className="rim-tabs">
            <button
              className={payMethod === "mpesa" ? "active" : ""}
              onClick={() => setPayMethod("mpesa")}
              type="button"
              disabled={loading || isWaitingForMpesa}
            >
              M-Pesa STK
            </button>
            <button
              className={payMethod === "card" ? "active" : ""}
              onClick={() => setPayMethod("card")}
              type="button"
              disabled={loading || isWaitingForMpesa}
            >
              Card (Visa/Mastercard)
            </button>
          </div>

        </div>

        {payMethod === "mpesa" ? (
          <div className="rim-form rim-payment-box">
            <div className="rim-payment-head mpesa">
              <FaMobileAlt />
              <span>Customer Contact Details</span>
            </div>

            <label>Full Name</label>
            <input
              value={fullName}
              disabled={loading || isWaitingForMpesa}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label>Contact Phone</label>
            <input
              value={phone}
              disabled={loading || isWaitingForMpesa}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
            />

            <label>Email</label>
            <input
              value={email}
              disabled={loading || isWaitingForMpesa}
              onChange={(e) => setEmail(e.target.value)}
            />

            {paymentFeedback.message ? (
              <div className={`rim-payment-status ${paymentFeedback.tone}`}>
                {paymentFeedback.message}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rim-payment-box card">
            <div className="rim-payment-head card">
              <FaCreditCard />
              <span>Card Checkout Details</span>
            </div>

            <label>Cardholder Name</label>
            <input value={fullName} readOnly className="rim-readonly" />

            <label>Card Number</label>
            <input
              value="Entered securely on the next page"
              readOnly
              className="rim-readonly"
            />

            <div className="rim-card-grid">
              <div>
                <label>Expiry</label>
                <input value="MM / YY" readOnly className="rim-readonly" />
              </div>
              <div>
                <label>CVC</label>
                <input value="CVC" readOnly className="rim-readonly" />
              </div>
            </div>
          </div>
        )}

        <button
          className="rim-submit-btn"
          onClick={hasMpesaResolution ? onClose : handleSubmit}
          disabled={loading || isWaitingForMpesa}
        >
          {loading
            ? "Processing..."
            : isWaitingForMpesa
            ? "Waiting for payment confirmation..."
            : hasMpesaResolution
            ? "Close"
            : payMethod === "mpesa"
            ? "Submit & Pay Deposit via M-Pesa"
            : "Continue to Secure Card Checkout"}
        </button>
      </div>
    </>
  );
};

export default RequestImportModal;
