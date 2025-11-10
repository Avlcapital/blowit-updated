import React from "react";
import { FaBars } from "react-icons/fa";
import "../../styles/admin/AdminLayout.css";

const AdminNavbar = ({ toggleSidebar }) => {
  return (
    <header className="admin-navbar">
      <FaBars className="hamburger" onClick={toggleSidebar} />
      <h2>Blowit Admin Dashboard</h2>
      <div className="admin-info">
        <span className="admin-name">Admin</span>
      </div>
    </header>
  );
};

export default AdminNavbar;
