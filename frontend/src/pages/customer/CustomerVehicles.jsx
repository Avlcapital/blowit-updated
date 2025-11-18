import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import {
  FaSearch,
  FaCarSide,
  FaStopwatch,
  FaGasPump,
  FaHeart,
  FaEye,
  FaPlayCircle,
  FaBalanceScale,
} from "react-icons/fa";

import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import CustomerLayout from "../../components/Customer/CustomerLayout";

import VehicleQuickViewModal from "../../components/Customer/VehicleQuickViewModal";
import Vehicle3DViewerModal from "../../components/Customer/Vehicle3DViewerModal";
import VehicleCompareModal from "../../components/Customer/VehicleCompareModal";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/customer/CustomerVehicles.css";

const CustomerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [favourites, setFavourites] = useState([]);

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

  const [quickViewVehicle, setQuickViewVehicle] = useState(null);
  const [viewer3DVehicle, setViewer3DVehicle] = useState(null);

  // Compare feature
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  /* ---------------- LOAD FAVOURITES ---------------- */
  const loadFavourites = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/wishlist`);
      if (res.data.success) {
        const favIds = res.data.favourites.map((x) => x._id);
        setFavourites(favIds);
      }
    } catch (err) {
      console.log("Failed to load favourites");
    }
  };

  const isFav = (id) => favourites.includes(id);

  const toggleFavourite = async (vehicleId) => {
    try {
      if (isFav(vehicleId)) {
        await api.delete(`${BASE_URL}/api/wishlist/${vehicleId}`);
        setFavourites((prev) => prev.filter((x) => x !== vehicleId));
      } else {
        await api.post(`${BASE_URL}/api/wishlist/add`, { vehicleId });
        setFavourites((prev) => [...prev, vehicleId]);
      }
    } catch {
      alert("Failed to update favourites");
    }
  };

  /* ---------------- COMPARE ---------------- */
  const isInCompare = (id) => compareList.some((v) => v._id === id);

  const toggleCompare = (vehicle) => {
    if (isInCompare(vehicle._id)) {
      setCompareList((prev) => prev.filter((v) => v._id !== vehicle._id));
      return;
    }
    if (compareList.length >= 3) {
      alert("You can compare up to 3 vehicles at a time.");
      return;
    }
    setCompareList((prev) => [...prev, vehicle]);
  };

  const clearCompare = () => setCompareList([]);

  /* ---------------- FETCH VEHICLES ---------------- */
  const fetchVehicles = async (overridePage) => {
    try {
      setLoading(true);
      const activePage = overridePage || page;

      const params = new URLSearchParams({
        page: activePage,
        limit: 12,
        ...filters,
      });

      const res = await api.get(`${BASE_URL}/api/vehicles/?${params.toString()}`);

      if (res.data.success) {
        setVehicles(res.data.vehicles);
        setPages(res.data.pages);
        setPage(activePage);
      }
    } catch (err) {
      console.error("Browse vehicles failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavourites();
    fetchVehicles(1);
  }, []);

  /* ---------------- FILTERS ---------------- */
  const applyFilters = () => fetchVehicles(1);

  const resetFilters = () => {
    setFilters({
      q: "",
      brand: "",
      model: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      sort: "latest",
    });
    fetchVehicles(1);
  };

  /* ---------------- CAROUSEL ---------------- */
  const sliderSettings = {
    dots: true,
    infinite: true,
    arrows: false,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 3500,
    pauseOnHover: true,
  };

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="cv-header">
        <div>
          <h1>Find Your Next Import</h1>
          <p>Browse verified Be Forward Japan stock with AVLC financing.</p>
        </div>

        <div className="cv-search-bar">
          <FaSearch />
          <input
            placeholder="Search brand, model, keyword..."
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, q: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Filters */}
      <div className="cv-filters">
        <input
          placeholder="Brand (e.g. Toyota)"
          value={filters.brand}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, brand: e.target.value }))
          }
        />
        <input
          placeholder="Model (e.g. Axio)"
          value={filters.model}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, model: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Min Year"
          value={filters.minYear}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, minYear: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Max Year"
          value={filters.maxYear}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, maxYear: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
          }
        />

        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort: e.target.value }))
          }
        >
          <option value="latest">Latest</option>
          <option value="price_low">Lowest Price</option>
          <option value="price_high">Highest Price</option>
          <option value="mileage_low">Mileage Low</option>
          <option value="mileage_high">Mileage High</option>
          <option value="oldest">Oldest</option>
        </select>

        <button className="cv-btn primary" onClick={applyFilters}>
          Apply
        </button>
        <button className="cv-btn ghost" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* Vehicles List */}
      {loading ? (
        <p className="cv-loading">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p className="cv-empty">No vehicles found. Try adjusting filters.</p>
      ) : (
        <div className="cv-grid">
          {vehicles.map((v) => {
            const mainImg = v.images?.[0]?.url || "/placeholder-car.jpg";

            return (
              <div className="cv-card" key={v._id}>
                {/* Image Block */}
                <div className="cv-card-media">
                  {v.images?.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {v.images.map((img, idx) => (
                        <div key={idx}>
                          <img src={img.url} alt={v.title || "Vehicle"} />
                        </div>
                      ))}
                    </Slider>
                  ) : (
                    <img src={mainImg} alt={v.title || "Vehicle"} />
                  )}

                  {/* Price tag */}
                  <div className="cv-price-badge">
                    KES {Number(v.price || 0).toLocaleString()}
                  </div>

                  {/* Status */}
                  {v.status && (
                    <span
                      className={`cv-status-tag ${v.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {v.status}
                    </span>
                  )}

                  {/* Be Forward tag */}
                  {(v.stockNumber || v.beForwardId) && (
                    <span className="cv-bf-tag">BF Japan Stock</span>
                  )}

                  {/* Favourite */}
                  <button
                    className={`cv-icon-btn fav ${
                      isFav(v._id) ? "active" : ""
                    }`}
                    onClick={() => toggleFavourite(v._id)}
                  >
                    <FaHeart />
                  </button>

                  {/* Quick view */}
                  <button
                    className="cv-icon-btn view"
                    onClick={() => setQuickViewVehicle(v)}
                  >
                    <FaEye />
                  </button>

                  {/* 3D viewer */}
                  {(v.has360 || v.model3dUrl) && (
                    <button
                      className="cv-360-btn"
                      onClick={() => setViewer3DVehicle(v)}
                    >
                      <FaPlayCircle /> 360° / 3D
                    </button>
                  )}
                </div>

                {/* Card Details */}
                <div className="cv-card-body">
                  <h3>{v.title || `${v.brand} ${v.model}`}</h3>
                  <p className="cv-location">
                    {v.location || "Japan / Mombasa Pipeline"}
                  </p>

                  <div className="cv-specs-row">
                    {!!v.year && (
                      <span>
                        <FaStopwatch /> {v.year}
                      </span>
                    )}
                    {!!v.mileage && (
                      <span>
                        <FaCarSide /> {Number(v.mileage).toLocaleString()} km
                      </span>
                    )}
                    {!!v.fuelType && (
                      <span>
                        <FaGasPump /> {v.fuelType}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="cv-card-actions-row">
                    <button
                      className="cv-request-btn"
                      onClick={() => setQuickViewVehicle(v)}
                    >
                      Request Import
                    </button>

                    <button
                      className={`cv-compare-toggle ${
                        isInCompare(v._id) ? "active" : ""
                      }`}
                      onClick={() => toggleCompare(v)}
                    >
                      <FaBalanceScale />
                      <span>
                        {isInCompare(v._id) ? "Added" : "Compare"}
                      </span>
                    </button>

                    {/* NEW: View Details */}
                    <button
                      className="cv-details-btn"
                      onClick={() =>
                        (window.location.href = `/customer/vehicle/${v._id}`)
                      }
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="cv-pager">
          <button
            disabled={page <= 1}
            onClick={() => fetchVehicles(page - 1)}
          >
            Prev
          </button>

          <span>
            Page {page} / {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() => fetchVehicles(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Compare bar */}
      {compareList.length > 0 && (
        <div className="cv-compare-bar">
          <div className="cv-compare-info">
            <FaBalanceScale />
            <span>
              {compareList.length} vehicle
              {compareList.length > 1 ? "s" : ""} selected for comparison
            </span>
          </div>

          <div className="cv-compare-actions">
            <button className="cv-compare-clear" onClick={clearCompare}>
              Clear
            </button>
            <button
              className="cv-compare-main-btn"
              onClick={() => setShowCompare(true)}
            >
              Compare Now
            </button>
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

      {viewer3DVehicle && (
        <Vehicle3DViewerModal
          vehicle={viewer3DVehicle}
          onClose={() => setViewer3DVehicle(null)}
        />
      )}

      {showCompare && compareList.length > 0 && (
        <VehicleCompareModal
          vehicles={compareList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerVehicles;
