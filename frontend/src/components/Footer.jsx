import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div>
          <h4>About Blowit</h4>
          <p>
            Exclusive Be Forward agent for Kenya. Import cars safely and affordably
            with our financing partners offering financial support.
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/vehicles">Browse Vehicles</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Email: info@blowit.africa</p>
          <p>WhatsApp: +254 700 123 456</p>
        </div>
      </div>
      <p className="footer-copy">© 2025 Blowit Africa. All rights reserved.</p>
    </footer>
  );
}
