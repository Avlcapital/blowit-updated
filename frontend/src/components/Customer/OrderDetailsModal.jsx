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

/* ---------------- HELPERS ---------------- */
const getFileType = (url = "") => {
  const u = url.toLowerCase();
  if (u.endsWith(".pdf")) return "pdf";
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  return "other";
};

const getFileName = (url = "", index = 0) => {
  try {
    return decodeURIComponent(url.split("/").pop().split("?")[0]);
  } catch {
    return `Document-${index + 1}`;
  }
};
/* ----------------------------------------- */

const OrderDetailsModal = ({ order, onClose, onUpdated }) => {
  const vehicle = order.vehicle || {};
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const orderCode = `BLW-${String(order._id).slice(-6).toUpperCase()}`;

  const canRequestCancel =
    !order.cancellationRequested &&
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
      alert(err.response?.data?.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const docs = order.shippingDocs || [];
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
          {/* LEFT */}
          <div className="co-modal-left">
            <img
              src={vehicle.images?.[0]?.url || "/placeholder-car.jpg"}
              alt="vehicle"
              className="co-modal-main-img"
            />

            <h3>
              {vehicle.title ||
                `${vehicle.brand || ""} ${vehicle.model || ""}`}
            </h3>

            <p>
              <FaMapMarkerAlt /> {vehicle.location || "Japan / Mombasa"}
            </p>

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
          </div>

          {/* RIGHT */}
          <div className="co-modal-right">
            {/* SUMMARY */}
            <div className="co-box">
              <h4>Order Summary</h4>
              <p>Status: <strong>{order.status}</strong></p>
              <p>Order Date: <strong>{createdAt.toLocaleString()}</strong></p>
              <p>Total: <strong>KES {order.totalPrice?.toLocaleString()}</strong></p>
              <p>Deposit: <strong>KES {order.depositAmount?.toLocaleString()}</strong></p>
              <p>Balance: <strong>KES {order.balanceAmount?.toLocaleString()}</strong></p>
            </div>

            {/* DOCUMENTS */}
            <div className="co-box">
              <h4>Documents</h4>

              {docs.length === 0 ? (
                <p className="co-docs-none">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="co-docs-list">
                  {docs.map((d, idx) => {
                    const type = getFileType(d.url);
                    const name = getFileName(d.url, idx);

                    return (
                      <li key={idx} className="co-doc-item">
                        <FaFileAlt />
                        <span className="co-doc-name">{name}</span>

                        {(type === "pdf" || type === "image") && (
                          <button
                            className="co-doc-btn"
                            onClick={() => setPreviewDoc(d)}
                          >
                            Preview
                          </button>
                        )}

                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="co-doc-download"
                        >
                          Download
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* PREVIEW PANEL */}
              {previewDoc && (
                <div className="co-doc-preview">
                  <div className="co-doc-preview-header">
                    <span>Preview</span>
                    <FaTimes onClick={() => setPreviewDoc(null)} />
                  </div>

                  {getFileType(previewDoc.url) === "pdf" ? (
                    <iframe
                      src={previewDoc.url}
                      title="Document Preview"
                      width="100%"
                      height="400"
                    />
                  ) : (
                    <img
                      src={previewDoc.url}
                      alt="Preview"
                      style={{ width: "100%", maxHeight: "400px" }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* CANCELLATION */}
            <div className="co-box">
              <h4>Cancellation</h4>

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
                        placeholder="Why do you want to cancel?"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <button
                        disabled={sending}
                        onClick={handleCancelRequest}
                      >
                        {sending ? "Sending..." : "Submit"}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p>This order cannot be cancelled.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsModal;
