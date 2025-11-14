import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/customer/VehicleQuickViewModal.css";
import React360Viewer from "react-360-view";
import "@google/model-viewer";

const VehicleQuickViewModal = ({ vehicle, onClose }) => {
  const [tab, setTab] = useState(
    vehicle.images?.length ? "images" :
    vehicle.has360 ? "360" :
    vehicle.model3dUrl ? "3d" : "images"
  );

  const sliderSettings = {
    dots: true,
    infinite: true,
    arrows: true,
    speed: 400,
  };

  const hasImages = vehicle.images && vehicle.images.length > 0;
  const has360 = vehicle.has360 && vehicle.spinImages?.length > 0;
  const has3D = !!vehicle.model3dUrl;

  return (
    <div className="vq-overlay">
      <div className="vq-modal">
        <button className="vq-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="vq-header">
          <h2>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</h2>
          <p>
            KES {Number(vehicle.price || 0).toLocaleString()} •{" "}
            {vehicle.year} • {vehicle.fuelType} • {vehicle.transmission}
          </p>
        </div>

        {/* Tabs */}
        <div className="vq-tabs">
          {hasImages && (
            <button
              className={tab === "images" ? "active" : ""}
              onClick={() => setTab("images")}
            >
              Images
            </button>
          )}
          {has360 && (
            <button
              className={tab === "360" ? "active" : ""}
              onClick={() => setTab("360")}
            >
              360°
            </button>
          )}
          {has3D && (
            <button
              className={tab === "3d" ? "active" : ""}
              onClick={() => setTab("3d")}
            >
              3D Model
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="vq-body">
          {tab === "images" && hasImages && (
            <div className="vq-gallery">
              <Slider {...sliderSettings}>
                {vehicle.images.map((img, idx) => (
                  <div key={idx}>
                    <img src={img.url} alt="" />
                  </div>
                ))}
              </Slider>
            </div>
          )}

          {tab === "360" && has360 && (
            <div className="vq-360-wrap">
              <React360Viewer
                amount={vehicle.spinImages.length}
                imagePath=""  // if using pattern, adjust
                images={vehicle.spinImages} // library supports direct images array
                autoplay
                loop
              />
            </div>
          )}

          {tab === "3d" && has3D && (
            <div className="vq-3d-wrap">
              {/* model-viewer custom element */}
              <model-viewer
                src={vehicle.model3dUrl}
                alt="3D view of vehicle"
                camera-controls
                auto-rotate
                style={{ width: "100%", height: "350px" }}
                exposure="0.9"
                shadow-intensity="1"
              ></model-viewer>
            </div>
          )}
        </div>

        {/* Basic spec summary */}
        <div className="vq-specs">
          <h4>Key Specs</h4>
          <ul>
            {vehicle.mileage != null && (
              <li>Mileage: {Number(vehicle.mileage).toLocaleString()} km</li>
            )}
            {vehicle.engineCapacity && (
              <li>Engine: {vehicle.engineCapacity} cc</li>
            )}
            {vehicle.color && <li>Color: {vehicle.color}</li>}
            <li>Condition: {vehicle.condition || "Used"}</li>
            {vehicle.stockNumber && <li>BF Stock No: {vehicle.stockNumber}</li>}
          </ul>
        </div>

        <div className="vq-footer">
          <button className="vq-btn-primary">
            Proceed to Request Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleQuickViewModal;
