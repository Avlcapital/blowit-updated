import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaFileAlt,
  FaTimes,
} from "react-icons/fa";

import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import CustomerLayout from "../../components/Customer/CustomerLayout";
import OrderDetailsModal from "../../components/Customer/OrderDetailsModal";

import "../../styles/customer/CustomerOrders.css";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (targetPage = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: targetPage,
        limit: 10,
        sort,
      });
      if (status && status !== "all") params.append("status", status);

      const res = await api.get(
        `${BASE_URL}/api/orders/my?${params.toString()}`
      );

      if (res.data.success) {
        setOrders(res.data.orders);
        setPage(res.data.page);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error("Failed to load customer orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line
  }, [status, sort]);

  const statusBadgeClass = (s) => {
    if (!s) return "co-badge neutral";
    const v = s.toUpperCase();
    if (v === "PENDING") return "co-badge pending";
    if (v === "APPROVED") return "co-badge approved";
    if (["SHIPPING", "IN_TRANSIT"].includes(v)) return "co-badge shipping";
    if (["COMPLETED"].includes(v)) return "co-badge completed";
    if (["CANCELLED", "REJECTED"].includes(v)) return "co-badge cancelled";
    return "co-badge neutral";
  };

  return (
    <CustomerLayout>
      <div className="co-header">
        <div>
          <h1>My Orders</h1>
          <p>Track all your AVLC import requests & shipping progress.</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="co-filters-row">
        <div className="co-filter-group">
          <FaFilter />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SHIPPING">Shipping</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="co-filter-group">
          <FaSearch />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <p className="co-loading">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="co-empty">You have no orders yet.</p>
      ) : (
        <div className="co-table-wrap">
          <table className="co-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Total</th>
                <th>Deposit</th>
                <th>Balance</th>
                <th>Date</th>
                <th>Docs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const v = o.vehicle || {};
                const orderCode = `BLW-${String(o._id).slice(-6).toUpperCase()}`;
                const docsCount = o.shippingDocs?.length || 0;

                return (
                  <tr key={o._id}>
                    <td>
                      <span className="co-order-code">{orderCode}</span>
                    </td>
                    <td>
                      <div className="co-vehicle-cell">
                        <img
                          src={v.images?.[0]?.url || "/placeholder-car.jpg"}
                          alt="car"
                        />
                        <div>
                          <div className="co-vehicle-title">
                            {v.title || `${v.brand || ""} ${v.model || ""}`}
                          </div>
                          <div className="co-vehicle-sub">
                            {v.year} • {v.fuelType} • {v.transmission}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={statusBadgeClass(o.status)}>
                        {o.status}
                      </span>
                      {o.cancellationRequested && (
                        <div className="co-cancel-tag">
                          Cancellation requested
                        </div>
                      )}
                    </td>
                    <td>KES {Number(o.totalPrice || 0).toLocaleString()}</td>
                    <td>KES {Number(o.depositAmount || 0).toLocaleString()}</td>
                    <td>KES {Number(o.balanceAmount || 0).toLocaleString()}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      {docsCount > 0 ? (
                        <span className="co-docs-pill">
                          <FaFileAlt /> {docsCount} file
                          {docsCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="co-docs-none">No docs yet</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="co-view-btn"
                        onClick={() => setSelectedOrder(o)}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      {!loading && pages > 1 && (
        <div className="co-pager">
          <button
            disabled={page <= 1}
            onClick={() => fetchOrders(page - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => fetchOrders(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Order details modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => fetchOrders(page)}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerOrders;
