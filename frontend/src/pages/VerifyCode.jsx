import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/auth.css";

export default function VerifyCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { verifyRegisterCode, resendRegisterCode } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // берем challengeId либо из state, либо из localStorage (на случай обновления страницы)
  const challengeId =
  location.state?.challengeId || localStorage.getItem("pending_register_challenge_id");

const onVerify = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  const result = await verifyRegisterCode(challengeId, code);

  setLoading(false);
  if (result.success) navigate("/dashboard");
  else setError(result.error || "Invalid or expired code");
};

const onResend = async () => {
  setError("");
  const result = await resendRegisterCode(challengeId);

  if (!result.success) {
    setError(result.error || "Resend failed");
    return;
  }
  alert("New code sent to your email.");
};

  if (!challengeId) {
    return (
      <div className="auth-page">
        <div className="form-section">
          <div className="form-container">
            <div className="auth-header">
              <h1 className="auth-title">No code request</h1>
              <p className="auth-subtitle">Please login again to receive a code.</p>
            </div>
            <div className="auth-footer">
              <p>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  Go to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="image-section">
        <div className="image-container">
          <img src="/resources/PCBFABR.jpg" alt="PCB Manufacturing Process" />
          <div className="image-overlay"></div>
          <div className="image-caption">
            <h3>Secure Login</h3>
            <p>We sent a verification code to your email. Enter it to continue.</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-container">
          <div className="auth-header">
            <h1 className="auth-title">Verify Code</h1>
            <p className="auth-subtitle">Enter the 6-digit code from your email</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={onVerify}>
            <div className="form-group">
              <label htmlFor="code" className="form-label required">
                Code
              </label>
              <div className="input-container">
                <input
                  id="code"
                  name="code"
                  className="form-input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-key"></i>
                </div>
              </div>
            </div>

            <div className="form-footer">
              <button type="button" className="social-btn google" onClick={onResend}>
                <i className="fas fa-redo"></i>
                <span>Resend code</span>
              </button>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Verifying...
                  </>
                ) : (
                  <>
                    <span>Verify</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/login" className="GoBack">
                <i className="fas fa-arrow-left"></i> Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
