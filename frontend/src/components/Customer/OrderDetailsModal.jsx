import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaMapMarkerAlt,
  FaFileAlt,
  FaMoneyBillWave,
  FaDownload,
  FaReceipt,
} from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import { downloadPaymentReceipt } from "../../utils/apiOrders";
import "../../styles/customer/CustomerOrders.css";

const getFileType = (url = "") => {
  const value = url.toLowerCase();
  if (value.endsWith(".pdf")) return "pdf";
  if (value.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  return "other";
};

const getFileName = (url = "", index = 0) => {
  try {
    return decodeURIComponent(url.split("/").pop().split("?")[0]);
  } catch {
    return `Document-${index + 1}`;
  }
};

const formatPaymentType = (type) =>
  type === "balance" ? "Balance Payment" : "Deposit Payment";

const formatPaymentMethod = (method) =>
  method === "CARD" ? "Credit Card" : "M-Pesa";

const OrderDetailsModal = ({ order, onClose, onUpdated, onPayOrder }) => {
  const [orderData, setOrderData] = useState(order);
  const [payments, setPayments] = useState([]);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      try {
        setLoadingOrder(true);
        const response = await api.get(`${BASE_URL}/api/orders/my/${order._id}`);

        if (!isMounted || !response.data?.success) return;

        setOrderData(response.data.order || order);
        setPayments(response.data.payments || []);
      } catch {
        if (isMounted) {
          setOrderData(order);
          setPayments([]);
        }
      } finally {
        if (isMounted) {
          setLoadingOrder(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [order]);

  const activeOrder = orderData || order;
  const vehicle = activeOrder.vehicle || {};
  const orderCode = `BLW-${String(activeOrder._id).slice(-6).toUpperCase()}`;

  const canRequestCancel =
    !activeOrder.cancellationRequested &&
    !["COMPLETED", "CANCELLED", "REJECTED"].includes(
      (activeOrder.status || "").toUpperCase()
    );

  const canPayOutstanding =
    (!activeOrder.depositPaid && Number(activeOrder.depositAmount || 0) > 0) ||
    (activeOrder.depositPaid &&
      !activeOrder.finalPaymentDone &&
      Number(activeOrder.balanceAmount || 0) > 0);

  const payButtonLabel = !activeOrder.depositPaid
    ? "Pay Deposit"
    : "Complete Payment";

  const handleCancelRequest = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    try {
      setSending(true);
      const response = await api.post(
        `${BASE_URL}/api/orders/${activeOrder._id}/request-cancel`,
        { reason }
      );

      if (response.data.success) {
        alert("Cancellation request submitted.");
        onUpdated?.();
        onClose();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const handleReceiptDownload = async (paymentId) => {
    try {
      setDownloadingReceiptId(paymentId);
      await downloadPaymentReceipt(paymentId);
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "The receipt could not be downloaded right now."
      );
    } finally {
      setDownloadingReceiptId("");
    }
  };

  const docs = activeOrder.shippingDocs || [];
  const createdAt = new Date(activeOrder.createdAt);

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
              <FaStopwatch /> Year: {vehicle.year || "N/A"}
            </p>
            <p>
              <FaCarSide /> Mileage:{" "}
              {Number(vehicle.mileage || 0).toLocaleString()} km
            </p>
            <p>
              <FaGasPump /> Fuel: {vehicle.fuelType || "N/A"}
            </p>
          </div>

          <div className="co-modal-right">
            <div className="co-box">
              <div className="co-box-head">
                <h4>Order Summary</h4>
                {canPayOutstanding && onPayOrder && (
                  <button
                    className="co-pay-inline-btn"
                    onClick={() => onPayOrder?.(activeOrder)}
                  >
                    <FaMoneyBillWave /> {payButtonLabel}
                  </button>
                )}
              </div>

              <p>Status: <strong>{activeOrder.status}</strong></p>
              <p>
                Order Date: <strong>{createdAt.toLocaleString()}</strong>
              </p>
              <p>
                Total:{" "}
                <strong>
                  KES {Number(activeOrder.totalPrice || 0).toLocaleString()}
                </strong>
              </p>
              <p>
                Deposit:{" "}
                <strong>
                  KES {Number(activeOrder.depositAmount || 0).toLocaleString()}
                </strong>
              </p>
              <p>
                Balance:{" "}
                <strong>
                  KES {Number(activeOrder.balanceAmount || 0).toLocaleString()}
                </strong>
              </p>
              <div className="co-payment-state-row">
                <span
                  className={`co-payment-state ${
                    !activeOrder.depositPaid
                      ? "warning"
                      : activeOrder.finalPaymentDone
                      ? "success"
                      : "info"
                  }`}
                >
                  {!activeOrder.depositPaid
                    ? "Deposit pending"
                    : activeOrder.finalPaymentDone
                    ? "Fully paid"
                    : "Balance pending"}
                </span>
              </div>
            </div>

            <div className="co-box">
              <div className="co-box-head">
                <h4>Payment History</h4>
                <span className="co-payment-count">
                  {payments.length} record{payments.length === 1 ? "" : "s"}
                </span>
              </div>

              {loadingOrder ? (
                <p className="co-docs-none">Loading payment records...</p>
              ) : payments.length === 0 ? (
                <p className="co-docs-none">
                  No payment has been confirmed for this order yet.
                </p>
              ) : (
                <div className="co-payment-list">
                  {payments.map((payment) => (
                    <div key={payment._id} className="co-payment-item">
                      <div>
                        <div className="co-payment-item-title">
                          <FaReceipt /> {formatPaymentType(payment.type)}
                        </div>
                        <div className="co-payment-item-meta">
                          {formatPaymentMethod(payment.method)} • KES{" "}
                          {Number(payment.amount || 0).toLocaleString()}
                        </div>
                        <div className="co-payment-item-meta">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleString()
                            : new Date(payment.createdAt).toLocaleString()}
                        </div>
                        {payment.receiptNumber && (
                          <div className="co-payment-item-meta">
                            Receipt: {payment.receiptNumber}
                          </div>
                        )}
                      </div>

                      <div className="co-payment-item-actions">
                        <span
                          className={`co-payment-pill ${
                            payment.status === "success"
                              ? "success"
                              : payment.status === "failed"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          {payment.status}
                        </span>

                        {payment.status === "success" && (
                          <button
                            className="co-doc-btn"
                            onClick={() => handleReceiptDownload(payment._id)}
                            disabled={downloadingReceiptId === payment._id}
                          >
                            <FaDownload />
                            {downloadingReceiptId === payment._id
                              ? "Preparing..."
                              : "Receipt"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="co-box">
              <h4>Documents</h4>

              {docs.length === 0 ? (
                <p className="co-docs-none">No documents uploaded yet.</p>
              ) : (
                <ul className="co-docs-list">
                  {docs.map((doc, index) => {
                    const fileType = getFileType(doc.url);
                    const fileName = getFileName(doc.url, index);

                    return (
                      <li key={index} className="co-doc-item">
                        <FaFileAlt />
                        <span className="co-doc-name">{fileName}</span>

                        {(fileType === "pdf" || fileType === "image") && (
                          <button
                            className="co-doc-btn"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            Preview
                          </button>
                        )}

                        <a
                          href={doc.url}
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
                        onChange={(event) => setReason(event.target.value)}
                      />
                      <button disabled={sending} onClick={handleCancelRequest}>
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
