import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import api from "../utils/api";
import { BASE_URL } from "../utils/config";

import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);

  /* ------------------- Fetch trending ------------------- */
  const loadTrending = async () => {
    try {
      const res = await api.get(
        `${BASE_URL}/api/vehicles?limit=4&sort=latest`
      );
      if (res.data.success) {
        setTrending(res.data.vehicles);
      }
    } catch (err) {
      console.log("Failed to load trending vehicles:", err);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  /* ------------------- Hero search ------------------- */
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (!search.trim()) return;
    navigate(`/vehicles?q=${encodeURIComponent(search)}`);
  };

  /* ------------------- Categories ------------------- */
  const handleCategory = (brand) => {
    navigate(`/vehicles?brand=${brand}`);
  };

  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-inner">
            <div className="hero-text">
              <h1>Get Your Dream Car With Us.</h1>
              <p>
                Purchase your next car through Blowit — the exclusive Be Forward
                agent in Kenya. Pay <strong>50% deposit</strong>, and AVLC
                finances the rest.
              </p>
            </div>

            {/* SEARCH BAR */}
            <div className="hero-search">
              <div className="search-fields">
                <input
                  type="text"
                  placeholder="Search Make / Model"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select onChange={(e) => navigate(`/vehicles?year=${e.target.value}`)}>
                  <option value="">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>

                <select
                  onChange={(e) => navigate(`/vehicles?priceRange=${e.target.value}`)}
                >
                  <option value="">All Prices</option>
                  <option value="0-2000000">Below KES 2M</option>
                  <option value="2000000-5000000">KES 2M - 5M</option>
                  <option value="5000000-99999999">Above KES 5M</option>
                </select>

                <button onClick={handleSearch}>Search</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="categories">
        <h2 className="section-title">Car Categories</h2>

        <div className="category-grid">
          {["Toyota", "Mercedes-Benz", "BMW", "Porsche"].map((brand) => (
            <div
              key={brand}
              className="category-card"
              onClick={() => handleCategory(brand)}
            >
              <img src={`/images/${brand.toLowerCase()}.jpg`} alt={brand} />
              <div className="category-overlay">
                <h3>{brand}</h3>
                <FaArrowRight className="arrow" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRENDING VEHICLES */}
      <section className="trending">
        <div className="trend-header">
          <h2 className="section-title">Trending Vehicles</h2>
          <Link to="/vehicles" className="view-all">View all →</Link>
        </div>

        <div className="trend-grid">
          {trending.length === 0 ? (
            <p>Loading trending vehicles...</p>
          ) : (
            trending.map((car) => (
              <div className="trend-card" key={car._id}>
                <img
                  src={car.images?.[0]?.url || "/placeholder-car.jpg"}
                  alt={car.title}
                />

                <div className="trend-info">
                  <h3>{car.title || `${car.brand} ${car.model}`}</h3>
                  <p>KES {Number(car.price).toLocaleString()}</p>

                  <div className="trend-actions">
                    <button
                      className="book-btn"
                      onClick={() =>
                        navigate(`/vehicle/${car._id}`)
                      }
                    >
                      View Details
                    </button>

                    <button
                      className="import-btn"
                      onClick={() =>
                        navigate(`/vehicle/${car._id}#request`)
                      }
                    >
                      Request Import
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-choose">
        <div className="why-container">
          <h2 className="section-title">Why Choose Blowit?</h2>
          <p className="why-subtitle">
            Trusted Be Forward Agent in Kenya — bringing Japan’s best vehicles right to your doorstep.
          </p>

          <div className="why-grid">
            <div className="why-card">
              <img src="/src/assets/authentic.jpg" alt="Authenticity Guaranteed" />
              <h3>Authenticity Guaranteed</h3>
              <p>
                We source directly from Japan’s No.1 export company —
                <strong> Be Forward</strong>.
              </p>
            </div>

            <div className="why-card">
              <img src="/src/assets/fast.webp" alt="Fast Turnaround" />
              <h3>Fast Turnaround</h3>
              <p>
                Quick shipping from Yokohama, Nagoya, Kobe → Mombasa & Nairobi.
              </p>
            </div>

            <div className="why-card">
              <img src="/src/assets/support.webp" alt="Support" />
              <h3>End-to-End Support</h3>
              <p>
                Clearance, shipping, financing, duty—we handle everything.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
