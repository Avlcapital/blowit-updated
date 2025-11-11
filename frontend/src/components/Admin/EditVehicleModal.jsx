import React, { useState } from "react";
import { FaTimes, FaUpload, FaSave } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";

const EditVehicleModal = ({ vehicle, onClose, onSuccess }) => {
  // existing state...
  const [images, setImages] = useState(vehicle.images || []); // live list
  const [newImages, setNewImages] = useState([]);

  const handleDeleteImage = async (public_id) => {
    if (!window.confirm("Remove this image?")) return;
    try {
      await api.delete(`${BASE_URL}/api/vehicles/${vehicle._id}/images/${public_id}`);
      const updated = images.filter((i) => i.public_id !== public_id);
      setImages(updated);
    } catch {
      alert("Failed to delete image");
    }
  };

  const handleAddImages = async () => {
    if (newImages.length === 0) return;
    const fd = new FormData();
    newImages.forEach((f) => fd.append("images", f));
    try {
      const res = await api.post(`${BASE_URL}/api/vehicles/${vehicle._id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages(res.data.images || []);
      setNewImages([]);
      alert("Images added");
    } catch {
      alert("Failed to add images");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // update fields only (images already handled by add/delete endpoints)
      await api.put(`${BASE_URL}/api/vehicles/${vehicle._id}`, { ...formData });
      alert("Vehicle updated");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating vehicle");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* header ... */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* fields ... unchanged */}
          <div className="current-images">
            <p>Images:</p>
            <div className="image-preview">
              {images.map((img) => (
                <div className="img-chip" key={img.public_id || img.url}>
                  <img src={img.url} alt="" />
                  {img.public_id && (
                    <button type="button" className="img-del" onClick={() => handleDeleteImage(img.public_id)}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="file-upload">
            <FaUpload /> Select Images to Add
            <input type="file" multiple onChange={(e) => setNewImages([...e.target.files])} />
          </label>
          {newImages.length > 0 && (
            <button type="button" className="btn-secondary" onClick={handleAddImages}>
              Add Selected Images
            </button>
          )}

          <button type="submit"><FaSave /> Update Vehicle</button>
        </form>
      </div>
    </div>
  );
};

export default EditVehicleModal;
