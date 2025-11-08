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
        <h1>Get Your Dream Car With Us.</h1>
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

      {/* WHY CHOOSE US SECTION */}
<section className="why-choose">
  <div className="why-container">
    <h2 className="section-title">Why Choose Blowit?</h2>
    <p className="why-subtitle">
      Trusted Be Forward Agent in Kenya — bringing Japan’s best vehicles right to your doorstep.
    </p>

    <div className="why-grid">
      <div className="why-card">
        <img src="/images/authentic.png" alt="Authenticity Guaranteed" />
        <h3>Authenticity Guaranteed</h3>
        <p>
          We source directly from Japan’s No.1 trusted automobile export company — <strong>Be Forward</strong>.
          Every vehicle comes verified with accurate documentation, mileage, and condition reports.
        </p>
      </div>

      <div className="why-card">
        <img src="/images/fast.png" alt="Fast Turnaround" />
        <h3>Fast Turnaround</h3>
        <p>
          Enjoy quick delivery from <strong>Yokohama</strong>, <strong>Nagoya</strong>, or <strong>Kobe</strong> ports
          to Mombasa — or even directly to your doorstep in <strong>Nairobi, Nyeri, or Kisumu</strong>.
        </p>
      </div>

      <div className="why-card">
        <img src="/images/support.png" alt="End-to-End Support" />
        <h3>End-to-End Support</h3>
        <p>
          From car selection to clearance and financing, we handle every step with AVLC’s trusted 50% financing option
          — ensuring a smooth and transparent process.
        </p>
      </div>
    </div>
  </div>
</section>
    </Layout>
  );
};

export default Home;
