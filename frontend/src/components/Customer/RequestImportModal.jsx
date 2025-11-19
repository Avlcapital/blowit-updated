import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/customer/RequestImportModal.css";

import { createImportOrder, initiatePesaLinkPayment } from "../../utils/apiOrders";

const RequestImportModal = ({ vehicle, onClose }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [depositPercent, setDepositPercent] = useState(30);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !phone || !email) return alert("Please fill all fields");

    try {
      setLoading(true);

      const orderPayload = {
        vehicleId: vehicle._id,
        fullName,
        phone,
        email,
        depositPercent,
      };

      const resOrder = await createImportOrder(orderPayload);
      if (!resOrder.data.success) return alert("Order creation failed");

      const orderId = resOrder.data.order._id;
      const resPay = await initiatePesaLinkPayment({
        orderId,
        phone,
        email,
      });

      if (!resPay.data.success) return alert("Payment failed");

      window.location.href = resPay.data.redirectUrl;

    } catch (err) {
      console.error("RequestImport error:", err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

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
          <p>Price: KES {vehicle.price.toLocaleString()}</p>
        </div>

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
            Deposit: <strong>
              KES {Math.round((depositPercent / 100) * vehicle.price).toLocaleString()}
            </strong>
          </p>
        </div>

        <div className="rim-form">
          <label>Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button className="rim-submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Submit & Pay Deposit"}
        </button>
      </div>
    </>
  );
};

export default RequestImportModal;
