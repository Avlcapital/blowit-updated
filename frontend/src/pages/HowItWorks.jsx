import React from "react";
import Layout from "../components/Layout.jsx";
import "../styles/HowItWorks.css";

import chooseCar from "../assets/how-to-choose.webp";
import finance from "../assets/how-finance.jpg";
import delivery from "../assets/how-delivery.jpg";
import summary from "../assets/how-summary.jpg";

const HowItWorks = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="how-hero">
        <div className="how-overlay">
          <div className="how-hero-text">
            <h1>How Blowit Works</h1>
            <p>
              Bringing your dream car from Japan to Kenya made easy - powered by
              Be Forward and AVLC Group financing.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="how-content">
        <div className="how-container">
          <h2>The Simple 3-Step Journey</h2>

          {/* STEP 1 */}
          <div className="how-step">
            <div className="how-text">
              <h3>1️. Choose Your Car</h3>
              <p>
                Browse our wide range of cars listed directly from{" "}
                <strong>Be Forward Japan</strong>. Once you find your perfect
                match - Toyota, BMW, Mercedes - click{" "}
                <strong>“Request Import.”</strong>
              </p>
              <p>
                Our team confirms car details, import duties, and clearance
                costs before you commit - total transparency.
              </p>
            </div>
            <div className="how-image">
              <img src={chooseCar} alt="Choose Car" />
            </div>
          </div>

          {/* STEP 2 */}
          <div className="how-step">
            <div className="how-text">
              <h3>2️. Secure Financing</h3>
              <p>
                Pay a <strong>50% deposit</strong>, and AVLC Group finances the
                rest. We purchase the car on your behalf directly from Japan,
                ensuring authenticity and verified documents.
              </p>
              <p>
                You can monitor your payment and financing status on your Blowit
                account dashboard in real time.
              </p>
            </div>
            <div className="how-image">
              <img src={finance} alt="AVLC Financing" />
            </div>
          </div>

          {/* STEP 3 */}
          <div className="how-step">
            <div className="how-text">
              <h3>3️. Import & Delivery</h3>
              <p>
                From Japan’s ports - <strong>Yokohama, Nagoya, or Kobe</strong> -
                your car ships to Mombasa. We handle all customs, taxes, and
                registration.
              </p>
              <p>
                Once cleared, pay the remaining balance and pick up your car in
                Mombasa or have it delivered to{" "}
                <strong>Nairobi, Nyeri, or Kisumu.</strong>
              </p>
            </div>
            <div className="how-image">
              <img src={delivery} alt="Car Delivery" />
            </div>
          </div>

          {/* SUMMARY */}
          <div className="how-summary">
            <h2>That’s It!</h2>
            <p>
              At Blowit, we make car importation simple, transparent, and secure
              - from your first click to your new car keys.
            </p>
            <img src={summary} alt="Customer receiving car keys" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
