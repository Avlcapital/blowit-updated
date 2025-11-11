import React, { useState } from "react";
import { FaTimes, FaUpload, FaSave } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/AddVehicleModal.css";

const AddVehicleModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    year: "",
    mileage: "",
    transmission: "Automatic",
    fuelType: "Petrol",
    engineCapacity: "",
    color: "",
    condition: "Used",
    price: "",
    description: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Upload images to Cloudinary
      const uploadData = new FormData();
      images.forEach((img) => uploadData.append("images", img));

      const uploadRes = await api.post(`${BASE_URL}/api/vehicles/upload`, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageList = uploadRes.data.images;

      // Save vehicle
      await api.post(`${BASE_URL}/api/vehicles`, { ...formData, images: imageList });
      alert("Vehicle added successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error adding vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New Vehicle</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <input
            name="title"
            placeholder="Vehicle Title"
            onChange={handleChange}
            required
          />
          <input
            name="brand"
            placeholder="Brand"
            onChange={handleChange}
            required
          />
          <input name="model" placeholder="Model" onChange={handleChange} />
          <input
            type="number"
            name="year"
            placeholder="Year"
            onChange={handleChange}
          />
          <input
            type="number"
            name="mileage"
            placeholder="Mileage (km)"
            onChange={handleChange}
          />
          <input
            name="engineCapacity"
            placeholder="Engine Capacity (cc)"
            onChange={handleChange}
          />
          <input name="color" placeholder="Color" onChange={handleChange} />
          <input
            type="number"
            name="price"
            placeholder="Price"
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
          />

          <label className="file-upload">
            <FaUpload /> Upload Images
            <input type="file" multiple onChange={handleFileChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : <><FaSave /> Save Vehicle</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal;
