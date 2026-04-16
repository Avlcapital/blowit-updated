import React, { useEffect, useMemo, useState } from "react";
import {
  FaCreditCard,
  FaMobileAlt,
  FaTimes,
} from "react-icons/fa";
import {
  createStripeCheckout,
  getPaymentStatus,
  initiateMpesaStk,
} from "../../utils/apiOrders";
import "../../styles/customer/CustomerOrders.css";

const MPESA_STATUS_POLL_MS = 4000;
const MPESA_STATUS_TIMEOUT_MS = 120000;

const getMpesaFeedback = (payment) => {
  if (!payment) {
    return {
      tone: "warning",
      message:
        "We could not confirm the payment result right now. Check the order again shortly.",
    };
  }

  if (payment.resolution === "success") {
    return {
      tone: "success",
      message:
        "Payment confirmed successfully. Your receipt is ready and has also been emailed to you.",
    };
  }

  if (payment.resolution === "cancelled") {
    return {
      tone: "danger",
      message:
        payment.message ||
        "The payment was cancelled on the phone. You can try again when ready.",
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
        "The payment was not completed. You can retry it from this order.",
    };
  }

  return {
    tone: "info",
    message:
      payment.message ||
      "STK push sent. Complete the prompt on your phone to finish the payment.",
  };
};

const OrderPaymentModal = ({ order, onClose, onUpdated }) => {
  const [payMethod, setPayMethod] = useState("mpesa");
  const [phone, setPhone] = useState(order.phone || "");
  const [loading, setLoading] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState({
    tone: "info",
    message: "",
  });

  const paymentType = order.depositPaid ? "balance" : "deposit";
  const amount = useMemo(
    () =>
      paymentType === "balance"
        ? Number(order.balanceAmount || 0)
        : Number(order.depositAmount || 0),
    [order.balanceAmount, order.depositAmount, paymentType]
  );

  const vehicleTitle =
    order.vehicle?.title ||
    `${order.vehicle?.brand || ""} ${order.vehicle?.model || ""}`.trim() ||
    "Vehicle Import";

  useEffect(() => {
    if (!pendingPaymentId) return undefined;

    let isActive = true;
    let isChecking = false;
    const startedAt = Date.now();

    const finishPolling = (feedback) => {
      if (!isActive) return;
      setPaymentFeedback(feedback);
      setPendingPaymentId("");
      onUpdated?.();
    };

    const pollPayment = async () => {
      if (isChecking) return;

      if (Date.now() - startedAt >= MPESA_STATUS_TIMEOUT_MS) {
        finishPolling({
          tone: "warning",
          message:
            "The STK prompt was sent, but confirmation is taking longer than usual. Refresh this order shortly.",
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
        // Keep polling for transient delays while the callback settles.
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
  }, [onUpdated, pendingPaymentId]);

  const handleSubmit = async () => {
    if (payMethod === "mpesa" && !phone.trim()) {
      alert("Enter a phone number for M-Pesa payment.");
      return;
    }

    if (amount <= 0) {
      alert("This order has no payable amount.");
      return;
    }

    try {
      setLoading(true);

      if (payMethod === "mpesa") {
        const response = await initiateMpesaStk({
          orderId: order._id,
          phone,
          paymentType,
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "STK push failed");
        }

        if (!response.data?.paymentId) {
          throw new Error("The payment prompt was sent, but we could not track its status.");
        }

        setPaymentFeedback({
          tone: "info",
          message:
            "STK push sent. Complete the prompt on your phone and wait here for confirmation.",
        });
        setPendingPaymentId(response.data.paymentId);
        return;
      }

      const response = await createStripeCheckout({
        orderId: order._id,
        paymentType,
      });

      if (!response.data?.success || !response.data.checkoutUrl) {
        throw new Error(response.data?.message || "Card checkout failed");
      }

      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error.message ||
          "We could not start the payment right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const isWaitingForMpesa = Boolean(pendingPaymentId);
  const hasMpesaResolution =
    payMethod === "mpesa" &&
    !isWaitingForMpesa &&
    ["success", "danger", "warning"].includes(paymentFeedback.tone) &&
    Boolean(paymentFeedback.message);

  return (
    <>
      <div className="co-modal-overlay" onClick={onClose}></div>

      <div className="co-payment-modal">
        <div className="co-modal-header">
          <div>
            <h2>{paymentType === "balance" ? "Complete Payment" : "Pay Deposit"}</h2>
            <p>{vehicleTitle}</p>
          </div>
          <FaTimes className="co-modal-close" onClick={onClose} />
        </div>

        <div className="co-payment-summary">
          <div>
            <span>Amount Due</span>
            <strong>KES {amount.toLocaleString()}</strong>
          </div>
          <div>
            <span>Payment For</span>
            <strong>{paymentType === "balance" ? "Remaining balance" : "Deposit"}</strong>
          </div>
        </div>

        <div className="co-method-block">
          <div className="co-method-label">Payment Method</div>

          <div className="co-payment-tabs">
            <button
              type="button"
              className={payMethod === "mpesa" ? "active" : ""}
              onClick={() => setPayMethod("mpesa")}
              disabled={loading || isWaitingForMpesa}
            >
              M-Pesa
            </button>
            <button
              type="button"
              className={payMethod === "card" ? "active" : ""}
              onClick={() => setPayMethod("card")}
              disabled={loading || isWaitingForMpesa}
            >
              Credit Card
            </button>
          </div>

        </div>

        {payMethod === "mpesa" && (
          <div className="co-payment-panel">
            <div className="co-payment-panel-head">
              <FaMobileAlt />
              <span>M-Pesa STK Details</span>
            </div>

            <div className="co-payment-field">
              <label>STK Push Number</label>
              <input
                value={phone}
                disabled={loading || isWaitingForMpesa}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="07XXXXXXXX or 2547XXXXXXXX"
              />
            </div>

            {paymentFeedback.message ? (
              <div className={`co-payment-status ${paymentFeedback.tone}`}>
                {paymentFeedback.message}
              </div>
            ) : null}
          </div>
        )}

        {payMethod === "card" && (
          <div className="co-payment-panel card">
            <div className="co-payment-panel-head">
              <FaCreditCard />
              <span>Card Checkout Details</span>
            </div>

            <div className="co-payment-field">
              <label>Cardholder Name</label>
              <input
                value={order.fullName || ""}
                readOnly
                className="co-readonly-input"
              />
            </div>

            <div className="co-payment-field">
              <label>Card Number</label>
              <input
                value="Entered securely on the next page"
                readOnly
                className="co-readonly-input"
              />
            </div>

            <div className="co-card-grid">
              <div className="co-payment-field">
                <label>Expiry</label>
                <input value="MM / YY" readOnly className="co-readonly-input" />
              </div>
              <div className="co-payment-field">
                <label>CVC</label>
                <input value="CVC" readOnly className="co-readonly-input" />
              </div>
            </div>
          </div>
        )}

        <button
          className="co-pay-btn"
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
            ? `Pay ${paymentType === "balance" ? "Balance" : "Deposit"} via M-Pesa`
            : "Continue to Secure Card Checkout"}
        </button>
      </div>
    </>
  );
};

export default OrderPaymentModal;
