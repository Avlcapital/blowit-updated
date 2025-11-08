import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Blowit</Link>
      </div>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/">Home</Link>
        <Link to="/vehicles">Vehicles</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/login" className="btn-login">Login</Link>
      </div>

      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>
    </nav>
  );
};

export default Navbar;
