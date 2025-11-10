import React, { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import "../../styles/admin/AdminDashboard.css";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        <div className="admin-content">
          <h1>Welcome, Admin 👋</h1>
          <p className="subtitle">Here’s a quick overview of Blowit operations.</p>

          <div className="admin-cards">
            <div className="card">
              <h3>Vehicles</h3>
              <p>124</p>
            </div>
            <div className="card">
              <h3>Customers</h3>
              <p>78</p>
            </div>
            <div className="card">
              <h3>Orders</h3>
              <p>32</p>
            </div>
            <div className="card">
              <h3>Payments</h3>
              <p>₵1.5M</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
