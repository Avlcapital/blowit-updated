import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CustomerLayout from "../../components/Customer/CustomerLayout";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import { normalizeVehicleMedia } from "../../utils/vehicleMedia";
import {
  FaHeart,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaCog,
  FaMapMarkerAlt,
  FaExchangeAlt,
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaPlayCircle,
} from "react-icons/fa";
import "../../styles/customer/CustomerVehicleDetails.css";
import VehicleQuickViewModal from "../../components/Customer/VehicleQuickViewModal";

const formatValue = (value, fallback = "N/A") => {
  if (value === 0) return "0";
  return value || fallback;
};

const formatNumber = (value, suffix = "", fallback = "N/A") => {
  if (value === 0) return `0${suffix}`;
  if (!value) return fallback;
  return `${Number(value).toLocaleString()}${suffix}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const CustomerVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialVehicle = location.state?.vehicle || null;

  const [vehicle, setVehicle] = useState(initialVehicle);
  const [loading, setLoading] = useState(!initialVehicle);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [show360, setShow360] = useState(false);
  const [showAuctionSheet, setShowAuctionSheet] = useState(false);
  const [quickViewVehicle, setQuickViewVehicle] = useState(null);

  const [depositPercent, setDepositPercent] = useState(30);
  const [months, setMonths] = useState(12);
  const [loan, setLoan] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);
  const [duty, setDuty] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadVehicle = async () => {
      try {
        setLoading(true);
        setError("");
        let res;

        try {
          res = await api.get(`${BASE_URL}/api/vehicles/public/${id}`);
        } catch {
          res = await api.get(`${BASE_URL}/api/vehicles/${id}`);
        }

        if (!isMounted) return;

        if (res.data.success) {
          setVehicle(res.data.vehicle);
          setActiveImage(0);
          setShow360(false);
          setShowAuctionSheet(false);
        } else {
          setVehicle(null);
          setError("We could not load this vehicle right now.");
        }
      } catch (err) {
        if (!isMounted) return;
        setVehicle((currentVehicle) => currentVehicle || initialVehicle);
        setError(
          err.response?.data?.message || "Failed to fetch this vehicle."
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

  useEffect(() => {
    if (!vehicle?.price) return;

    const price = Number(vehicle.price);
    const deposit = (depositPercent / 100) * price;
    const loanAmount = price - deposit;

    setLoan(loanAmount);

    const interestRate = 0.18;
    const monthly = (loanAmount + loanAmount * interestRate) / months;
    setMonthlyPay(Math.ceil(monthly));
    setDuty(Math.round(price * 0.45));
  }, [vehicle, depositPercent, months]);

  const addToCompare = () => {
    if (!vehicle) return;

    const saved = JSON.parse(localStorage.getItem("compareList")) || [];
    if (saved.some((savedVehicle) => savedVehicle._id === vehicle._id)) {
      alert("Already added to comparison.");
      return;
    }

    if (saved.length >= 4) {
      alert("Max 4 vehicles allowed.");
      return;
    }

    localStorage.setItem("compareList", JSON.stringify([...saved, vehicle]));
    alert("Added to comparison list");
  };

  if (loading && !vehicle) {
    return (
      <CustomerLayout>
        <div className="vd-state">
          <h2>Loading vehicle...</h2>
          <p>We are preparing the full details for this import listing.</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!vehicle) {
    return (
      <CustomerLayout>
        <div className="vd-state">
          <h2>Vehicle not available</h2>
          <p>{error || "This vehicle could not be found."}</p>
          <button
            className="vd-back-btn"
            onClick={() => navigate("/customer/vehicles")}
          >
            Back to Browse Vehicles
          </button>
        </div>
      </CustomerLayout>
    );
  }

  const images = normalizeVehicleMedia(vehicle.images, 18);
  const displayImages = images.length ? images : [{ url: "/placeholder-car.jpg" }];
  const mainImg = displayImages[activeImage]?.url || "/placeholder-car.jpg";
  const spinImages = normalizeVehicleMedia(vehicle.spinImages, 24);
  const hasSpinExperience = Boolean(vehicle.model3dUrl || spinImages.length);
  const isAuctionPdf = /\.pdf(\?|$)/i.test(vehicle.auctionSheetUrl || "");
  const title = vehicle.title || `${vehicle.brand} ${vehicle.model}`;

  return (
    <CustomerLayout>
      <div className="vd-breadcrumb">
        <span>
          Customer / Vehicles / {vehicle.brand || "Vehicle"} {vehicle.model || ""}
        </span>
      </div>

      <div className="vd-container">
        <div className="vd-left">
          <img className="vd-main-img" src={mainImg} alt={title} />

          <div className="vd-thumbs">
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

          {hasSpinExperience && (
            <button className="vd-360-btn" onClick={() => setShow360(true)}>
              <FaPlayCircle /> View 360 / 3D
            </button>
          )}

          {vehicle.auctionSheetUrl && (
            <button
              className="vd-auction-btn"
              onClick={() => setShowAuctionSheet(true)}
            >
              <FaFileAlt /> View Auction Sheet
            </button>
          )}
        </div>

        <div className="vd-right">
          <h1>{title}</h1>

          <h2 className="vd-price">
            KES {Number(vehicle.price || 0).toLocaleString()}
          </h2>

          {vehicle.sourcePrice && vehicle.sourceCurrency && (
            <p className="vd-source-price">
              Source price: {vehicle.sourceCurrency}{" "}
              {Number(vehicle.sourcePrice).toLocaleString()}
            </p>
          )}

          <div className="vd-actions">
            <button onClick={addToCompare}>
              <FaExchangeAlt /> Compare
            </button>
            <button type="button">
              <FaHeart /> Favourite
            </button>
          </div>

          <div className="vd-specs">
            <p>
              <FaStopwatch /> Year: {formatValue(vehicle.year)}
            </p>
            <p>
              <FaCarSide /> Mileage: {formatNumber(vehicle.mileage, " km")}
            </p>
            <p>
              <FaGasPump /> Fuel: {formatValue(vehicle.fuelType)}
            </p>
            <p>
              <FaCog /> Transmission: {formatValue(vehicle.transmission)}
            </p>
            <p>
              <FaMapMarkerAlt /> Location: {formatValue(vehicle.location, "Japan")}
            </p>
          </div>

          <div className="vd-specs-box">
            <h3>Vehicle Specifications</h3>

            <div className="vd-spec-section">
              <h4>Basic Information</h4>
              <ul>
                <li>
                  <span>Make:</span> {formatValue(vehicle.brand)}
                </li>
                <li>
                  <span>Model:</span> {formatValue(vehicle.model)}
                </li>
                <li>
                  <span>Year:</span> {formatValue(vehicle.year)}
                </li>
                <li>
                  <span>Condition:</span> {formatValue(vehicle.condition, "Used")}
                </li>
                <li>
                  <span>Stock Number:</span> {formatValue(vehicle.stockNumber)}
                </li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Performance & Engine</h4>
              <ul>
                <li>
                  <span>Engine Capacity:</span> {formatValue(vehicle.engineCapacity)}
                </li>
                <li>
                  <span>Fuel:</span> {formatValue(vehicle.fuelType)}
                </li>
                <li>
                  <span>Transmission:</span> {formatValue(vehicle.transmission)}
                </li>
                <li>
                  <span>Drive Type:</span> {formatValue(vehicle.driveType, "2WD")}
                </li>
                <li>
                  <span>Mileage:</span> {formatNumber(vehicle.mileage, " km")}
                </li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Exterior</h4>
              <ul>
                <li>
                  <span>Color:</span>{" "}
                  {formatValue(vehicle.exteriorColor || vehicle.color)}
                </li>
                <li>
                  <span>Body Type:</span> {formatValue(vehicle.bodyType)}
                </li>
                <li>
                  <span>Doors:</span> {formatValue(vehicle.doors)}
                </li>
                <li>
                  <span>Wheels:</span> {formatValue(vehicle.wheels)}
                </li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Interior & Comfort</h4>
              <ul>
                <li>
                  <span>Seats:</span> {formatValue(vehicle.seats)}
                </li>
                <li>
                  <span>Upholstery:</span> {formatValue(vehicle.interiorType)}
                </li>
                <li>
                  <span>AC:</span> {vehicle.hasAC ? "Yes" : "No"}
                </li>
                <li>
                  <span>Power Windows:</span>{" "}
                  {vehicle.powerWindows ? "Yes" : "No"}
                </li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Technology</h4>
              <ul>
                <li>
                  <span>Bluetooth:</span> {vehicle.bluetooth ? "Yes" : "No"}
                </li>
                <li>
                  <span>Navigation:</span> {vehicle.navigation ? "Yes" : "No"}
                </li>
                <li>
                  <span>Reverse Camera:</span>{" "}
                  {vehicle.reverseCamera ? "Yes" : "No"}
                </li>
                <li>
                  <span>Touchscreen:</span> {vehicle.hasScreen ? "Yes" : "No"}
                </li>
              </ul>
            </div>
          </div>

          <div className="vd-box">
            <h3>Listing & Source Information</h3>
            <div className="vd-spec-section">
              <ul>
                <li>
                  <span>Status:</span> {formatValue(vehicle.status, "Available")}
                </li>
                <li>
                  <span>Source:</span>{" "}
                  {vehicle.source === "beforward" ? "Be Forward" : "Manual / Local"}
                </li>
                <li>
                  <span>Last Synced:</span> {formatDate(vehicle.lastSyncedAt)}
                </li>
                <li>
                  <span>Updated At Source:</span> {formatDate(vehicle.sourceUpdatedAt)}
                </li>
              </ul>
            </div>

            {vehicle.sourceUrl && (
              <a
                href={vehicle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vd-source-link"
              >
                View Original Listing
              </a>
            )}
          </div>

          <div className="vd-grade-box">
            <h3>Condition Grading</h3>
            <div className="vd-grade-row">
              <div className="vd-grade-item">
                <span>Exterior Grade</span>
                <div
                  className={`vd-grade-tag grade-${vehicle.exteriorGrade || "B"}`}
                >
                  {vehicle.exteriorGrade || "B"}
                </div>
              </div>

              <div className="vd-grade-item">
                <span>Interior Grade</span>
                <div
                  className={`vd-grade-tag grade-${vehicle.interiorGrade || "B"}`}
                >
                  {vehicle.interiorGrade || "B"}
                </div>
              </div>
            </div>
          </div>

          <div className="vd-history">
            <h3>Import History</h3>

            <div className="vd-timeline">
              <div className="vd-tl-item">
                <FaCheckCircle /> Purchased from Auction
              </div>
              <div className="vd-tl-item">
                <FaCheckCircle /> Vehicle Inspection Completed
              </div>
              <div className="vd-tl-item">
                <FaClock /> Shipping to Mombasa
              </div>
              <div className="vd-tl-item pending">
                <FaClock /> Arriving in Mombasa Port
              </div>
              <div className="vd-tl-item pending">
                <FaClock /> Clearing Process
              </div>
              <div className="vd-tl-item pending">
                <FaClock /> Available for Customer
              </div>
            </div>
          </div>

          <div className="vd-box">
            <h3>Financing Calculator</h3>

            <label>Deposit Percentage</label>
            <input
              type="range"
              min="20"
              max="70"
              value={depositPercent}
              onChange={(e) => setDepositPercent(Number(e.target.value))}
            />
            <p>{depositPercent}% Deposit</p>

            <label>Repayment Months</label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">12 months</option>
              <option value="18">18 months</option>
            </select>

            <div className="vd-finance">
              <p>
                Loan Amount: <strong>KES {loan.toLocaleString()}</strong>
              </p>
              <p>
                Monthly Payment: <strong>KES {monthlyPay.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div className="vd-box">
            <h3>KRA Duty Estimate</h3>
            <p>
              Estimated Duty: <strong>KES {duty.toLocaleString()}</strong>
            </p>
            <p className="vd-note">
              KRA duty varies by valuation, engine size & year.
            </p>
          </div>

          <div className="vd-box">
            <h3>Media & Description</h3>
            <div className="vd-spec-section">
              <ul>
                <li>
                  <span>Gallery Images:</span> {displayImages.length}
                </li>
                <li>
                  <span>360 / 3D View:</span> {hasSpinExperience ? "Available" : "N/A"}
                </li>
                <li>
                  <span>Auction Sheet:</span> {vehicle.auctionSheetUrl ? "Available" : "N/A"}
                </li>
                <li>
                  <span>Video:</span> {vehicle.videoUrl ? "Available" : "N/A"}
                </li>
              </ul>
            </div>

            <p className="vd-description-copy">
              {vehicle.description ||
                "No additional description has been added for this vehicle yet."}
            </p>
          </div>

          <button
            className="vd-request-btn"
            onClick={() => setQuickViewVehicle(vehicle)}
          >
            Request This Import
          </button>
        </div>
      </div>

      {show360 && (
        <div className="vd-360-overlay" onClick={() => setShow360(false)}>
          <div
            className={`vd-360-modal ${vehicle.model3dUrl ? "" : "gallery"}`.trim()}
            onClick={(event) => event.stopPropagation()}
          >
            {vehicle.model3dUrl ? (
              <iframe src={vehicle.model3dUrl} title="3D Viewer" frameBorder="0" />
            ) : (
              <div className="vd-spin-gallery">
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

      {showAuctionSheet && (
        <div
          className="vd-auction-overlay"
          onClick={() => setShowAuctionSheet(false)}
        >
          <div
            className="vd-auction-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {isAuctionPdf ? (
              <iframe src={vehicle.auctionSheetUrl} title="auction sheet" />
            ) : (
              <img src={vehicle.auctionSheetUrl} alt="auction sheet" />
            )}
          </div>
        </div>
      )}

      {quickViewVehicle && (
        <VehicleQuickViewModal
          vehicle={quickViewVehicle}
          onClose={() => setQuickViewVehicle(null)}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerVehicleDetails;
