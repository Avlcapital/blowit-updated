import React from "react";
import "../../styles/admin/AdminLayout.css";

const AdminNavbar = () => {
  return (
    <header className="admin-navbar">
      <h2>Blowit Admin Dashboard</h2>
      <div className="admin-info">
        <span className="admin-name">Admin</span>
      </div>
    </header>
  );
};

export default AdminNavbar;
