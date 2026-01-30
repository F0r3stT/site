// src/components/layout/Header.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Обновление активной ссылки при скролле
      const sections = ['how-it-works', 'services', 'factories', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveLink(currentSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Устанавливаем тему при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''} fade-in`}>
      <div className="header-content">
        <Link to="/" className="logo">
          <i className="fas fa-cube"></i>
          <span>Tangram</span>
        </Link>

        <nav className="nav-links">
          <a 
            href="#how-it-works" 
            className={`nav-link ${activeLink === 'how-it-works' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('how-it-works');
            }}
          >
            How It Works
          </a>
          <a 
            href="#services" 
            className={`nav-link ${activeLink === 'services' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('services');
            }}
          >
            Services
          </a>
          <a 
            href="#factories" 
            className={`nav-link ${activeLink === 'factories' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('factories');
            }}
          >
            Factories
          </a>
          <a 
            href="#contact" 
            className={`nav-link ${activeLink === 'contact' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('contact');
            }}
          >
            Contact
          </a>
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <div className="dropdown">
                <div 
                  className="user-info" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="avatar">
                    {user.company_name ? user.company_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.company_name || user.email.split('@')[0]}
                    </div>
                    <div className="user-role">{user.role || 'user'}</div>
                  </div>
                  <i className={`fas fa-chevron-down ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                </div>
                
                <div className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>
                    <i className="fas fa-tachometer-alt"></i>
                    Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    <i className="fas fa-user"></i>
                    Profile Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <a href="#" onClick={(e) => { 
                    e.preventDefault(); 
                    handleLogout(); 
                    setDropdownOpen(false);
                  }}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline slide-up" style={{animationDelay: '0.1s'}}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary slide-up" style={{animationDelay: '0.2s'}}>
                Sign Up
              </Link>
            </div>
          )}

          <button 
            className="theme-toggle-auth scale-in" 
            onClick={toggleTheme} 
            title="Toggle theme"
            style={{animationDelay: '0.3s'}}
          >
            <i className="fas fa-moon"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;