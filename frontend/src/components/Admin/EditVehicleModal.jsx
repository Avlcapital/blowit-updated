// frontend/src/components/Admin/EditVehicleModal.jsx
import React, { useState } from "react";
import { FaTimes, FaUpload, FaSave } from "react-icons/fa";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/EditVehicleModal.css";

const EditVehicleModal = ({ vehicle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: vehicle.title || "",
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    year: vehicle.year || "",
    mileage: vehicle.mileage || "",
    transmission: vehicle.transmission || "Automatic",
    fuelType: vehicle.fuelType || "Petrol",
    engineCapacity: vehicle.engineCapacity || "",
    color: vehicle.color || "",
    condition: vehicle.condition || "Used",
    price: vehicle.price || "",
    description: vehicle.description || "",
    stockNumber: vehicle.stockNumber || "",
    location: vehicle.location || "Japan",
    driveType: vehicle.driveType || "2WD",
    doors: vehicle.doors || "",
    wheels: vehicle.wheels || "",
    seats: vehicle.seats || "",
    interiorType: vehicle.interiorType || "",
    hasAC: vehicle.hasAC ?? true,
    powerWindows: vehicle.powerWindows ?? true,
    bluetooth: vehicle.bluetooth ?? false,
    navigation: vehicle.navigation ?? false,
    reverseCamera: vehicle.reverseCamera ?? false,
    hasScreen: vehicle.hasScreen ?? false,
  });

  const [images, setImages] = useState(vehicle.images || []);
  const [spinImages, setSpinImages] = useState(vehicle.spinImages || []);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [newSpinImages, setNewSpinImages] = useState([]);
  const [newAuctionSheet, setNewAuctionSheet] = useState(null);
  const [auctionSheetUrl, setAuctionSheetUrl] = useState(
    vehicle.auctionSheetUrl || ""
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteImage = async (public_id) => {
    if (!window.confirm("Remove this image?")) return;
    try {
      await api.delete(
        `${BASE_URL}/api/vehicles/${vehicle._id}/images/${public_id}`
      );
      const updated = images.filter((i) => i.public_id !== public_id);
      setImages(updated);
    } catch {
      alert("Failed to delete image");
    }
  };

  const handleAddGalleryImages = async () => {
    if (newGalleryImages.length === 0) return;
    const fd = new FormData();
    newGalleryImages.forEach((f) => fd.append("images", f));
    try {
      const res = await api.post(
        `${BASE_URL}/api/vehicles/${vehicle._id}/images`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setImages(res.data.images || []);
      setNewGalleryImages([]);
      alert("Gallery images added");
    } catch {
      alert("Failed to add images");
    }
  };

  const handleAddSpinImages = async () => {
    if (newSpinImages.length === 0) return;
    const fd = new FormData();
    newSpinImages.forEach((f) => fd.append("spinImages", f));
    try {
      const res = await api.post(
        `${BASE_URL}/api/vehicles/${vehicle._id}/spin-images`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSpinImages(res.data.spinImages || []);
      setNewSpinImages([]);
      alert("360° images added");
    } catch {
      alert("Failed to add 360° images");
    }
  };

  const handleDeleteSpinImage = async (public_id) => {
    if (!window.confirm("Remove this 360° image?")) return;
    try {
      const res = await api.delete(
        `${BASE_URL}/api/vehicles/${vehicle._id}/spin-images/${public_id}`
      );
      setSpinImages(res.data.spinImages || []);
    } catch {
      alert("Failed to delete 360° image");
    }
  };

  const handleUploadAuctionSheet = async () => {
    if (!newAuctionSheet) return;
    const fd = new FormData();
    fd.append("auctionSheet", newAuctionSheet);
    try {
      const res = await api.post(
        `${BASE_URL}/api/vehicles/${vehicle._id}/auction-sheet`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setAuctionSheetUrl(res.data.auctionSheetUrl);
      setNewAuctionSheet(null);
      alert("Auction sheet updated");
    } catch {
      alert("Failed to upload auction sheet");
    }
  };

  const handleRemoveAuctionSheet = async () => {
    if (!window.confirm("Remove auction sheet?")) return;
    try {
      await api.delete(
        `${BASE_URL}/api/vehicles/${vehicle._id}/auction-sheet`
      );
      setAuctionSheetUrl("");
      alert("Auction sheet removed");
    } catch {
      alert("Failed to remove auction sheet");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`${BASE_URL}/api/vehicles/${vehicle._id}`, {
        ...formData,
        year: formData.year ? Number(formData.year) : undefined,
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        doors: formData.doors ? Number(formData.doors) : undefined,
        wheels: formData.wheels ? Number(formData.wheels) : undefined,
        seats: formData.seats ? Number(formData.seats) : undefined,
        price: formData.price ? Number(formData.price) : undefined,
      });
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
        {/* Header */}
        <div className="modal-header">
          <h3>Edit Vehicle</h3>
          <FaTimes className="close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* BASIC FIELDS */}
          <input
            name="title"
            placeholder="Vehicle Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <input
            name="brand"
            placeholder="Brand"
            value={formData.brand}
            onChange={handleChange}
            required
          />
          <input
            name="model"
            placeholder="Model"
            value={formData.model}
            onChange={handleChange}
          />
          <input
            type="number"
            name="year"
            placeholder="Year"
            value={formData.year}
            onChange={handleChange}
          />
          <input
            type="number"
            name="mileage"
            placeholder="Mileage (km)"
            value={formData.mileage}
            onChange={handleChange}
          />
          <input
            name="engineCapacity"
            placeholder="Engine Capacity (cc)"
            value={formData.engineCapacity}
            onChange={handleChange}
          />
          <input
            name="color"
            placeholder="Color"
            value={formData.color}
            onChange={handleChange}
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <input
            name="stockNumber"
            placeholder="Stock Number"
            value={formData.stockNumber}
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
            placeholder="Doors"
            value={formData.doors}
            onChange={handleChange}
          />
          <input
            type="number"
            name="wheels"
            placeholder="Wheels"
            value={formData.wheels}
            onChange={handleChange}
          />
          <input
            type="number"
            name="seats"
            placeholder="Seats"
            value={formData.seats}
            onChange={handleChange}
          />
          <input
            name="interiorType"
            placeholder="Interior Type"
            value={formData.interiorType}
            onChange={handleChange}
          />

          {/* FEATURE TOGGLES */}
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
            Screen / Infotainment
          </label>

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />

          {/* GALLERY IMAGES */}
          <div className="current-images">
            <p>Gallery Images:</p>
            <div className="image-preview">
              {images.map((img) => (
                <div className="img-chip" key={img.public_id || img.url}>
                  <img src={img.url} alt="" />
                  {img.public_id && (
                    <button
                      type="button"
                      className="img-del"
                      onClick={() => handleDeleteImage(img.public_id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="file-upload">
            <FaUpload /> Select Gallery Images to Add
            <input
              type="file"
              multiple
              onChange={(e) => setNewGalleryImages([...e.target.files])}
            />
          </label>
          {newGalleryImages.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddGalleryImages}
            >
              Add Selected Gallery Images
            </button>
          )}

          {/* 360° SPIN IMAGES */}
          <div className="current-images">
            <p>360° Spin Images:</p>
            <div className="image-preview">
              {spinImages.map((img) => (
                <div className="img-chip" key={img.public_id || img.url}>
                  <img src={img.url} alt="" />
                  {img.public_id && (
                    <button
                      type="button"
                      className="img-del"
                      onClick={() => handleDeleteSpinImage(img.public_id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="file-upload">
            <FaUpload /> Select 360° Images to Add
            <input
              type="file"
              multiple
              onChange={(e) => setNewSpinImages([...e.target.files])}
            />
          </label>
          {newSpinImages.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddSpinImages}
            >
              Add Selected 360° Images
            </button>
          )}

          {/* AUCTION SHEET */}
          <div className="current-images">
            <p>Auction Sheet:</p>
            {auctionSheetUrl ? (
              <div className="auction-preview">
                <a
                  href={auctionSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Auction Sheet
                </a>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRemoveAuctionSheet}
                >
                  Remove Auction Sheet
                </button>
              </div>
            ) : (
              <p>No auction sheet uploaded.</p>
            )}
          </div>

          <label className="file-upload">
            <FaUpload /> Upload New Auction Sheet
            <input
              type="file"
              onChange={(e) => setNewAuctionSheet(e.target.files[0])}
            />
          </label>
          {newAuctionSheet && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleUploadAuctionSheet}
            >
              Save Auction Sheet
            </button>
          )}

          {/* SUBMIT */}
          <button type="submit">
            <FaSave /> Update Vehicle
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditVehicleModal;
