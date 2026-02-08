// src/pages/ProfileSettings.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import '../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [serverProfile, setServerProfile] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    emailVerified: false,
    country: '',
    phone: '',
    companyName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const fillFromProfile = (p) => {
    if (!p) return;
    setFormData((prev) => ({
      ...prev,
      firstName: p.firstName || p.first_name || prev.firstName || '',
      lastName: p.lastName || p.last_name || prev.lastName || '',
      email: p.email || prev.email || '',
      role: p.role || prev.role || '',
      emailVerified: Boolean(p.emailVerified ?? p.email_verified ?? prev.emailVerified),
      country: p.country || prev.country || '',
      phone: p.phone || prev.phone || '',
      companyName: p.companyName || p.company_name || prev.companyName || '',
    }));
  };

  // 1) Быстро заполняем из AuthContext (чтобы не мигало пустым)
  useEffect(() => {
    if (!user) return;
    fillFromProfile(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2) Подтягиваем актуальные данные с бэка (GET /profile)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile();
        setServerProfile(profile);
        updateUser(profile);
        fillFromProfile(profile);
      } catch (e) {
        const errText = e?.response?.data?.error || 'Failed to load profile from server';
        setMessage({ type: 'error', text: errText });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [updateUser]);

  const canSave = useMemo(() => isEditingInfo || isChangingPassword, [isEditingInfo, isChangingPassword]);

  const resetInfoToServer = () => {
    if (!serverProfile) return;
    fillFromProfile(serverProfile);
  };

  const resetPasswordFields = () => {
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (isEditingInfo) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    if (isChangingPassword) {
      if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
      if (!formData.newPassword) newErrors.newPassword = 'New password is required';
      if (formData.newPassword && formData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      if (formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSave) {
      setMessage({ type: 'error', text: 'Click "Change" first to edit profile or password' });
      return;
    }

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix errors' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let updatedProfile = serverProfile;

      // 1) обновление профиля
      if (isEditingInfo) {
        updatedProfile = await userService.updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.companyName,
          country: formData.country,
          email: formData.email, // email read-only, бэк проверит совпадение
        });

        setServerProfile(updatedProfile);
        updateUser(updatedProfile);
        setIsEditingInfo(false);
      }

      // 2) смена пароля
      if (isChangingPassword) {
        await userService.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });

        resetPasswordFields();
        setIsChangingPassword(false);
      }

      setMessage({ type: 'success', text: 'Changes saved successfully' });
    } catch (error) {
      const errText = error?.response?.data?.error || error?.message || 'Failed to update profile';
      setMessage({ type: 'error', text: errText });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMain = () => {
    if (isEditingInfo || isChangingPassword) {
      setIsEditingInfo(false);
      setIsChangingPassword(false);
      resetInfoToServer();
      resetPasswordFields();
      setMessage({ type: '', text: '' });
      setErrors({});
      return;
    }
    navigate(-1);
  };

  if (initialLoading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1>Profile Settings</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate(-1)} title="Go back">
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
          <h1>Profile Settings</h1>
          <p>Manage your account information and password</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-columns">
            {/* Левая колонка - Личные данные */}
            <div className="form-column">
              <div className="column-title">
                <div className="column-title-left">
                  <i className="fas fa-user"></i>
                  <h3>Personal Information</h3>
                </div>

                {!isEditingInfo ? (
                  <button
                    type="button"
                    className="change-button"
                    onClick={() => setIsEditingInfo(true)}
                    disabled={loading}
                  >
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    className="change-button secondary"
                    onClick={() => {
                      setIsEditingInfo(false);
                      resetInfoToServer();
                      setErrors((prev) => ({ ...prev, firstName: '', lastName: '', country: '' }));
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditingInfo}
                  className={errors.firstName ? 'input-error' : ''}
                  placeholder="John"
                />
                {errors.firstName && <div className="error">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditingInfo}
                  className={errors.lastName ? 'input-error' : ''}
                  placeholder="Doe"
                />
              </div>

              <div className="form-group">
                <label>Email (Login) *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className={errors.email ? 'input-error' : ''}
                  placeholder="john@example.com"
                />
                <div className="field-hint">Email cannot be changed</div>
                {errors.email && <div className="error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!isEditingInfo}
                  className={errors.country ? 'input-error' : ''}
                  placeholder="Armenia"
                />
                {errors.country && <div className="error">{errors.country}</div>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditingInfo}
                  className={errors.phone ? 'input-error' : ''}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={!isEditingInfo}
                  className={errors.companyName ? 'input-error' : ''}
                  placeholder="Company Ltd."
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input type="text" value={String(formData.role || '')} disabled />
              </div>

              <div className="form-group">
                <label>Email Verified</label>
                <input type="text" value={formData.emailVerified ? 'Yes' : 'No'} disabled />
              </div>
            </div>

            {/* Правая колонка - Смена пароля */}
            <div className="form-column">
              <div className="column-title">
                <div className="column-title-left">
                  <i className="fas fa-key"></i>
                  <h3>Change Password</h3>
                </div>

                {!isChangingPassword ? (
                  <button
                    type="button"
                    className="change-button"
                    onClick={() => setIsChangingPassword(true)}
                    disabled={loading}
                  >
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    className="change-button secondary"
                    onClick={() => {
                      setIsChangingPassword(false);
                      resetPasswordFields();
                      setErrors((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isChangingPassword ? (
                <div className="field-hint">Password: ••••••••</div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input">
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className={errors.currentPassword ? 'input-error' : ''}
                        placeholder="••••••••"
                      />
                      <i className="fas fa-lock"></i>
                    </div>
                    {errors.currentPassword && <div className="error">{errors.currentPassword}</div>}
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input">
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={errors.newPassword ? 'input-error' : ''}
                        placeholder="••••••••"
                      />
                      <i className="fas fa-key"></i>
                    </div>
                    {errors.newPassword && <div className="error">{errors.newPassword}</div>}
                    <div className="field-hint">Leave empty if you don't want to change</div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input">
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? 'input-error' : ''}
                        placeholder="••••••••"
                      />
                      <i className="fas fa-check"></i>
                    </div>
                    {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
                  </div>
                </>
              )}
            </div>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancelMain} disabled={loading}>
              {isEditingInfo || isChangingPassword ? 'Discard Changes' : 'Back'}
            </button>

            <button type="submit" className="btn-save" disabled={loading || !canSave}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
