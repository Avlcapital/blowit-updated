import React from "react";
import Layout from "../components/Layout.jsx";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import "../styles/Home.css";

const Home = () => {
  return (
    <Layout>
      {/* HERO SECTION */}
<section className="hero">
  <div className="hero-overlay">
    <div className="hero-inner">
      <div className="hero-text">
        <h1>Buy Premium Cars from Japan</h1>
        <p>
          Purchase your next car through Blowit — the exclusive Be Forward
          agent in Kenya. Pay <strong>50% deposit</strong>, and AVLC finances
          the rest.
        </p>
      </div>

      <div className="hero-search">
        <div className="search-fields">
          <input type="text" placeholder="Search Make / Model" />
          <select>
            <option>All Years</option>
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>
          <select>
            <option>All Prices</option>
            <option>Below KES 2M</option>
            <option>KES 2M - 5M</option>
            <option>Above KES 5M</option>
          </select>
          <button>Search</button>
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
            <div key={brand} className="category-card">
              <img src={`/images/${brand.toLowerCase()}.jpg`} alt={brand} />
              <div className="category-overlay">
                <h3>{brand}</h3>
                <Link to="/vehicles" className="arrow">
                  <FaArrowRight />
                </Link>
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
          {[
            { name: "BMW i4", price: "KES 7,200,000", image: "/images/bmw-i4.jpg" },
            { name: "Audi A7", price: "KES 6,800,000", image: "/images/audi-a7.jpg" },
            { name: "Mercedes GLE", price: "KES 8,500,000", image: "/images/gle.jpg" },
            { name: "Porsche 911", price: "KES 15,000,000", image: "/images/porsche.jpg" },
          ].map((car) => (
            <div className="trend-card" key={car.name}>
              <img src={car.image} alt={car.name} />
              <div className="trend-info">
                <h3>{car.name}</h3>
                <p>{car.price}</p>
                <button className="book-btn">Request Import</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO SECTION */}
      <section className="promo">
        <div className="promo-content">
          <h2>50% Financing for Everyone</h2>
          <p>
            Blowit and AVLC make car ownership easy. We finance half your purchase,
            handle clearance and registration, and deliver your car to Mombasa Port.
          </p>
          <Link to="/register" className="promo-btn">Get Started</Link>
        </div>
        <div className="promo-image">
          <img src="/images/tesla.png" alt="Tesla Car" />
        </div>
      </section>
    </Layout>
  );
};

export default Home;
