import React, { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/EditUserModal.css";

const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "customer",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`${BASE_URL}/api/users/${user._id}`, formData);
      alert("User updated successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit User</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="customer">Customer</option>
            <option value="admin">Admin (AVLC)</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : <><FaSave /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
