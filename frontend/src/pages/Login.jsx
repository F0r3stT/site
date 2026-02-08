import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import VerifyLoginModal from "../components/modals/VerifyLoginModal";
import '../styles/auth.css'; 

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const result = await login(formData.email, formData.password);
if (result.success) navigate("/dashboard");
else setError(result.error || "Login failed");

};


  return (
    <div className="auth-page">
      <div className="image-section">
        <div className="image-container">
          <img src="/resources/PCBFABR.jpg" alt="PCB Manufacturing Process" />
          <div className="image-overlay"></div>
          <div className="image-caption">
            <h3>Advanced PCB Manufacturing</h3>
            <p>Connect with manufacturers and streamline your electronics production with our secure platform.</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-container">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to access PCB manufacturing services</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-container">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
              </div>
            </div>

            <div className="form-footer otp-actions">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-auth">
            <button type="button" className="social-btn google">
              <i className="fab fa-google"></i>
              <span>Google</span>
            </button>
            <button type="button" className="social-btn linkedin">
              <i className="fab fa-linkedin"></i>
              <span>LinkedIn</span>
            </button>
          </div>

          <div className="auth-footer">
            <p>
              <Link to="/" className="GoBack">
                <i className="fas fa-arrow-left"></i> Back
              </Link>
              Don't have an account?
              <Link to="/register" style={{ textDecoration: 'none', marginLeft: '5px' }}>
                Sign Up
              </Link>
            </p>
  
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;