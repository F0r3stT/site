import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import "../../styles/auth.css";


export default function VerifyLoginModal({
  open,
  email,
  challengeId,
  onClose,
  onSuccess,
}) {
  const { verifyLoginCode, resendLoginCode } = useContext(AuthContext);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
    }
  }, [open, challengeId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && open) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const onVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verifyLoginCode(challengeId, code);
    setLoading(false);

    if (result.success) {
      onClose?.();
      onSuccess?.();
    } else {
      setError(result.error || "Invalid or expired code");
    }
  };

  const onResend = async () => {
    setError("");
    const result = await resendLoginCode(challengeId);
    if (!result.success) {
      setError(result.error || "Resend failed");
      return;
    }
    alert("New code sent to your email.");
  };

  return (
    <div
      className="otp-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="otp-modal" role="dialog" aria-modal="true">
        <div className="otp-modal-header">
          <div className="otp-modal-title-row">
            <h2 className="otp-modal-title">Email confirmation</h2>

            <button
              type="button"
              className="otp-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <p className="otp-modal-subtitle">
            We sent a 6-digit code to <b>{email}</b>. Enter it to continue.
          </p>
        </div>

        <div className="otp-modal-body">
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={onVerify}>
            <div className="form-group">
              <label htmlFor="code" className="form-label">
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
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-key"></i>
                </div>
              </div>
            </div>

            <div className="form-footer otp-actions">
              <button
                type="button"
                className="social-btn google"
                onClick={onResend}
              >
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
        </div>
      </div>
    </div>
  );
}
