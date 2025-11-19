import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CustomerLayout from "../../components/Customer/CustomerLayout";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";

import {
  FaHeart,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaCog,
  FaMapMarkerAlt,
  FaExchangeAlt,
  FaFilePdf,
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaPlayCircle
} from "react-icons/fa";

import "../../styles/customer/CustomerVehicleDetails.css";
import VehicleQuickViewModal from "../../components/Customer/VehicleQuickViewModal";

const CustomerVehicleDetails = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  const [show360, setShow360] = useState(false);
  const [showAuctionSheet, setShowAuctionSheet] = useState(false);

  const [quickViewVehicle, setQuickViewVehicle] = useState(null);

  // Loan calculator
  const [depositPercent, setDepositPercent] = useState(30);
  const [months, setMonths] = useState(12);
  const [loan, setLoan] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);

  // Duty calculator
  const [duty, setDuty] = useState(0);

  /* Fetch selected vehicle */
  const loadVehicle = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/vehicles/${id}`);
      if (res.data.success) setVehicle(res.data.vehicle);
    } catch (err) {
      console.log("Failed to fetch vehicle", err);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [id]);

  /* Loan & Duty calculations */
  useEffect(() => {
    if (!vehicle?.price) return;

    const price = Number(vehicle.price);
    const deposit = (depositPercent / 100) * price;
    const loanAmount = price - deposit;

    setLoan(loanAmount);

    const interestRate = 0.18;
    const monthly = (loanAmount + loanAmount * interestRate) / months;
    setMonthlyPay(Math.ceil(monthly));

    const estimatedDuty = Math.round(price * 0.45);
    setDuty(estimatedDuty);
  }, [vehicle, depositPercent, months]);

  const addToCompare = () => {
    const saved = JSON.parse(localStorage.getItem("compareList")) || [];
    if (saved.some((v) => v._id === vehicle._id)) {
      alert("Already added to comparison.");
      return;
    }
    if (saved.length >= 4) return alert("Max 4 vehicles allowed.");
    localStorage.setItem("compareList", JSON.stringify([...saved, vehicle]));
    alert("Added to comparison list");
  };

  if (!vehicle) return <CustomerLayout><p>Loading...</p></CustomerLayout>;

  const images = vehicle.images || [];
  const mainImg = images[activeImage]?.url || "/placeholder-car.jpg";

  return (
    <CustomerLayout>
      <div className="vd-breadcrumb">
        <span>Home / Vehicles / {vehicle.brand} {vehicle.model}</span>
      </div>

      <div className="vd-container">

        {/* LEFT SECTION: Gallery */}
        <div className="vd-left">
          <img className="vd-main-img" src={mainImg} alt="vehicle" />

          <div className="vd-thumbs">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                className={activeImage === idx ? "active" : ""}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>

          {(vehicle.has360 || vehicle.model3dUrl) && (
            <button className="vd-360-btn" onClick={() => setShow360(true)}>
              <FaPlayCircle /> View 360°
            </button>
          )}

          {/* AUCTION SHEET BUTTON */}
          {vehicle.auctionSheetUrl && (
            <button className="vd-auction-btn" onClick={() => setShowAuctionSheet(true)}>
              <FaFileAlt /> View Auction Sheet
            </button>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="vd-right">
          <h1>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</h1>

          <h2 className="vd-price">KES {vehicle.price.toLocaleString()}</h2>

          <div className="vd-actions">
            <button onClick={addToCompare}><FaExchangeAlt /> Compare</button>
            <button><FaHeart /> Favourite</button>
          </div>

          {/* MAIN SPECS */}
          <div className="vd-specs">
            <p><FaStopwatch /> Year: {vehicle.year}</p>
            <p><FaCarSide /> Mileage: {vehicle.mileage.toLocaleString()} km</p>
            <p><FaGasPump /> Fuel: {vehicle.fuelType}</p>
            <p><FaCog /> Transmission: {vehicle.transmission}</p>
            <p><FaMapMarkerAlt /> Location: {vehicle.location || "Japan"}</p>
          </div>

          {/* FULL SPECS BOX */}
          <div className="vd-specs-box">
            <h3>Vehicle Specifications</h3>

            <div className="vd-spec-section">
              <h4>Basic Information</h4>
              <ul>
                <li><span>Make:</span> {vehicle.brand}</li>
                <li><span>Model:</span> {vehicle.model}</li>
                <li><span>Year:</span> {vehicle.year}</li>
                <li><span>Condition:</span> {vehicle.condition || "Used"}</li>
                <li><span>Stock Number:</span> {vehicle.stockNumber || "N/A"}</li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Performance & Engine</h4>
              <ul>
                <li><span>Engine Capacity:</span> {vehicle.engineCapacity || "N/A"}</li>
                <li><span>Fuel:</span> {vehicle.fuelType}</li>
                <li><span>Transmission:</span> {vehicle.transmission}</li>
                <li><span>Drive Type:</span> {vehicle.driveType || "2WD"}</li>
                <li><span>Mileage:</span> {vehicle.mileage.toLocaleString()} km</li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Exterior</h4>
              <ul>
                <li><span>Color:</span> {vehicle.color || "N/A"}</li>
                <li><span>Body Type:</span> {vehicle.bodyType || "N/A"}</li>
                <li><span>Doors:</span> {vehicle.doors || "N/A"}</li>
                <li><span>Wheels:</span> {vehicle.wheels || "N/A"}</li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Interior & Comfort</h4>
              <ul>
                <li><span>Seats:</span> {vehicle.seats || "N/A"}</li>
                <li><span>Upholstery:</span> {vehicle.interiorType || "N/A"}</li>
                <li><span>AC:</span> {vehicle.hasAC ? "Yes" : "No"}</li>
                <li><span>Power Windows:</span> {vehicle.powerWindows ? "Yes" : "No"}</li>
              </ul>
            </div>

            <div className="vd-spec-section">
              <h4>Technology</h4>
              <ul>
                <li><span>Bluetooth:</span> {vehicle.bluetooth ? "Yes" : "No"}</li>
                <li><span>Navigation:</span> {vehicle.navigation ? "Yes" : "No"}</li>
                <li><span>Reverse Camera:</span> {vehicle.reverseCamera ? "Yes" : "No"}</li>
                <li><span>Touchscreen:</span> {vehicle.hasScreen ? "Yes" : "No"}</li>
              </ul>
            </div>
          </div>

          {/* CONDITION GRADING */}
          <div className="vd-grade-box">
            <h3>Condition Grading</h3>
            <div className="vd-grade-row">
              <div className="vd-grade-item">
                <span>Exterior Grade</span>
                <div className={`vd-grade-tag grade-${vehicle.exteriorGrade || 'B'}`}>
                  {vehicle.exteriorGrade || "B"}
                </div>
              </div>

              <div className="vd-grade-item">
                <span>Interior Grade</span>
                <div className={`vd-grade-tag grade-${vehicle.interiorGrade || 'B'}`}>
                  {vehicle.interiorGrade || "B"}
                </div>
              </div>
            </div>
          </div>

          {/* VEHICLE HISTORY TIMELINE */}
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

          {/* LOAN CALCULATOR */}
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
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">12 months</option>
              <option value="18">18 months</option>
            </select>

            <div className="vd-finance">
              <p>Loan Amount: <strong>KES {loan.toLocaleString()}</strong></p>
              <p>Monthly Payment: <strong>KES {monthlyPay.toLocaleString()}</strong></p>
            </div>
          </div>

          {/* DUTY */}
          <div className="vd-box">
            <h3>KRA Duty Estimate</h3>
            <p>Estimated Duty: <strong>KES {duty.toLocaleString()}</strong></p>
            <p className="vd-note">KRA duty varies by valuation, engine size & year.</p>
          </div>

          <button className="vd-request-btn"
          onClick={() => setQuickViewVehicle(vehicle)} 
          >
            Request This Import
          </button>

        </div>
      </div>

      {/* 360° VIEWER */}
      {show360 && (
        <div className="vd-360-overlay" onClick={() => setShow360(false)}>
          <div className="vd-360-modal">
            <iframe
              src={vehicle.model3dUrl}
              title="3D Viewer"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
      )}

      {/* AUCTION SHEET MODAL */}
      {showAuctionSheet && (
        <div className="vd-auction-overlay" onClick={() => setShowAuctionSheet(false)}>
          <div className="vd-auction-modal">
            <img src={vehicle.auctionSheetUrl} alt="auction sheet" />
          </div>
        </div>
      )}

      {/* Modals */}
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
