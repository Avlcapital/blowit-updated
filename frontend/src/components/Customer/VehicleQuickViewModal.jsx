import React, { useState, useEffect } from "react";
import { FaTimes, FaCarSide, FaGasPump, FaStopwatch } from "react-icons/fa";
import "../../styles/customer/VehicleQuickViewModal.css";

import RequestImportModal from "./RequestImportModal";

const VehicleQuickViewModal = ({ vehicle, onClose }) => {
  const [showRequest, setShowRequest] = useState(false);

  // Loan calculator state
  const [depositPercent, setDepositPercent] = useState(30);
  const [months, setMonths] = useState(12);
  const [loanAmount, setLoanAmount] = useState(0);
  const [monthlyPay, setMonthlyPay] = useState(0);

  // Duty calculator state
  const [duty, setDuty] = useState(0);

  /* ===== Loan & Duty Calculation ===== */
  useEffect(() => {
    if (!vehicle?.price) return;

    const price = Number(vehicle.price);

    // loan amount calculation
    const deposit = (depositPercent / 100) * price;
    const loan = price - deposit;
    setLoanAmount(loan);

    // monthly (simple interest)
    const interestRate = 0.18; // 18% p.a
    const monthlyInterest = (loan * interestRate) / 12;
    const total = loan + monthlyInterest;
    setMonthlyPay(Math.ceil(total / months));

    // Duty Estimate (simple approximation)
    const estimatedDuty = price * 0.45; // average 40–55% depending on KRA
    setDuty(Math.round(estimatedDuty));
  }, [depositPercent, months, vehicle]);

  if (!vehicle) return null;

  const mainImg = vehicle.images?.[0]?.url || "/placeholder-car.jpg";

  return (
    <>
      {/* Background overlay */}
      <div className="vq-overlay" onClick={onClose}></div>

      <div className="vq-modal">
        {/* Header */}
        <div className="vq-header">
          <h3>{vehicle.title || `${vehicle.brand} ${vehicle.model}`}</h3>
          <FaTimes className="vq-close" onClick={onClose} />
        </div>

        <div className="vq-body">
          <div className="vq-body-content">
          {/* Left: Image */}
          <div className="vq-left">
            <img src={mainImg} alt={vehicle.title} />
          </div>

          {/* Right: Details */}
          <div className="vq-right">
            <h2 className="vq-price">KES {Number(vehicle.price).toLocaleString()}</h2>

            <div className="vq-specs">
              <p><FaStopwatch /> Year: {vehicle.year}</p>
              <p><FaCarSide /> Mileage: {Number(vehicle.mileage).toLocaleString()} km</p>
              <p><FaGasPump /> Fuel: {vehicle.fuelType}</p>
              <p>Transmission: {vehicle.transmission}</p>
              <p>Engine: {vehicle.engineCapacity}</p>
            </div>

            {/* ===== Loan calculator ===== */}
            <div className="vq-box">
              <h4>Loan Calculator</h4>

              <label>Deposit Percentage</label>
              <input
                type="range"
                min="20"
                max="70"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
              />
              <p>{depositPercent}% Deposit</p>

              <label>Financing Months</label>
              <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
              </select>

              <div className="vq-calc-result">
                <p>Loan Amount: <strong>KES {loanAmount.toLocaleString()}</strong></p>
                <p>Monthly Repayment: <strong>KES {monthlyPay.toLocaleString()}</strong></p>
              </div>
            </div>

            {/* ===== Duty calculator ===== */}
            <div className="vq-box">
              <h4>Estimated Duty</h4>
              <p>Approx. KRA Duty: <strong>KES {duty.toLocaleString()}</strong></p>
              <p className="vq-duty-note">
                * Final duty varies based on KRA valuation, engine size & year.
              </p>
            </div>

            <button
              className="vq-request-btn"
              onClick={() => setShowRequest(true)}
            >
              Proceed With Import Request
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequest && (
        <RequestImportModal
          vehicle={vehicle}
          onClose={() => setShowRequest(false)}
        />
      )}
    </>
  );
};

export default VehicleQuickViewModal;
