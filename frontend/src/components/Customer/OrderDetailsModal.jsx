import React, { useState } from "react";
import {
  FaTimes,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaMapMarkerAlt,
  FaFileAlt,
} from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/customer/CustomerOrders.css";

const OrderDetailsModal = ({ order, onClose, onUpdated }) => {
  const vehicle = order.vehicle || {};
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [showReasonBox, setShowReasonBox] = useState(false);

  const orderCode = `BLW-${String(order._id).slice(-6).toUpperCase()}`;

  const canRequestCancel = !order.cancellationRequested &&
    !["COMPLETED", "CANCELLED", "REJECTED"].includes(
      (order.status || "").toUpperCase()
    );

  const handleCancelRequest = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    try {
      setSending(true);
      const res = await api.post(
        `${BASE_URL}/api/orders/${order._id}/request-cancel`,
        { reason }
      );
      if (res.data.success) {
        alert("Cancellation request submitted.");
        onUpdated?.();
        onClose();
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to send cancellation request."
      );
    } finally {
      setSending(false);
    }
  };

  const docs = order.docs || [];
  const createdAt = new Date(order.createdAt);

  return (
    <>
      <div className="co-modal-overlay" onClick={onClose}></div>

      <div className="co-modal">
        <div className="co-modal-header">
          <div>
            <h2>Order Details</h2>
            <p>Order: {orderCode}</p>
          </div>
          <FaTimes className="co-modal-close" onClick={onClose} />
        </div>

        <div className="co-modal-body">
          {/* Left: Vehicle summary */}
          <div className="co-modal-left">
            <img
              src={vehicle.images?.[0]?.url || "/placeholder-car.jpg"}
              alt="vehicle"
              className="co-modal-main-img"
            />
            <h3 className="co-modal-vehicle-title">
              {vehicle.title || `${vehicle.brand || ""} ${vehicle.model || ""}`}
            </h3>
            <p className="co-modal-location">
              <FaMapMarkerAlt /> {vehicle.location || "Japan / Mombasa"}
            </p>

            <div className="co-modal-specs">
              <p>
                <FaStopwatch /> Year: {vehicle.year}
              </p>
              <p>
                <FaCarSide /> Mileage:{" "}
                {Number(vehicle.mileage || 0).toLocaleString()} km
              </p>
              <p>
                <FaGasPump /> Fuel: {vehicle.fuelType}
              </p>
              <p>Transmission: {vehicle.transmission}</p>
            </div>
          </div>

          {/* Right: Financials + docs + status */}
          <div className="co-modal-right">
            {/* Status & amounts */}
            <div className="co-box">
              <h4>Order Summary</h4>
              <p>
                Status: <strong>{order.status}</strong>
                {order.cancellationRequested && (
                  <span className="co-cancel-tag-inline">
                    Cancellation requested
                  </span>
                )}
              </p>
              <p>
                Order Date: <strong>{createdAt.toLocaleString()}</strong>
              </p>
              <p>
                Total Price:{" "}
                <strong>
                  KES {Number(order.totalPrice || 0).toLocaleString()}
                </strong>
              </p>
              <p>
                Deposit Paid:{" "}
                <strong>
                  KES {Number(order.depositAmount || 0).toLocaleString()}
                </strong>
              </p>
              <p>
                Balance Remaining:{" "}
                <strong>
                  KES {Number(order.balanceAmount || 0).toLocaleString()}
                </strong>
              </p>
            </div>

            {/* Docs */}
            <div className="co-box">
              <h4>Documents</h4>
              {docs.length === 0 ? (
                <p className="co-docs-none">
                  No documents uploaded yet. Once shipping docs are ready,
                  they will appear here.
                </p>
              ) : (
                <ul className="co-docs-list">
                  {docs.map((d, idx) => (
                    <li key={idx}>
                      <FaFileAlt />
                      <a href={d.url} target="_blank" rel="noreferrer">
                        {d.name || `Document ${idx + 1}`}
                      </a>
                      {d.type && <span className="co-doc-tag">{d.type}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cancellation request */}
            <div className="co-box">
              <h4>Need to cancel this order?</h4>
              {canRequestCancel ? (
                <>
                  {!showReasonBox ? (
                    <button
                      className="co-cancel-btn"
                      onClick={() => setShowReasonBox(true)}
                    >
                      Request Cancellation
                    </button>
                  ) : (
                    <>
                      <textarea
                        rows="3"
                        placeholder="Explain why you want to cancel this order..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      ></textarea>
                      <div className="co-cancel-actions">
                        <button
                          className="co-cancel-btn"
                          onClick={handleCancelRequest}
                          disabled={sending}
                        >
                          {sending ? "Sending..." : "Submit Request"}
                        </button>
                        <button
                          className="co-secondary-btn"
                          onClick={() => setShowReasonBox(false)}
                        >
                          <FaTimes /> Close
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="co-note">
                  This order cannot be cancelled because it is already{" "}
                  <strong>{order.status}</strong> or a request is in progress.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsModal;
