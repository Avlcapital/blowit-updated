import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import "../../styles/admin/AdminDashboard.css";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    vehicles: 0,
    customers: 0,
    orders: 0,
    payments: 0,
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`${BASE_URL}/api/admin/summary`);
        if (res.data.success) {
          setSummary(res.data.summary);
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        <div className="admin-content">
          <h1>Welcome, Admin 👋</h1>
          <p className="subtitle">Here’s a quick overview of Blowit operations.</p>

          {loading ? (
            <p>Loading dashboard...</p>
          ) : (
            <div className="admin-cards">
              <div className="card">
                <h3>Vehicles</h3>
                <p>{summary.vehicles}</p>
              </div>
              <div className="card">
                <h3>Customers</h3>
                <p>{summary.customers}</p>
              </div>
              <div className="card">
                <h3>Orders</h3>
                <p>{summary.orders}</p>
              </div>
              <div className="card">
                <h3>Payments</h3>
                <p>₵{summary.payments.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
