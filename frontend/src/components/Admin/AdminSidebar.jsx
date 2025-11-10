import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaCar,
  FaUsers,
  FaFileInvoice,
  FaMoneyBill,
  FaHome,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import "../../styles/admin/AdminLayout.css";

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">🚘 Blowit Admin</div>
        <FaTimes className="close-icon" onClick={toggleSidebar} />
      </div>

      <nav>
        <Link to="/admin/dashboard" onClick={toggleSidebar}>
          <FaHome /> Dashboard
        </Link>
        <Link to="/admin/vehicles" onClick={toggleSidebar}>
          <FaCar /> Vehicles
        </Link>
        <Link to="/admin/orders" onClick={toggleSidebar}>
          <FaFileInvoice /> Orders
        </Link>
        <Link to="/admin/payments" onClick={toggleSidebar}>
          <FaMoneyBill /> Payments
        </Link>
        <Link to="/admin/users" onClick={toggleSidebar}>
          <FaUsers /> Users
        </Link>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
};

export default AdminSidebar;
