import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../utils/api";
import { BASE_URL } from "../utils/config";
import {
  FaBarcode,
  FaBolt,
  FaCalendarAlt,
  FaCarSide,
  FaCheckCircle,
  FaCogs,
  FaFilePdf,
  FaGasPump,
  FaMapMarkerAlt,
  FaPalette,
  FaPlayCircle,
  FaRoad,
  FaVideo,
} from "react-icons/fa";
import "../styles/PublicVehicleDetails.css";

const tabs = ["overview", "specs", "features", "media", "description"];

const featureConfig = [
  { key: "bluetooth", label: "Bluetooth" },
  { key: "navigation", label: "Navigation" },
  { key: "reverseCamera", label: "Reverse Camera" },
  { key: "hasScreen", label: "Touchscreen" },
  { key: "keylessEntry", label: "Keyless Entry" },
  { key: "climateControl", label: "Climate Control" },
  { key: "sunroof", label: "Sunroof" },
  { key: "fogLights", label: "Fog Lights" },
  { key: "alloyWheels", label: "Alloy Wheels" },
  { key: "airbags", label: "Airbags" },
  { key: "abs", label: "ABS" },
  { key: "powerWindows", label: "Power Windows" },
  { key: "hasAC", label: "Air Conditioning" },
];

const normalizeMediaItems = (items = []) =>
  items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return { url: item };
      return item.url ? item : null;
    })
    .filter(Boolean);

const formatValue = (value, fallback = "N/A") => {
  if (value === 0) return "0";
  return value || fallback;
};

