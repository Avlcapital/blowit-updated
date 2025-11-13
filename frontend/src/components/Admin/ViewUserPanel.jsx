import React from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/admin/ViewUserPanel.css";

const ViewUserPanel = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="panel-overlay">
      <div className="panel">
        <div className="panel-header">
          <h3>User Details</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        <div className="panel-body">
          <div className="info-group">
            <label>Name</label>
            <p>{user.name}</p>
          </div>

          <div className="info-group">
            <label>Email</label>
            <p>{user.email}</p>
          </div>

          <div className="info-group">
            <label>Phone</label>
            <p>{user.phone}</p>
          </div>

          <div className="info-group">
            <label>Role</label>
            <p className="role">{user.role}</p>
          </div>

          <div className="info-group">
            <label>Date Joined</label>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="info-group">
            <label>KYC Profile</label>
            <ul className="kyc-list">
              <li>ID Type: {user.kyc?.idType || "N/A"}</li>
              <li>ID Number: {user.kyc?.idNumber || "N/A"}</li>
              <li>KRA PIN: {user.kyc?.kraPin || "N/A"}</li>
              <li>Address: {user.kyc?.address || "N/A"}</li>
              <li>Documents: {user.kyc?.documents?.length || 0} file(s)</li>
            </ul>
          </div>

          <div className="info-group">
            <label>Orders Made</label>
            <p>Coming soon: list all orders from this user</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserPanel;
