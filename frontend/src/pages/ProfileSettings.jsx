// src/pages/ProfileSettings.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  
  // Инициализация данных пользователя
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ')[1] || '',
        email: user.email || '',
        phone: user.phone || '',
        companyName: user.company_name || '',
      }));
    }
  }, [user]);
  
  // Обработчик изменений формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Если поля пароля заполнены, проверяем их
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Сохранение профиля
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix errors' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Обновляем данные в контексте
      updateUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company_name: formData.companyName,
      });
      
      // Симуляция API-запроса
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Очистка полей пароля
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Заголовок */}
        <div className="profile-header">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
          <h1>Profile Settings</h1>
          <p>Manage your account information and password</p>
        </div>
        {/* Форма */}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-columns">
            {/* Левая колонка - Личная информация */}
            <div className="form-column">
              <div className="column-title">
                <i className="fas fa-user"></i>
                <h3>Personal Information</h3>
              </div>
              
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
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
                  placeholder="Doe"
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  placeholder="john@example.com"
                  disabled
                />
                {errors.email && <div className="error">{errors.email}</div>}
                <div className="field-hint">Email cannot be changed</div>
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
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
                  placeholder="Company Ltd."
                />
              </div>
            </div>
            
            {/* Правая колонка - Смена пароля */}
            <div className="form-column">
              <div className="column-title">
                <i className="fas fa-key"></i>
                <h3>Change Password</h3>
              </div>
              
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
            </div>
          </div>
          
          {/* Сообщения */}
          {message.text && (
            <div className={`message ${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
          )}
          
          {/* Кнопки */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading}
            >
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