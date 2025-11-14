import React from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";
import "../../styles/customer/CustomerNavbar.css";

const CustomerNavbar = ({ toggleSidebar }) => {
  return (
    <nav className="customer-navbar">
      <FaBars className="hamburger" onClick={toggleSidebar} />
      <h2>Blowit - Customer Portal</h2>

      <FaUserCircle className="profile-icon" />
    </nav>
  );
};

export default CustomerNavbar;
