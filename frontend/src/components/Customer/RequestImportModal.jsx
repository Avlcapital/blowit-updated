import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/customer/RequestImportModal.css";

import { createImportOrder, initiateMpesaStk, createStripeCheckout } from "../../utils/apiOrders";

const RequestImportModal = ({ vehicle, onClose }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [depositPercent, setDepositPercent] = useState(30);
  const [payMethod, setPayMethod] = useState("mpesa"); // "mpesa" | "card"
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !phone || !email) return alert("Please fill all fields");

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
        const resPay = await initiateMpesaStk({ orderId, phone });
        if (!resPay.data?.success) return alert(resPay.data?.message || "STK push failed");
        alert("STK Push sent. Check your phone and enter PIN.");
        onClose();
        return;
      }

      if (payMethod === "card") {
        const resPay = await createStripeCheckout({ orderId });
        if (!resPay.data?.success) return alert("Card payment failed");
        window.location.href = resPay.data.checkoutUrl;
        return;
      }
    } catch (err) {
      console.error("RequestImport error:", err);
      alert(err?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const depositValue = Math.round((depositPercent / 100) * vehicle.price);

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
            onChange={(e) => setDepositPercent(Number(e.target.value))}
          />
          <p>
            Deposit: <strong>KES {depositValue.toLocaleString()}</strong>
          </p>
        </div>

        {/* Payment Tabs */}
        <div className="rim-tabs">
          <button
            className={payMethod === "mpesa" ? "active" : ""}
            onClick={() => setPayMethod("mpesa")}
            type="button"
          >
            M-Pesa STK
          </button>
          {/*<button
            className={payMethod === "card" ? "active" : ""}
            onClick={() => setPayMethod("card")}
            type="button"
          >
            Card (Visa/Mastercard)
          </button>*/}
        </div>

        <div className="rim-form">
          <label>Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX or 2547XXXXXXXX" />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button className="rim-submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : payMethod === "mpesa" ? "Submit & Pay via M-Pesa" : "Submit & Pay by Card"}
        </button>
      </div>
    </>
  );
};

export default RequestImportModal;
