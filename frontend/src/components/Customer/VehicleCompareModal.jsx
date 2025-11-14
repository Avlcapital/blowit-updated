import React from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/customer/VehicleCompareModal.css";

const VehicleCompareModal = ({ vehicles, onClose }) => {
  // small helper to show safe values
  const val = (v, field, fallback = "-") => v?.[field] ?? fallback;

  return (
    <div className="vc-modal-overlay">
      <div className="vc-modal">
        <div className="vc-modal-header">
          <h3>Compare Vehicles</h3>
          <FaTimes className="vc-close" onClick={onClose} />
        </div>

        <div className="vc-modal-body">
          {/* Scroll wrapper for horizontal overflow on small screens */}
          <div className="vc-compare-grid-wrap">
            <div
              className="vc-compare-grid"
              style={{ gridTemplateColumns: `repeat(${vehicles.length}, 1fr)` }}
            >
              {vehicles.map((v) => (
                <div className="vc-col" key={v._id}>
                  {/* Top: image + title + price */}
                  <div className="vc-top">
                    <div className="vc-img-wrap">
                      <img
                        src={v.images?.[0]?.url || "/placeholder-car.jpg"}
                        alt={v.title || `${v.brand} ${v.model}`}
                      />
                    </div>
                    <h4>{v.title || `${v.brand} ${v.model}`}</h4>
                    <p className="vc-price">
                      KES {Number(v.price || 0).toLocaleString()}
                    </p>
                    {v.status && (
                      <span className={`vc-status ${v.status.toLowerCase()}`}>
                        {v.status}
                      </span>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="vc-spec-list">
                    <div className="vc-spec-row">
                      <span className="label">Brand</span>
                      <span className="value">{val(v, "brand")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Model</span>
                      <span className="value">{val(v, "model")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Year</span>
                      <span className="value">{val(v, "year")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Mileage</span>
                      <span className="value">
                        {v.mileage != null
                          ? `${Number(v.mileage).toLocaleString()} km`
                          : "-"}
                      </span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Fuel</span>
                      <span className="value">{val(v, "fuelType")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Transmission</span>
                      <span className="value">{val(v, "transmission")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Engine</span>
                      <span className="value">
                        {val(v, "engineCapacity") || "-"}
                      </span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Color</span>
                      <span className="value">{val(v, "color")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Condition</span>
                      <span className="value">{val(v, "condition")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Location</span>
                      <span className="value">
                        {val(v, "location", "Japan / Mombasa Pipeline")}
                      </span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Stock No.</span>
                      <span className="value">{val(v, "stockNumber")}</span>
                    </div>
                    <div className="vc-spec-row">
                      <span className="label">Source</span>
                      <span className="value">{val(v, "source")}</span>
                    </div>
                  </div>

                  {/* Bottom: CTA */}
                  <div className="vc-actions">
                    <button
                      className="vc-request-btn"
                      onClick={() =>
                        alert(
                          "Later: open full details / request import for this vehicle."
                        )
                      }
                    >
                      Request Import
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="vc-note">
            Tip: Swipe horizontally on mobile to see all compared vehicles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VehicleCompareModal;
