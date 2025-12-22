import React, { useEffect, useState, useCallback } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { FaEdit, FaTrash, FaFileUpload, FaSearch, FaBolt } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import OrderStatusModal from "../../components/Admin/OrderStatusModal";
import UploadDocsModal from "../../components/Admin/UploadDocsModal";
import "../../styles/admin/AdminOrders.css";
import { getSocket } from "../../utils/socket";

const AdminOrders = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [live, setLive] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await api.get(`${BASE_URL}/api/orders?${params.toString()}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time subscriptions
  useEffect(() => {
    const s = getSocket();

    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);

    const onCreated = ({ order }) => {
      setOrders((prev) => [order, ...prev]); // prepend new
    };
    const onUpdated = ({ orderId, order }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? order : o)));
    };
    const onDeleted = ({ orderId }) => {
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    };
    const onDocs = ({ orderId, order }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? order : o)));
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("order:created", onCreated);
    s.on("order:updated", onUpdated);
    s.on("order:deleted", onDeleted);
    s.on("order:docs", onDocs);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("order:created", onCreated);
      s.off("order:updated", onUpdated);
      s.off("order:deleted", onDeleted);
      s.off("order:docs", onDocs);
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await api.delete(`${BASE_URL}/api/orders/${id}`);
      // No need to refetch: socket will deliver order:deleted to everyone
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = () => fetchOrders();
  const resetFilters = () => { setFilters({ q: "", status: "" }); };

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />

        <div className="admin-content">
          <div className="orders-header">
            <h2>Orders Management</h2>
            <div className={`live-badge ${live ? "on" : "off"}`}>
              <FaBolt /> {live ? "Live" : "Offline"}
            </div>
          </div>

          {/* Filters */}
          <div className="orders-filters">
            <div className="search-group">
              <FaSearch className="search-icon" />
              <input
                name="q"
                placeholder="Search by name or vehicle..."
                value={filters.q}
                onChange={handleFilterChange}
              />
            </div>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Financed</option>
              <option>Shipped</option>
              <option>Arrived</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>

            <button className="btn filter" onClick={applyFilters}>Apply</button>
            <button className="btn reset" onClick={resetFilters}>Reset</button>
          </div>

          {/* Table */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Deposit</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        {o.vehicle?.title || `${o.vehicle?.brand} ${o.vehicle?.model}`} ({o.vehicle?.year})
                      </td>
                      <td>{o.customer?.name || "Unknown"}</td>
                      <td>{o.totalPrice?.toLocaleString()}</td>
                      <td>{o.depositAmount?.toLocaleString()}</td>
                      <td>{o.balanceAmount?.toLocaleString()}</td>
                      <td><span className={`status ${o.status?.toLowerCase()}`}>{o.status}</span></td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="row-actions">
                        <button
                          className="edit-btn"
                          onClick={() => { setSelectedOrder(o); setShowStatusModal(true); }}
                          title="Update status"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => { setSelectedOrder(o); setShowDocsModal(true); }}
                          title="Upload docs"
                        >
                          <FaFileUpload />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(o._id)}
                          title="Delete order"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showStatusModal && selectedOrder && (
        <OrderStatusModal
          order={selectedOrder}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showDocsModal && selectedOrder && (
        <UploadDocsModal
          order={selectedOrder}
          onClose={() => setShowDocsModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default AdminOrders;
