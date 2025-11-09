import React from "react";
import Layout from "../components/Layout.jsx";
import "../styles/HowItWorks.css";

const HowItWorks = () => {
  return (
    <Layout>
      <section className="how-hero">
        <div className="how-overlay">
          <div className="how-hero-text">
            <h1>How Blowit Works</h1>
            <p>
              Bringing your dream car from Japan to Kenya made easy — powered by Be Forward and AVLC Group financing.
            </p>
          </div>
        </div>
      </section>

      <section className="how-content">
        <div className="how-container">
          <h2>The Simple 3-Step Journey</h2>

          {/* STEP 1 */}
          <div className="how-step">
            <div className="how-text">
              <h3>1️. Choose Your Car</h3>
              <p>
                Browse our wide range of cars listed directly from{" "}
                <strong>Be Forward Japan</strong>. Once you find a car that matches your preference — whether it’s a
                Toyota, BMW, or Mercedes — simply click <strong>“Request Import”</strong>.
              </p>
              <p>
                Our team will confirm the car details, import duties, and all clearance fees for full transparency before purchase.
              </p>
            </div>
            <div className="how-image">
              <img src="/src/assets/how-to-choose.webp" alt="Choose Car" />
            </div>
          </div>

          {/* STEP 2 */}
          <div className="how-step reverse">
            <div className="how-image">
              <img src="/src/assets/how-finance.jpg" alt="AVLC Financing" />
            </div>
            <div className="how-text">
              <h3>2️. Secure Financing</h3>
              <p>
                Once you pay <strong>50% deposit</strong>, AVLC Group steps in to finance the other 50%.
                We purchase the car on your behalf from Japan, ensuring authenticity and proper documentation.
              </p>
              <p>
                You can monitor your payment and financing status securely on your Blowit account dashboard.
              </p>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="how-step">
            <div className="how-text">
              <h3>3️. Import & Delivery</h3>
              <p>
                From Japan’s ports — <strong>Yokohama, Nagoya, or Kobe</strong> — your car is shipped to the Port of
                Mombasa. We handle all customs clearance, taxes, and logbook registration.
              </p>
              <p>
                Once cleared, you’ll receive a notification to pay the remaining 50% balance and pick up your car from
                Mombasa or have it delivered right to your doorstep in <strong>Nairobi, Nyeri, or Kisumu</strong>.
              </p>
            </div>
            <div className="how-image">
              <img src="/src/assets/how-delivery.jpg" alt="Car Delivery" />
            </div>
          </div>

          <div className="how-summary">
            <h2>That’s It!</h2>
            <p>
              At Blowit, we make car importation simple, transparent, and secure — from your first click to your car key.
            </p>
            <img src="/src/assets/how-summary.jpg" alt="Customer receiving car keys" />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
