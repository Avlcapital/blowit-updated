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
import axios from "axios";
import "../../styles/admin/AdminLayout.css";
import { BASE_URL } from "../../utils/config";
import api from "../../utils/api";

const AdminNavbar = ({ toggleSidebar }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // state for admin data
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    role: "",
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

  // Fetch profile info on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`${BASE_URL}/api/auth/profile`);
        if (res.data.user) {
          setAdminData(res.data.user);
          setNewData(res.data.user);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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

  // --- SAVE PROFILE UPDATES ---
  const handleEditSave = async () => {
    try {
      setLoading(true);
      const res = await api.put(`${BASE_URL}/api/auth/update-profile`, {
        name: newData.name,
        email: newData.email,
      });

      if (res.data.success) {
        setAdminData(res.data.user);
        alert("Profile updated successfully!");
        setShowEditModal(false);
      } else {
        alert(res.data.message || "Failed to update profile");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  // --- CHANGE PASSWORD ---
  const handlePasswordSave = async () => {
    if (passwords.new !== passwords.confirm) {
      return alert("Passwords do not match");
    }
    try {
      setLoading(true);
      const res = await api.put(`${BASE_URL}/api/auth/change-password`, {
        oldPassword: passwords.old,
        newPassword: passwords.new,
      });

      if (res.data.success) {
        alert(" Password updated successfully!");
        setPasswords({ old: "", new: "", confirm: "" });
        setShowPasswordModal(false);
      } else {
        alert(res.data.message || "Failed to change password");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error changing password");
    } finally {
      setLoading(false);
    }
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

            {loading ? (
              <p>Loading profile...</p>
            ) : (
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
            )}

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
                <FaSave /> {loading ? "Saving..." : "Save Changes"}
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
                <FaSave /> {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
