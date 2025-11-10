import React, { useState, useRef, useEffect } from "react";
import {
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
  FaUserCog,
  FaLock,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import "../../styles/admin/AdminLayout.css";

const AdminNavbar = ({ toggleSidebar }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

  // temporary local state for demo
  const [adminData, setAdminData] = useState({
    name: "Admin User",
    email: "admin@blowit.africa",
    role: "Administrator",
  });
  const [newData, setNewData] = useState(adminData);
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleProfileModal = () => {
    setShowProfileModal((prev) => !prev);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // handle updates
  const handleEditSave = () => {
    setAdminData(newData);
    setShowEditModal(false);
  };

  const handlePasswordSave = () => {
    if (passwords.new !== passwords.confirm) {
      alert("Passwords do not match");
      return;
    }
    alert("Password updated successfully!");
    setPasswords({ old: "", new: "", confirm: "" });
    setShowPasswordModal(false);
  };

  return (
    <>
      <header className="admin-navbar">
        <FaBars className="hamburger" onClick={toggleSidebar} />

        <h2>Blowit Admin Dashboard</h2>

        <div className="admin-profile" ref={dropdownRef}>
          <FaUserCircle className="profile-icon" onClick={toggleMenu} />

          {menuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={toggleProfileModal}>
                <FaUserCog /> Profile
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Profile Modal --- */}
      {showProfileModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h3>👤 My Profile</h3>
              <FaTimes
                className="close-modal"
                onClick={() => setShowProfileModal(false)}
              />
            </div>

            <div className="modal-body">
              <p>
                <strong>Name:</strong> {adminData.name}
              </p>
              <p>
                <strong>Email:</strong> {adminData.email}
              </p>
              <p>
                <strong>Role:</strong> {adminData.role}
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="edit-btn"
                onClick={() => {
                  setShowEditModal(true);
                  setShowProfileModal(false);
                }}
              >
                <FaUserCog /> Edit Details
              </button>
              <button
                className="password-btn"
                onClick={() => {
                  setShowPasswordModal(true);
                  setShowProfileModal(false);
                }}
              >
                <FaLock /> Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Profile Modal --- */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <FaTimes
                className="close-modal"
                onClick={() => setShowEditModal(false)}
              />
            </div>
            <div className="modal-body">
              <label>Name:</label>
              <input
                type="text"
                value={newData.name}
                onChange={(e) =>
                  setNewData({ ...newData, name: e.target.value })
                }
              />
              <label>Email:</label>
              <input
                type="email"
                value={newData.email}
                onChange={(e) =>
                  setNewData({ ...newData, email: e.target.value })
                }
              />
            </div>
            <div className="modal-footer">
              <button className="edit-btn" onClick={handleEditSave}>
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Change Password Modal --- */}
      {showPasswordModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <FaTimes
                className="close-modal"
                onClick={() => setShowPasswordModal(false)}
              />
            </div>
            <div className="modal-body">
              <label>Current Password:</label>
              <input
                type="password"
                value={passwords.old}
                onChange={(e) =>
                  setPasswords({ ...passwords, old: e.target.value })
                }
              />
              <label>New Password:</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
              />
              <label>Confirm New Password:</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
              />
            </div>
            <div className="modal-footer">
              <button className="password-btn" onClick={handlePasswordSave}>
                <FaSave /> Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
