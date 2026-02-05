import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import VerifyLoginModal from "../components/modals/VerifyLoginModal";
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    country: '',
    company_name: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, login } = useContext(AuthContext);

  const [otpOpen, setOtpOpen] = useState(false);
  const [challengeId, setChallengeId] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        // авто-логин после регистрации (чтобы backend отправил OTP)
        const loginResult = await login(formData.email, formData.password);

        if (loginResult.success) {
          navigate("/dashboard");
          return;
        }

        if (loginResult.mfaRequired) {
          setChallengeId(loginResult.challengeId);
          setOtpOpen(true);
          return;
        }

        setError(loginResult.error || "Login failed after registration");
        return;
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Sign up to access PCB manufacturing services</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <div className="input-container">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-input"
                    placeholder="Enter your username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <div className="input-icon">
                    <i className="fas fa-user"></i>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <div className="input-container">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="your.email@example.com"
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
                <label htmlFor="password" className="form-label">Password *</label>
                <div className="input-container">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="Enter your password (min 8 characters)"
                    required
                    minLength="8"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className="input-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country" className="form-label">Country *</label>
                <div className="select_wrapper">
                  <i className="fas fa-globe"></i>
                  <select
                    id="country"
                    name="country"
                    className="country_selection"
                    required
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="" disabled hidden>Select your country...</option>
                    <option value="Armenia" data-icon="🇦🇲">Armenia</option>
                    <option value="Germany" data-icon="🇩🇪">Germany</option>
                    <option value="Ukraine" data-icon="🇺🇦">Ukraine</option>
                    <option value="USA" data-icon="🇺🇸">United States</option>
                    <option value="Australia" data-icon="🇦🇺">Australia</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="company_name" className="form-label">Company Name</label>
                <div className="input-container">
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    className="form-input"
                    placeholder="Your Company LLC"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                  <div className="input-icon">
                    <i className="fas fa-building"></i>
                  </div>
                </div>
              </div>

              <div className="form-footer otp-actions">
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Creating Account...
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <i className="fas fa-arrow-right"></i>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="auth-footer">
              <p>
                <Link to="/" className="GoBack">
                  <i className="fas fa-arrow-left"></i> Back
                </Link>
                Already have an account?
                <Link to="/login" style={{ textDecoration: 'none', marginLeft: '5px' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <VerifyLoginModal
        open={otpOpen}
        email={formData.email}
        challengeId={challengeId}
        onClose={() => setOtpOpen(false)}
        onSuccess={() => navigate("/dashboard")}
      />
    </>
  );
};

export default Register;
