import React from "react";
import { Navigate } from "react-router-dom";

const CustomerRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "customer") {
    return <Navigate to="/login" />;
  }
  return children;
};

export default CustomerRoute;