const formatNumber = (value, suffix = "") => {
  if (value === 0) return `0${suffix}`;
  if (!value) return "N/A";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const PublicVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialVehicle = location.state?.vehicle || null;

  const [vehicle, setVehicle] = useState(initialVehicle);
  const [loading, setLoading] = useState(!initialVehicle);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState("overview");
  const [show360, setShow360] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadVehicle = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`${BASE_URL}/api/vehicles/public/${id}`);

        if (!isMounted) return;

        if (res.data.success) {
          setVehicle(res.data.vehicle);
          setActiveImage(0);
          setTab("overview");
          setShow360(false);
        } else {
          setVehicle(null);
          setError("We could not load this vehicle right now.");
        }
      } catch (err) {
        if (!isMounted) return;
        setVehicle((currentVehicle) => currentVehicle || initialVehicle);
        setError(
          err.response?.data?.message ||
            "We could not load this vehicle right now."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVehicle();

    return () => {
      isMounted = false;
    };
  }, [id, initialVehicle]);

  const galleryImages = normalizeMediaItems(vehicle?.images);
  const displayImages = galleryImages.length
    ? galleryImages
    : [{ url: "/placeholder-car.jpg" }];
  const spinImages = normalizeMediaItems(vehicle?.spinImages);
  const hasSpinExperience = Boolean(vehicle?.model3dUrl || spinImages.length);
  const mainImg = displayImages[activeImage]?.url || "/placeholder-car.jpg";
  const title = vehicle?.title || `${vehicle?.brand || ""} ${vehicle?.model || ""}`.trim();

  const features = featureConfig.filter(({ key }) => vehicle?.[key]);

  const overviewItems = vehicle
    ? [
        { label: "Brand", value: formatValue(vehicle.brand) },
        { label: "Model", value: formatValue(vehicle.model) },
        { label: "Stock No", value: formatValue(vehicle.stockNumber) },
        { label: "Condition", value: formatValue(vehicle.condition, "Used") },
        { label: "Body Type", value: formatValue(vehicle.bodyType) },
        { label: "Location", value: formatValue(vehicle.location, "Japan") },
      ]
    : [];

  const specificationItems = vehicle
    ? [
        { icon: <FaCalendarAlt />, label: "Year", value: formatValue(vehicle.year) },
        { icon: <FaCarSide />, label: "Mileage", value: formatNumber(vehicle.mileage, " km") },
        { icon: <FaBolt />, label: "Engine", value: formatValue(vehicle.engineCapacity, "N/A") },
        { icon: <FaGasPump />, label: "Fuel", value: formatValue(vehicle.fuelType) },
        { icon: <FaCogs />, label: "Transmission", value: formatValue(vehicle.transmission) },
        { icon: <FaRoad />, label: "Drive Type", value: formatValue(vehicle.driveType, "2WD") },
        { icon: <FaPalette />, label: "Exterior", value: formatValue(vehicle.exteriorColor || vehicle.color) },
        { icon: <FaPalette />, label: "Interior", value: formatValue(vehicle.interiorColor) },
        { icon: <FaBarcode />, label: "Chassis No", value: formatValue(vehicle.chassisNumber, "Hidden") },
        { icon: <FaBarcode />, label: "Engine No", value: formatValue(vehicle.engineNumber, "Hidden") },
        { icon: <FaCarSide />, label: "Seats", value: formatValue(vehicle.seats) },
        { icon: <FaCarSide />, label: "Doors", value: formatValue(vehicle.doors) },
      ]
    : [];

  if (loading && !vehicle) {
    return (
      <Layout>
        <div className="pvd-state">
          <h2>Loading vehicle...</h2>
          <p>We are pulling the latest details for this listing.</p>
        </div>
      </Layout>
    );
  }

  if (!vehicle) {
    return (
      <Layout>
        <div className="pvd-state">
          <h2>Vehicle not available</h2>
          <p>{error || "This listing may have been removed or is no longer available."}</p>
          <button className="pvd-back-btn" onClick={() => navigate("/vehicles")}>
            Back to Browse Vehicles
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pvd-page">
        <div className="pvd-topbar">
          <button className="pvd-back-btn" onClick={() => navigate("/vehicles")}>
            Back to Browse Vehicles
          </button>

          <div className="pvd-topbar-meta">
            <span className={`pvd-status-chip ${vehicle.status?.toLowerCase() || "available"}`}>
              {vehicle.status || "Available"}
            </span>
            {vehicle.stockNumber && (
              <span className="pvd-stock-chip">Stock: {vehicle.stockNumber}</span>
            )}
          </div>
        </div>

        <div className="pvd-wrapper">
          <div className="pvd-gallery">
            <img src={mainImg} alt={title} className="pvd-main-img" />

            <div className="pvd-thumbs">
              {displayImages.map((img, idx) => (
                <img
                  key={`${img.url}-${idx}`}
                  src={img.url}
                  alt={`${title} ${idx + 1}`}
                  className={activeImage === idx ? "active" : ""}
                  onClick={() => setActiveImage(idx)}
                />
              ))}
            </div>

            <div className="pvd-gallery-actions">
              {hasSpinExperience && (
                <button className="pvd-360-btn" onClick={() => setShow360(true)}>
                  <FaPlayCircle /> View 360 / 3D
                </button>
              )}

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

              {vehicle.auctionSheetUrl && (
                <a
                  href={vehicle.auctionSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pvd-auction-btn"
                >
                  <FaFilePdf /> View Auction Sheet
                </a>
              )}
            </div>
          </div>

          <div className="pvd-info">
            <div className="pvd-summary">
              <p className="pvd-kicker">Vehicle Details</p>
              <h1 className="pvd-title">{title}</h1>
              <p className="pvd-meta-line">
                <FaMapMarkerAlt /> {vehicle.location || "Japan"}{" "}
                <span className="pvd-meta-sep">|</span> {vehicle.condition || "Used"}
              </p>

              <h2 className="pvd-price">
                KES {Number(vehicle.price || 0).toLocaleString()}
              </h2>

              {vehicle.sourcePrice && vehicle.sourceCurrency && (
                <p className="pvd-source-price">
                  Source price: {vehicle.sourceCurrency}{" "}
                  {Number(vehicle.sourcePrice).toLocaleString()}
                </p>
              )}

              <div className="pvd-highlights">
                <div className="pvd-highlight">
                  <span>Year</span>
                  <strong>{formatValue(vehicle.year)}</strong>
                </div>
                <div className="pvd-highlight">
                  <span>Mileage</span>
                  <strong>{formatNumber(vehicle.mileage, " km")}</strong>
                </div>
                <div className="pvd-highlight">
                  <span>Fuel</span>
                  <strong>{formatValue(vehicle.fuelType)}</strong>
                </div>
                <div className="pvd-highlight">
                  <span>Transmission</span>
                  <strong>{formatValue(vehicle.transmission)}</strong>
                </div>
              </div>
            </div>

            <div className="pvd-tabs">
              {tabs.map((tabName) => (
                <button
                  key={tabName}
                  className={tab === tabName ? "active" : ""}
                  onClick={() => setTab(tabName)}
                >
                  {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="pvd-box">
                <h3>Overview</h3>
                <div className="pvd-specs-grid">
                  {overviewItems.map((item) => (
                    <div key={item.label} className="pvd-detail-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "specs" && (
              <div className="pvd-box">
                <h3>Full Specifications</h3>
                <div className="pvd-specs-grid detailed">
                  {specificationItems.map((item) => (
                    <div key={item.label} className="pvd-detail-card">
                      <span>
                        {item.icon} {item.label}
                      </span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "features" && (
              <div className="pvd-box">
                <h3>Features & Technology</h3>
                {features.length ? (
                  <div className="pvd-features">
                    {features.map((feature) => (
                      <span key={feature.key}>
                        <FaCheckCircle /> {feature.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="pvd-empty-copy">
                    No extra feature data has been added for this vehicle yet.
                  </p>
                )}
              </div>
            )}

            {tab === "media" && (
              <div className="pvd-box">
                <h3>Media & Documents</h3>
                <ul className="media-list">
                  <li>Images: {displayImages.length} photo(s)</li>
                  <li>360 / 3D: {hasSpinExperience ? "Available" : "Not available"}</li>
                  <li>Video: {vehicle.videoUrl ? "Available" : "Not available"}</li>
                  <li>
                    Auction Sheet: {vehicle.auctionSheetUrl ? "Available" : "Not available"}
                  </li>
                </ul>

                {vehicle.sourceUrl && (
                  <div className="pvd-links">
                    <a
                      href={vehicle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pvd-secondary-btn"
                    >
                      View Source Listing
                    </a>
                  </div>
                )}
              </div>
            )}

            {tab === "description" && (
              <div className="pvd-box">
                <h3>Vehicle Description</h3>
                <p>
                  {vehicle.description ||
                    "No additional description has been added for this vehicle yet."}
                </p>
              </div>
            )}

            <div className="pvd-btn-block">
              <button
                className="pvd-request-btn"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    navigate(`/login?redirect=/vehicle/${id}#request`);
                    return;
                  }

                  navigate(`/customer/vehicle/${id}#request`);
                }}
              >
                Request Import
              </button>
            </div>
          </div>
        </div>
      </div>

      {show360 && (
        <div className="pvd-360-overlay" onClick={() => setShow360(false)}>
          <div
            className={`pvd-360-modal ${vehicle.model3dUrl ? "" : "gallery"}`.trim()}
            onClick={(event) => event.stopPropagation()}
          >
            {vehicle.model3dUrl ? (
              <iframe src={vehicle.model3dUrl} title={`${title} 3D viewer`}></iframe>
            ) : (
              <div className="pvd-spin-gallery">
                {spinImages.map((img, idx) => (
                  <img
                    key={`${img.url}-${idx}`}
                    src={img.url}
                    alt={`${title} spin ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PublicVehicleDetails;
