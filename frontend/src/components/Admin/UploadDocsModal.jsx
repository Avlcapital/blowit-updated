import React, { useState } from "react";
import { FaTimes, FaUpload } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/AdminOrders.css";

const UploadDocsModal = ({ order, onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert("Select at least one file");
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      setLoading(true);
      await api.post(`${BASE_URL}/api/orders/${order._id}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Documents uploaded");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Upload Documents</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="file-upload">
            <FaUpload /> Select Files
            <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadDocsModal;
