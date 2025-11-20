import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../utils/api";
import { BASE_URL } from "../utils/config";

import {
  FaGasPump,
  FaCogs,
  FaCarSide,
  FaStopwatch,
  FaBolt,
  FaRoad,
  FaBarcode,
  FaPalette,
  FaCalendarAlt,
  FaTimes,
  FaPlayCircle,
} from "react-icons/fa";

import "../styles/PublicVehicleDetails.css";

const PublicVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [show360, setShow360] = useState(false);

  const loadVehicle = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/vehicles/${id}`);
      if (res.data.success) setVehicle(res.data.vehicle);
    } catch (err) {
      console.log("Vehicle load error", err);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [id]);

  if (!vehicle)
    return (
      <Layout>
        <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
      </Layout>
    );

  const images = vehicle.images || [];
  const mainImg = images[activeImage]?.url || "/placeholder-car.jpg";

  return (
    <Layout>
      <div className="pvd-wrapper">
        {/* LEFT: GALLERY */}
        <div className="pvd-gallery">
          <img src={mainImg} alt="" className="pvd-main-img" />

          {/* Thumbnail Row */}
          <div className="pvd-thumbs">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                className={activeImage === idx ? "active" : ""}
                onClick={() => setActiveImage(idx)}
                alt="thumb"
              />
            ))}
          </div>

          {/* 3D/360 Viewer */}
          {vehicle.model3dUrl && (
            <button
              className="pvd-360-btn"
              onClick={() => setShow360(true)}
            >
              <FaPlayCircle /> View 360° / 3D Model
            </button>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div className="pvd-info">
          <h1 className="pvd-title">
            {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
          </h1>

          <h2 className="pvd-price">
            KES {Number(vehicle.price).toLocaleString()}
          </h2>

          {/* SPECS GRID */}
          <div className="pvd-specs-box">
            <h3 className="pvd-specs-title">Vehicle Specifications</h3>

            <div className="pvd-specs-grid">
              <div className="pvd-spec-item">
                <FaCalendarAlt /> Year: {vehicle.year}
              </div>
              <div className="pvd-spec-item">
                <FaCarSide /> Mileage:{" "}
                {Number(vehicle.mileage).toLocaleString()} km
              </div>
              <div className="pvd-spec-item">
                <FaGasPump /> Fuel: {vehicle.fuelType}
              </div>
              <div className="pvd-spec-item">
                <FaCogs /> Transmission: {vehicle.transmission}
              </div>
              <div className="pvd-spec-item">
                <FaBolt /> Engine CC: {vehicle.engineCapacity}
              </div>
              <div className="pvd-spec-item">
                <FaPalette /> Color: {vehicle.exteriorColor || "N/A"}
              </div>
              <div className="pvd-spec-item">
                <FaBarcode /> Chassis No: {vehicle.chassisNumber || "Hidden"}
              </div>
              <div className="pvd-spec-item">
                <FaRoad /> Drive: {vehicle.driveType || "2WD/4WD"}
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="pvd-description-box">
            <h3>About This Vehicle</h3>
            <p>{vehicle.description || "No additional description available."}</p>
          </div>

          {/* CTA SECTION */}
          <div className="pvd-btn-block">
            <button
              className="pvd-request-btn"
              onClick={() => {
                const token = localStorage.getItem("token");
                if (!token) {
                  navigate(`/login?redirect=/vehicle/${id}#request`);
                } else {
                  navigate(`/customer/vehicle/${id}#request`);
                }
              }}
            >
              Request Import
            </button>
          </div>
        </div>
      </div>

      {/* 360 Viewer Modal */}
      {show360 && (
        <div className="pvd-360-overlay" onClick={() => setShow360(false)}>
          <div className="pvd-360-modal">
            <iframe src={vehicle.model3dUrl} title="3D Viewer"></iframe>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PublicVehicleDetails;
