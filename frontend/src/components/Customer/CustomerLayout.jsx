import React, { useState } from "react";
import CustomerSidebar from "./CustomerSidebar";
import CustomerNavbar from "./CustomerNavbar";
import "../../styles/customer/CustomerLayout.css";

const CustomerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="customer-layout">
      {/* Sidebar */}
      <CustomerSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="customer-main">
        <CustomerNavbar toggleSidebar={toggleSidebar} />
        <div className="customer-content">{children}</div>
      </div>
    </div>
  );
};

export default CustomerLayout;
