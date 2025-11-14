import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";

import CustomerLayout from "../../components/Customer/CustomerLayout";
import "../../styles/customer/CustomerDashboard.css";
import { io } from "socket.io-client";

const CustomerDashboard = () => {
  const [stats, setStats] = useState(null)

  const fetchDashboardStats = async () => {
    
    try {
      const res = await api.get(`${BASE_URL}/api/customer/dashboard`);
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  };

  useEffect(() => {
  const socket = io(BASE_URL);


  const storedUser = JSON.parse(localStorage.getItem("user")) || null;
  if(!storedUser) return;
  socket.on(`customer:${storedUser._id}`, (msg) => {
    if (msg.type === "dashboard-update") fetchDashboardStats();
  });

  return () => socket.disconnect();
}, []);

  return (
    <CustomerLayout>
      <div className="dashboard-header">
        <h1>Welcome Back </h1>
        <p>Your personalized import & order tracking area</p>
      </div>

      {!stats ? (
        <p className="loading-text">Loading your dashboard...</p>
      ) : (
        <div className="stats-cards">
          <div className="card">
            <h3>My Orders</h3>
            <p>{stats.orders}</p>
          </div>

          <div className="card">
            <h3>Pending Payments</h3>
            <p>{stats.pendingPayments}</p>
          </div>

          <div className="card">
            <h3>Documents Uploaded</h3>
            <p>{stats.documents}</p>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
};

export default CustomerDashboard;
