import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaPlayCircle,
} from "react-icons/fa";

import api from "../utils/api";
import { BASE_URL } from "../utils/config";
import "../styles/PublicVehicles.css";
import Layout from "../components/Layout";

const PublicVehicles = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [filters, setFilters] = useState({
    q: "",
    brand: "",
    model: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    sort: "latest",
  });

  // ----------------------- Fetch Public Vehicles -----------------------
  const fetchVehicles = async (overridePage = page, nextFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: overridePage,
        limit: 12,
        ...nextFilters,
      });

      const res = await api.get(
        `${BASE_URL}/api/vehicles/public/list?${params.toString()}`
      );

      if (res.data.success) {
        setVehicles(res.data.vehicles);
        setPages(res.data.pages);
        setPage(overridePage);
      }
    } catch (err) {
      console.error("Public vehicle fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------- Slider Settings -----------------------
  const sliderSettings = {
    dots: true,
    infinite: true,
    arrows: false,
    autoplay: true,
    speed: 400,
    autoplaySpeed: 2800,
    pauseOnHover: true,
  };

  // ----------------------- Auth Check -----------------------
  const handleRequestImport = (vehicleId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      // redirect to login with redirect back
      navigate(`/login?redirect=/customer/vehicle/${vehicleId}#request`);
      return;
    }

    // logged-in customer → go to customer page
    navigate(`/customer/vehicle/${vehicleId}#request`);
  };

  return (
    <Layout>
    <div className="pv-wrapper">
      {/* ================= HEADER ================= */}
      <div className="pv-header">
        <h1>Available Vehicles</h1>
        <p>Browse all vehicles imported directly from Japan.</p>

        <div className="pv-search">
          <FaSearch />
          <input
            placeholder="Search brand, model or keyword..."
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && fetchVehicles(1)}
          />
          <button onClick={() => fetchVehicles(1)}>Search</button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="pv-filters">
        <input
          placeholder="Brand"
          value={filters.brand}
          onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}
        />
        <input
          placeholder="Model"
          value={filters.model}
          onChange={(e) => setFilters((p) => ({ ...p, model: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Min Year"
          value={filters.minYear}
          onChange={(e) => setFilters((p) => ({ ...p, minYear: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Max Year"
          value={filters.maxYear}
          onChange={(e) => setFilters((p) => ({ ...p, maxYear: e.target.value }))}
        />

        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
        />

        <select
          value={filters.sort}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
        >
          <option value="latest">Latest</option>
          <option value="price_low">Lowest Price</option>
          <option value="price_high">Highest Price</option>
          <option value="mileage_low">Mileage Low</option>
          <option value="mileage_high">Mileage High</option>
          <option value="oldest">Oldest</option>
        </select>

        <button className="pv-btn" onClick={() => fetchVehicles(1, filters)}>Apply</button>

        <button
          className="pv-btn ghost"
          onClick={() => {
            const clearedFilters = {
              q: "",
              brand: "",
              model: "",
              minPrice: "",
              maxPrice: "",
              minYear: "",
              maxYear: "",
              sort: "latest",
            };
            setFilters(clearedFilters);
            fetchVehicles(1, clearedFilters);
          }}
        >
          Reset
        </button>
      </div>

      {/* ================= VEHICLE GRID ================= */}
      {loading ? (
        <p className="pv-loading">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p className="pv-empty">No vehicles found.</p>
      ) : (
        <div className="pv-grid">
          {vehicles.map((v) => {
            const mainImg = v.images?.[0]?.url || "/placeholder-car.jpg";

            return (
              <div className="pv-card" key={v._id}>
                <div className="pv-media">
                  {v.images?.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {v.images.map((img, idx) => (
                        <div key={idx}>
                          <img src={img.url} alt={v.title || "Car"} />
                        </div>
                      ))}
                    </Slider>
                  ) : (
                    <img src={mainImg} alt="vehicle" />
                  )}

                  <div className="pv-price-tag">
                    KES {Number(v.price).toLocaleString()}
                  </div>

                  {(v.has360 || v.model3dUrl) && (
                    <button
                      className="pv-360-btn"
                      onClick={() =>
                        navigate(`/vehicle/${v._id}`, { state: { vehicle: v } })
                      }
                    >
                      <FaPlayCircle /> 360° View
                    </button>
                  )}
                </div>

                <div className="pv-body">
                  <h3>{v.title || `${v.brand} ${v.model}`}</h3>

                  <div className="pv-specs">
                    {v.year && <span><FaStopwatch /> {v.year}</span>}
                    {v.mileage && <span><FaCarSide /> {v.mileage.toLocaleString()} km</span>}
                    {v.fuelType && <span><FaGasPump /> {v.fuelType}</span>}
                  </div>

                  <div className="pv-actions">
                    {/* PUBLIC VIEW DETAILS (NO LOGIN REQUIRED) */}
                    <button
                      className="pv-details-btn"
                      onClick={() =>
                        navigate(`/vehicle/${v._id}`, { state: { vehicle: v } })
                      }
                    >
                      View Details
                    </button>

                    {/* REQUEST IMPORT (LOGIN REQUIRED) */}
                    <button
                      className="pv-request-btn"
                      onClick={() => handleRequestImport(v._id)}
                    >
                      Request Import
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {!loading && pages > 1 && (
        <div className="pv-pagination">
          <button disabled={page <= 1} onClick={() => fetchVehicles(page - 1)}>
            Prev
          </button>

          <span>
            Page {page} / {pages}
          </span>

          <button disabled={page >= pages} onClick={() => fetchVehicles(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default PublicVehicles;
