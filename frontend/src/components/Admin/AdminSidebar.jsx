import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCar, FaUsers, FaFileInvoice, FaMoneyBill, FaHome, FaSignOutAlt } from "react-icons/fa";
import "../../styles/admin/AdminLayout.css";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="logo">🚘 Blowit Admin</div>
      <nav>
        <Link to="/admin/dashboard"><FaHome /> Dashboard</Link>
        <Link to="/admin/vehicles"><FaCar /> Vehicles</Link>
        <Link to="/admin/orders"><FaFileInvoice /> Orders</Link>
        <Link to="/admin/payments"><FaMoneyBill /> Payments</Link>
        <Link to="/admin/users"><FaUsers /> Users</Link>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
};

export default AdminSidebar;
