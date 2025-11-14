import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/customer/RequestImportModal.css";

import { createImportOrder, initiatePesaLinkPayment } from "../../utils/apiOrders";

const RequestImportModal = ({ vehicle, onClose }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !phone || !email) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      /* Step 1: Create order on the backend */
      const orderPayload = {
        vehicleId: vehicle._id,
        fullName,
        phone,
        email,
        price: vehicle.price,
        depositAmount: Math.round(vehicle.price * 0.30), // 30% deposit
      };

      const resOrder = await createImportOrder(orderPayload);

      if (!resOrder.data.success) {
        alert("Order creation failed");
        setLoading(false);
        return;
      }

      const orderId = resOrder.data.order._id;
      const depositAmount = resOrder.data.order.depositAmount;

      /* Step 2: Request PesaLink payment URL */
      const resPay = await initiatePesaLinkPayment({
        orderId,
        amount: depositAmount,
        phone,
        email,
      });

      if (!resPay.data.success) {
        alert("Payment init failed");
        setLoading(false);
        return;
      }

      /* Step 3: Redirect to iPay */
      window.location.href = resPay.data.redirectUrl;

    } catch (err) {
      console.error("RequestImport failed:", err);
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
          <h2>Proceed With Import</h2>
          <FaTimes className="rim-close" onClick={onClose} />
        </div>

        <p className="rim-vehicle">
          Vehicle: <strong>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</strong>
        </p>
        <p className="rim-price">
          Deposit Required: <strong>KES {(vehicle.price * 0.3).toLocaleString()}</strong>
        </p>

        <div className="rim-form">
          <label>Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label>Email Address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button
          className="rim-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Processing..." : "Submit & Pay Deposit"}
        </button>
      </div>
    </>
  );
};

export default RequestImportModal;
