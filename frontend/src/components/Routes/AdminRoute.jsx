import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const AdminRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  // must be logged in (token) AND role === 'admin'
  if (role !== "admin") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default AdminRoute;
