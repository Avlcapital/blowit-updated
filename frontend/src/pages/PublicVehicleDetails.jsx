import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../utils/api";
import { BASE_URL } from "../utils/config";

import {
  FaGasPump,
  FaCogs,
  FaCarSide,
  FaBolt,
  FaRoad,
  FaBarcode,
  FaPalette,
  FaCalendarAlt,
  FaPlayCircle,
  FaFilePdf,
  FaVideo,
  FaCheckCircle,
} from "react-icons/fa";

import "../styles/PublicVehicleDetails.css";

const PublicVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState("overview");
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

        {/* LEFT: IMAGE GALLERY */}
        <div className="pvd-gallery">
          <img src={mainImg} alt="" className="pvd-main-img" />

          {/* Thumbnails */}
          <div className="pvd-thumbs">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt=""
                className={activeImage === idx ? "active" : ""}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>

          {/* 360° Button */}
          {vehicle.spinImages?.length > 0 && (
            <button className="pvd-360-btn" onClick={() => setShow360(true)}>
              <FaPlayCircle /> View 360° Exterior
            </button>
          )}

          {/* Video */}
          {vehicle.videoUrl && (
            <a
              href={vehicle.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pvd-video-btn"
            >
              <FaVideo /> Watch Video
            </a>
          )}

          {/* Auction Sheet */}
          {vehicle.auctionSheetUrl && (
            <a
              href={vehicle.auctionSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pvd-auction-btn"
            >
              <FaFilePdf /> Auction Sheet (PDF)
            </a>
          )}
        </div>

        {/* RIGHT: INFO SECTION */}
        <div className="pvd-info">

          {/* Title + Price */}
          <h1 className="pvd-title">
            {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
          </h1>

          <h2 className="pvd-price">
            KES {Number(vehicle.price).toLocaleString()}
          </h2>

          {/* --------------------------- TABS --------------------------- */}
          <div className="pvd-tabs">
            {["overview", "specs", "features", "media", "description"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ---------------------- TAB: OVERVIEW ---------------------- */}
          {tab === "overview" && (
            <div className="pvd-box">
              <h3>Overview</h3>
              <div className="pvd-specs-grid">
                <div><strong>Brand:</strong> {vehicle.brand}</div>
                <div><strong>Model:</strong> {vehicle.model}</div>
                <div><strong>Stock No:</strong> {vehicle.stockNumber || "N/A"}</div>
                <div><strong>Location:</strong> {vehicle.location}</div>
                <div><strong>Condition:</strong> {vehicle.condition}</div>
                <div><strong>Body Type:</strong> {vehicle.bodyType || "N/A"}</div>
              </div>
            </div>
          )}

          {/* --------------------- TAB: FULL SPECIFICATIONS --------------------- */}
          {tab === "specs" && (
            <div className="pvd-box">
              <h3>Full Specifications</h3>
              <div className="pvd-specs-grid">

                <div><FaCalendarAlt /> Year: {vehicle.year}</div>
                <div><FaCarSide /> Mileage: {vehicle.mileage?.toLocaleString()} km</div>
                <div><FaBolt /> Engine: {vehicle.engineCapacity} cc</div>
                <div><FaGasPump /> Fuel: {vehicle.fuelType}</div>
                <div><FaCogs /> Transmission: {vehicle.transmission}</div>
                <div><FaRoad /> Drive Type: {vehicle.driveType || "2WD/4WD"}</div>
                <div><FaPalette /> Exterior Color: {vehicle.exteriorColor}</div>
                <div><FaPalette /> Interior Color: {vehicle.interiorColor}</div>
                <div><FaBarcode /> Chassis No: {vehicle.chassisNumber || "Hidden"}</div>
                <div><FaBarcode /> Engine No: {vehicle.engineNumber || "Hidden"}</div>
                <div><FaCarSide /> Seats: {vehicle.seats}</div>
                <div><FaCarSide /> Doors: {vehicle.doors}</div>

              </div>
            </div>
          )}

          {/* --------------------- TAB: FEATURES --------------------- */}
          {tab === "features" && (
            <div className="pvd-box">
              <h3>Features & Technology</h3>

              <div className="pvd-features">
                {vehicle.bluetooth && <span><FaCheckCircle /> Bluetooth</span>}
                {vehicle.navigation && <span><FaCheckCircle /> Navigation</span>}
                {vehicle.reverseCamera && <span><FaCheckCircle /> Reverse Camera</span>}
                {vehicle.hasScreen && <span><FaCheckCircle /> Touchscreen</span>}
                {vehicle.keylessEntry && <span><FaCheckCircle /> Keyless Entry</span>}
                {vehicle.climateControl && <span><FaCheckCircle /> Climate Control</span>}
                {vehicle.sunroof && <span><FaCheckCircle /> Sunroof</span>}
                {vehicle.fogLights && <span><FaCheckCircle /> Fog Lights</span>}
                {vehicle.alloyWheels && <span><FaCheckCircle /> Alloy Wheels</span>}
                {vehicle.airbags && <span><FaCheckCircle /> Airbags</span>}
                {vehicle.abs && <span><FaCheckCircle /> ABS</span>}
              </div>
            </div>
          )}

          {/* --------------------- TAB: MEDIA --------------------- */}
          {tab === "media" && (
            <div className="pvd-box">
              <h3>Media</h3>
              <ul className="media-list">
                <li>Images: {images.length} photos</li>
                <li>360° View: {vehicle.spinImages?.length ? "Available" : "Not available"}</li>
                <li>Video: {vehicle.videoUrl ? "Available" : "Not available"}</li>
                <li>Auction Sheet: {vehicle.auctionSheetUrl ? "Available" : "Not available"}</li>
              </ul>
            </div>
          )}

          {/* --------------------- TAB: DESCRIPTION --------------------- */}
          {tab === "description" && (
            <div className="pvd-box">
              <h3>Vehicle Description</h3>
              <p>{vehicle.description || "No additional description available."}</p>
            </div>
          )}

          {/* CTA */}
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

      {/* --------------------- 360° MODAL --------------------- */}
      {show360 && (
        <div className="pvd-360-overlay" onClick={() => setShow360(false)}>
          <div className="pvd-360-modal">
            <iframe src={vehicle.spinImages[0]} title="360 Viewer"></iframe>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PublicVehicleDetails;
