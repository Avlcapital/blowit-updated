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
  FaPlayCircle,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";

import RequestImportModal from "../../components/Customer/RequestImportModal";

import "../../styles/customer/CustomerVehicleDetails.css";

const CustomerVehicleDetails = () => {
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [show360, setShow360] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const [similar, setSimilar] = useState([]);

  // Loan calculator
  const [depositPercent, setDepositPercent] = useState(30);
  const [months, setMonths] = useState(12);
  const [loan, setLoan] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);

  // Duty
  const [duty, setDuty] = useState(0);

  // Wishlist
  const [favourites, setFavourites] = useState([]);

  /* ========= LOAD VEHICLE ========= */
  const loadVehicle = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/vehicles/${id}`);
      if (res.data.success) setVehicle(res.data.vehicle);
    } catch (err) {
      console.log("Vehicle error:", err);
    }
  };

  /* ========= LOAD SIMILAR VEHICLES ========= */
  const loadSimilar = async (vehicle) => {
    if (!vehicle?.brand) return;

    try {
      const res = await api.get(
        `${BASE_URL}/api/vehicles?brand=${vehicle.brand}&limit=4`
      );
      if (res.data.success) setSimilar(res.data.vehicles.filter(v => v._id !== vehicle._id));
    } catch {}
  };

  /* ========= LOAD WISHLIST ========= */
  const loadFavourites = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/wishlist`);
      if (res.data.success) {
        setFavourites(res.data.favourites.map((x) => x._id));
      }
    } catch {}
  };

  const isFav = (id) => favourites.includes(id);

  const toggleFavourite = async () => {
    if (!vehicle) return;
    try {
      if (isFav(vehicle._id)) {
        await api.delete(`${BASE_URL}/api/wishlist/${vehicle._id}`);
        setFavourites((prev) => prev.filter((x) => x !== vehicle._id));
      } else {
        await api.post(`${BASE_URL}/api/wishlist/add`, { vehicleId: vehicle._id });
        setFavourites((prev) => [...prev, vehicle._id]);
      }
    } catch {
      alert("Failed to update favourites");
    }
  };

  /* ========= COMPARE ========= */
  const addToCompare = () => {
    const saved = JSON.parse(localStorage.getItem("compareList")) || [];

    if (saved.some((v) => v._id === vehicle._id)) {
      alert("Already in comparison.");
      return;
    }

    if (saved.length >= 3) {
      alert("Maximum 3 vehicles allowed.");
      return;
    }

    const newList = [...saved, vehicle];
    localStorage.setItem("compareList", JSON.stringify(newList));
    alert("Vehicle added to comparison list");
  };

  /* ========= CALCULATORS ========= */
  useEffect(() => {
    if (!vehicle?.price) return;

    const price = Number(vehicle.price);
    const deposit = (depositPercent / 100) * price;
    const loanAmount = price - deposit;

    setLoan(loanAmount);

    const interest = 0.18;
    const monthly = (loanAmount + loanAmount * interest) / months;

    setMonthlyPay(Math.ceil(monthly));

    // Duty (approx)
    setDuty(Math.round(price * 0.45));
  }, [vehicle, depositPercent, months]);

  /* ========= INITIAL LOAD ========= */
  useEffect(() => {
    loadVehicle();
    loadFavourites();
  }, [id]);

  /* Load similar after vehicle is loaded */
  useEffect(() => {
    if (vehicle) loadSimilar(vehicle);
  }, [vehicle]);

  if (!vehicle)
    return (
      <CustomerLayout>
        <p>Loading vehicle...</p>
      </CustomerLayout>
    );

  const images = vehicle.images || [];
  const mainImg = images[activeImage]?.url || "/placeholder-car.jpg";

  return (
    <CustomerLayout>
      <div className="vd-breadcrumb">
        Home / Vehicles / {vehicle.brand} {vehicle.model}
      </div>

      <div className="vd-container">
        {/* ================= LEFT: GALLERY ================= */}
        <div className="vd-left">
          <div className="vd-main-img-wrap">
            {activeImage > 0 && (
              <button
                className="vd-nav-left"
                onClick={() => setActiveImage(activeImage - 1)}
              >
                <FaChevronLeft />
              </button>
            )}

            <img className="vd-main-img" src={mainImg} alt="vehicle" />

            {activeImage < images.length - 1 && (
              <button
                className="vd-nav-right"
                onClick={() => setActiveImage(activeImage + 1)}
              >
                <FaChevronRight />
              </button>
            )}
          </div>

          <div className="vd-thumbs">
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                className={i === activeImage ? "active" : ""}
                onClick={() => setActiveImage(i)}
              />
            ))}
          </div>

          {vehicle.has360 && (
            <button className="vd-360-btn" onClick={() => setShow360(true)}>
              <FaPlayCircle /> View 360°
            </button>
          )}
        </div>

        {/* ================= RIGHT: DETAILS ================= */}
        <div className="vd-right">
          <h1>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</h1>

          <h2 className="vd-price">
            KES {Number(vehicle.price).toLocaleString()}
          </h2>

          <div className="vd-actions">
            <button onClick={addToCompare}>
              <FaExchangeAlt /> Compare
            </button>

            <button
              onClick={toggleFavourite}
              className={isFav(vehicle._id) ? "fav-active" : ""}
            >
              <FaHeart /> Favourite
            </button>
          </div>

          <div className="vd-specs">
            <p><FaStopwatch /> Year: {vehicle.year}</p>
            <p><FaCarSide /> Mileage: {vehicle.mileage?.toLocaleString()} km</p>
            <p><FaGasPump /> Fuel: {vehicle.fuelType}</p>
            <p><FaCog /> Transmission: {vehicle.transmission}</p>
            <p><FaMapMarkerAlt /> Location: {vehicle.location || "Japan"}</p>
          </div>

          {/* ====== FINANCING ====== */}
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
              <p>Loan: <strong>KES {loan.toLocaleString()}</strong></p>
              <p>Monthly: <strong>KES {monthlyPay.toLocaleString()}</strong></p>
            </div>
          </div>

          {/* ====== DUTY ====== */}
          <div className="vd-box">
            <h3>KRA Duty Estimate</h3>
            <p><strong>KES {duty.toLocaleString()}</strong></p>
            <p className="vd-note">May vary depending on KRA valuation.</p>
          </div>

          <button
            className="vd-request-btn"
            onClick={() => setShowRequest(true)}
          >
            Request This Import
          </button>
        </div>
      </div>

      {/* ================= SIMILAR VEHICLES ================= */}
      {similar.length > 0 && (
        <div className="vd-similar-section">
          <h2>Similar Vehicles</h2>

          <div className="vd-similar-grid">
            {similar.map((v) => (
              <a key={v._id} href={`/customer/vehicle/${v._id}`} className="vd-similar-card">
                <img src={v.images?.[0]?.url} alt="" />
                <p>{v.title}</p>
                <span>KES {Number(v.price).toLocaleString()}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ========== 360 Viewer Modal ========== */}
      {show360 && (
        <div className="vd-360-overlay" onClick={() => setShow360(false)}>
          <div className="vd-360-modal">
            <iframe src={vehicle.model3dUrl} title="360 Viewer" />
          </div>
        </div>
      )}

      {/* ========== Import Request Modal ========== */}
      {showRequest && (
        <RequestImportModal
          vehicle={vehicle}
          onClose={() => setShowRequest(false)}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerVehicleDetails;
