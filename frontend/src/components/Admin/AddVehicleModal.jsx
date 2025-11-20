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
    stockNumber: "",
    location: "Japan",
    driveType: "2WD",
    doors: "",
    wheels: "",
    seats: "",
    interiorType: "",
    hasAC: true,
    powerWindows: true,
    bluetooth: false,
    navigation: false,
    reverseCamera: false,
    hasScreen: false,
  });

  const [images, setImages] = useState([]);
  const [auctionSheetFile, setAuctionSheetFile] = useState(null);
  const [spinFiles, setSpinFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleAuctionChange = (e) => {
    setAuctionSheetFile(e.target.files[0] || null);
  };

  const handleSpinChange = (e) => {
    setSpinFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // 1) Upload main gallery images
      let imageList = [];
      if (images.length > 0) {
        const uploadData = new FormData();
        images.forEach((img) => uploadData.append("images", img));

        const uploadRes = await api.post(
          `${BASE_URL}/api/vehicles/upload`,
          uploadData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        imageList = uploadRes.data.images || [];
      }

      // 2) Create vehicle
      const resCreate = await api.post(`${BASE_URL}/api/vehicles`, {
        ...formData,
        year: formData.year ? Number(formData.year) : undefined,
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        doors: formData.doors ? Number(formData.doors) : undefined,
        wheels: formData.wheels ? Number(formData.wheels) : undefined,
        seats: formData.seats ? Number(formData.seats) : undefined,
        price: formData.price ? Number(formData.price) : undefined,
        images: imageList,
      });

      const vehicleId = resCreate.data.vehicle._id;

      // 3) Upload auction sheet (if any)
      if (auctionSheetFile) {
        const fd = new FormData();
        fd.append("auctionSheet", auctionSheetFile);
        await api.post(
          `${BASE_URL}/api/vehicles/${vehicleId}/auction-sheet`,
          fd,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      // 4) Upload 360 spin images (if any)
      if (spinFiles.length > 0) {
        const fdSpin = new FormData();
        spinFiles.forEach((f) => fdSpin.append("spinImages", f));
        await api.post(
          `${BASE_URL}/api/vehicles/${vehicleId}/spin-images`,
          fdSpin,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      alert("Vehicle added successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
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

          <input
            name="stockNumber"
            placeholder="Stock Number (optional)"
            onChange={handleChange}
          />
          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          <select
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
          >
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
          >
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
          </select>

          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
          >
            <option value="Used">Used</option>
            <option value="New">New</option>
            <option value="Reconditioned">Reconditioned</option>
          </select>

          <select
            name="driveType"
            value={formData.driveType}
            onChange={handleChange}
          >
            <option value="2WD">2WD</option>
            <option value="4WD">4WD</option>
            <option value="AWD">AWD</option>
          </select>

          <input
            type="number"
            name="doors"
            placeholder="No. of doors"
            onChange={handleChange}
          />
          <input
            type="number"
            name="wheels"
            placeholder="No. of wheels"
            onChange={handleChange}
          />
          <input
            type="number"
            name="seats"
            placeholder="No. of seats"
            onChange={handleChange}
          />
          <input
            name="interiorType"
            placeholder="Interior type (e.g. Fabric, Leather)"
            onChange={handleChange}
          />

          {/* Feature toggles */}
          <label>
            <input
              type="checkbox"
              name="hasAC"
              checked={formData.hasAC}
              onChange={handleChange}
            />{" "}
            AC
          </label>
          <label>
            <input
              type="checkbox"
              name="powerWindows"
              checked={formData.powerWindows}
              onChange={handleChange}
            />{" "}
            Power Windows
          </label>
          <label>
            <input
              type="checkbox"
              name="bluetooth"
              checked={formData.bluetooth}
              onChange={handleChange}
            />{" "}
            Bluetooth
          </label>
          <label>
            <input
              type="checkbox"
              name="navigation"
              checked={formData.navigation}
              onChange={handleChange}
            />{" "}
            Navigation
          </label>
          <label>
            <input
              type="checkbox"
              name="reverseCamera"
              checked={formData.reverseCamera}
              onChange={handleChange}
            />{" "}
            Reverse Camera
          </label>
          <label>
            <input
              type="checkbox"
              name="hasScreen"
              checked={formData.hasScreen}
              onChange={handleChange}
            />{" "}
            Touchscreen / Screen
          </label>

          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
          />

          {/* Main gallery images */}
          <label className="file-upload">
            <FaUpload /> Upload Gallery Images
            <input type="file" multiple onChange={handleFileChange} />
          </label>

          {/* Auction sheet */}
          <label className="file-upload">
            <FaUpload /> Upload Auction Sheet
            <input type="file" onChange={handleAuctionChange} />
          </label>

          {/* 360° spin images */}
          <label className="file-upload">
            <FaUpload /> Upload 360° Spin Images
            <input type="file" multiple onChange={handleSpinChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : (
              <>
                <FaSave /> Save Vehicle
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal;
