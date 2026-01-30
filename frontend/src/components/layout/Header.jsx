import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <i className="fas fa-microchip"></i>
          <span>Tangram</span>
        </Link>

        <nav className="nav-links">
          <a href="#features" className="nav-link">How It Works</a>
          <a href="#services" className="nav-link">Services</a>
          <a href="#factories" className="nav-link">Factories</a>
          <a href="#contact" className="nav-link">Contact</a>

          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="avatar">{user.email?.[0]?.toUpperCase() || 'U'}</div>
                <div className="user-details">
                  <span className="user-name">
                    {user.company_name || user.email?.split('@')[0]}
                  </span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>
              <div className="dropdown">
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
                {showDropdown && (
                  <div className="dropdown-content">
                    <Link to="/dashboard" onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-user"></i> Profile
                    </Link>
                    <Link to="/dashboard" onClick={() => setShowDropdown(false)}>
                      <i className="fas fa-cog"></i> Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <a href="#logout" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn btn-outline" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                Sign Up
              </button>
            </div>
          )}

          <button className="theme-toggle-auth" onClick={toggleTheme}>
            <i className="fas fa-moon"></i>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;