import React, { useState } from "react";
import { FaTimes, FaSave, FaCheckCircle } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/AdminOrders.css";

const stages = [
  { key: "depositPaid", label: "Deposit Paid" },
  { key: "financedByAvlc", label: "Financed" },
  { key: "status:Shipped", label: "Shipped" },
  { key: "status:Arrived", label: "Arrived" },
  { key: "finalPaymentDone", label: "Completed" },
];

const OrderStatusModal = ({ order, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    depositPaid: order.depositPaid,
    financedByAvlc: order.financedByAvlc,
    finalPaymentDone: order.finalPaymentDone,
    status: order.status,
    notes: order.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`${BASE_URL}/api/orders/${order._id}`, form);
      alert("Order updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const isStageComplete = (stageKey) => {
    if (stageKey.includes("status:")) {
      const s = stageKey.split(":")[1];
      const statusOrder = [
        "Pending",
        "Processing",
        "Financed",
        "Shipped",
        "Arrived",
        "Completed",
      ];
      return (
        statusOrder.indexOf(order.status) >= statusOrder.indexOf(s)
      );
    }
    return order[stageKey];
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Order Progress — #{order._id.slice(-6)}</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        {/* Timeline */}
        <div className="timeline">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className={`timeline-step ${
                isStageComplete(stage.key) ? "completed" : ""
              }`}
            >
              <FaCheckCircle className="timeline-icon" />
              <span>{stage.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="depositPaid"
                checked={form.depositPaid}
                onChange={handleChange}
              />
              Deposit Paid
            </label>

            <label>
              <input
                type="checkbox"
                name="financedByAvlc"
                checked={form.financedByAvlc}
                onChange={handleChange}
              />
              Financing Approved
            </label>

            <label>
              <input
                type="checkbox"
                name="finalPaymentDone"
                checked={form.finalPaymentDone}
                onChange={handleChange}
              />
              Final Payment Done
            </label>
          </div>

          <select name="status" value={form.status} onChange={handleChange}>
            <option>Pending</option>
            <option>Processing</option>
            <option>Financed</option>
            <option>Shipped</option>
            <option>Arrived</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          <textarea
            name="notes"
            placeholder="Admin notes..."
            value={form.notes}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : <><FaSave /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusModal;
