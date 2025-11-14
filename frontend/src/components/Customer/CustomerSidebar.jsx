import React from "react";
import { Link } from "react-router-dom";
import {
  FaCarAlt,
  FaClipboardList,
  FaUser,
  FaSignOutAlt,
  FaTimes,
  FaHeart
} from "react-icons/fa";
import "../../styles/customer/CustomerSidebar.css";

const CustomerSidebar = ({ isOpen, toggleSidebar }) => {
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className={`customer-sidebar ${isOpen ? "open-mobile" : ""}`}>
      {/* Mobile Close Icon */}
      <FaTimes className="close-icon" onClick={toggleSidebar} />

      <div className="sidebar-header">
        <h2>Customer Panel</h2>
      </div>

      <ul className="sidebar-menu">
        <li>
          <Link to="/customer/dashboard" onClick={toggleSidebar}>
            <FaClipboardList /> <span>Dashboard</span>
          </Link>
        </li>

        <li>
          <Link to="/customer/vehicles" onClick={toggleSidebar}>
            <FaCarAlt /> <span>Browse Vehicles</span>
          </Link>
        </li>

        <li>
          <Link to="/customer/favorites" onClick={toggleSidebar}>
            <FaHeart /> <span>Favourite</span>
          </Link>
        </li>

        <li>
          <Link to="/customer/orders" onClick={toggleSidebar}>
            <FaClipboardList /> <span>My Orders</span>
          </Link>
        </li>

        <li>
          <Link to="/customer/profile" onClick={toggleSidebar}>
            <FaUser /> <span>My Profile</span>
          </Link>
        </li>

        <li>
          <button className="logout-btn" onClick={logout}>
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default CustomerSidebar;
