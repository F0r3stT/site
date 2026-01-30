// src/components/layout/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <i className="fas fa-cube"></i>
              <span>Tangram</span>
            </div>
            <p className="footer-description">
              Connecting innovators with manufacturers in Armenia's electronics industry.
            </p>
          </div>
          
          <div className="footer-section">
            <h3>Company</h3>
            <ul className="footer-links">
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#factories">Our Production Facilities</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><a href="/FAQ">Help Center</a></li>
              <li><a href="#">File Guidelines</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect With Us</h3>
            <div className="social-links">
              <a href="https://www.linkedin.com/company/armpcb/" className="social-link">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="https://t.me/tangrampcb" className="social-link">
                <i className="fab fa-telegram"></i>
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://www.instagram.com/tangram_am/" className="social-link">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
            <div className="footer-newsletter">
              <p>Stay updated with our newsletter</p>
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <button type="submit">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 Tangram. All rights reserved. Connecting Armenian electronics manufacturing.</p>
          <div className="footer-locale">
            <i className="fas fa-globe"></i>
            <span>English</span>
            <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;