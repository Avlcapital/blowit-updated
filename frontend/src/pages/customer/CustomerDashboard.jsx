import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import CustomerLayout from "../../components/Customer/CustomerLayout";
import "../../styles/customer/CustomerDashboard.css";
import { io } from "socket.io-client";

const CustomerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/customer/dashboard`);
      setStats(res.data.stats); //
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // FETCH ON PAGE LOAD
    fetchDashboardStats();

    // SOCKET LISTENER
    const socket = io(BASE_URL);

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?._id) {
      socket.on(`customer:${storedUser._id}`, (msg) => {
        if (msg.type === "dashboard-update") {
          fetchDashboardStats();
        }
      });
    }

    return () => socket.disconnect();
  }, []);

  return (
    <CustomerLayout>
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Welcome Back </h1>
        <p>Your personalized import & order tracking area</p>
      </div>

      {/* LOADING */}
      {loading && <p className="loading-text">Loading your dashboard...</p>}

      {/* DASHBOARD CONTENT */}
      {!loading && stats && (
        <>
          {/* STATS CARDS */}
          <div className="stats-cards">
            <div className="card">
              <h3>My Orders</h3>
              <p>{stats.orders}</p>
              <span>Total orders placed</span>
            </div>

            <div className="card warning">
              <h3>Pending Payments</h3>
              <p>{stats.pendingPayments}</p>
              <span>Awaiting deposit or balance</span>
            </div>

            <div className="card success">
              <h3>Documents Uploaded</h3>
              <p>{stats.documents}</p>
              <span>Shipping & clearance docs</span>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="dashboard-actions">
            <h2>Quick Actions</h2>
            <div className="action-grid">
              <a href="/vehicles" className="action-card">
                Browse Vehicles
              </a>
              <a href="/customer/orders" className="action-card">
                View My Orders
              </a>
              <a href="/customer/profile" className="action-card">
                Update Profile
              </a>
            </div>
          </div>
        </>
      )}
    </CustomerLayout>
  );
};

export default CustomerDashboard;
