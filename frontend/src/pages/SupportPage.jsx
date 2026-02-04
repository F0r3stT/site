import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SupportPage.css';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    issueType: 'order',
    name: '',
    email: '',
    orderId: '',
    subject: '',
    description: '',
    attachments: [],
    urgency: 'medium'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Имитация отправки данных
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Сброс формы через 5 секунд
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          issueType: 'order',
          name: '',
          email: '',
          orderId: '',
          subject: '',
          description: '',
          attachments: [],
          urgency: 'medium'
        });
      }, 5000);
    }, 1500);
  };

  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  return (
    <div className="support-page">
      {/* Заголовок страницы */}
      <div className="support-header">
        <div className="support-header-content">
          <h1>Contact Support</h1>
          <p>Get help with your orders, report issues, or provide feedback about our platform</p>
        </div>
        <div className="support-header-stats">
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <div>
              <h3>24/7</h3>
              <p>Support Available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="support-container">
        {/* Левая панель - быстрые действия */}
        <div className="support-sidebar">
          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="action-list">
              <Link to="/faq" className="action-btn">
                <i className="fas fa-question-circle"></i>
                <span>Browse FAQ</span>
              </Link>
              <Link to="/dashboard" className="action-btn">
                <i className="fas fa-clipboard-list"></i>
                <span>My Orders</span>
              </Link>
              <a href="tel:+37412345678" className="action-btn">
                <i className="fas fa-phone"></i>
                <span>Call Support</span>
              </a>
              <button 
                className="action-btn" 
                onClick={() => window.open('https://t.me/pcbhub_support', '_blank')}
              >
                <i className="fab fa-telegram"></i>
                <span>Telegram Chat</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Support Hours</h3>
            <div className="hours-info">
              <div className="hours-item">
                <span className="hours-day">Monday - Friday</span>
                <span className="hours-time">9:00 - 18:00</span>
              </div>
              <div className="hours-item">
                <span className="hours-day">Saturday</span>
                <span className="hours-time">10:00 - 16:00</span>
              </div>
              <div className="hours-item">
                <span className="hours-day">Emergency</span>
                <span className="hours-time urgent">24/7</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Common Issues</h3>
            <div className="common-issues">
              <button 
                className="issue-tag"
                onClick={() => setFormData(prev => ({ ...prev, subject: 'Order Delay', issueType: 'order' }))}
              >
                Order Delay
              </button>
              <button 
                className="issue-tag"
                onClick={() => setFormData(prev => ({ ...prev, subject: 'Technical Problem', issueType: 'website' }))}
              >
                Technical Problem
              </button>
              <button 
                className="issue-tag"
                onClick={() => setFormData(prev => ({ ...prev, subject: 'Billing Issue', issueType: 'payment' }))}
              >
                Billing Issue
              </button>
              <button 
                className="issue-tag"
                onClick={() => setFormData(prev => ({ ...prev, subject: 'Design Review', issueType: 'technical' }))}
              >
                Design Review
              </button>
            </div>
          </div>
        </div>

        {/* Основной контент - форма */}
        <div className="support-content">
          {isSubmitted ? (
            <div className="success-message">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Thank You!</h2>
              <p>Your support request has been submitted. We'll contact you within 24 hours.</p>
              <p className="success-note">Ticket ID: <strong>SUP-{Date.now().toString().slice(-6)}</strong></p>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsSubmitted(false)}
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form className="support-form" onSubmit={handleSubmit}>
              <div className="form-header">
                <h2>Submit a Support Request</h2>
                <p>Fill out the form below and our team will get back to you as soon as possible</p>
              </div>

              <div className="form-grid">
                {/* Тип проблемы */}
                <div className="form-group">
                  <label htmlFor="issueType">
                    <i className="fas fa-exclamation-circle"></i>
                    Issue Type
                  </label>
                  <div className="type-selector">
                    {['order', 'website', 'technical', 'payment', 'other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`type-btn ${formData.issueType === type ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, issueType: type }))}
                      >
                        <i className={`fas fa-${
                          type === 'order' ? 'box' :
                          type === 'website' ? 'globe' :
                          type === 'technical' ? 'cog' :
                          type === 'payment' ? 'credit-card' : 'question-circle'
                        }`}></i>
                        <span>
                          {type === 'order' ? 'Order Issue' :
                           type === 'website' ? 'Website Problem' :
                           type === 'technical' ? 'Technical Support' :
                           type === 'payment' ? 'Payment Issue' : 'Other'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Срочность */}
                <div className="form-group">
                  <label htmlFor="urgency">
                    <i className="fas fa-clock"></i>
                    Urgency Level
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Need help soon</option>
                    <option value="high">High - Urgent issue</option>
                    <option value="critical">Critical - Production stopped</option>
                  </select>
                </div>
              </div>

              {/* Личная информация */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    <i className="fas fa-user"></i>
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Smith"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <i className="fas fa-envelope"></i>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* ID заказа и тема */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="orderId">
                    <i className="fas fa-hashtag"></i>
                    Order ID (if applicable)
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    placeholder="PCB-2024-XXXX"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    <i className="fas fa-tag"></i>
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief description of your issue"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Описание проблемы */}
              <div className="form-group">
                <label htmlFor="description">
                  <i className="fas fa-align-left"></i>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please provide detailed information about your issue..."
                  className="form-textarea"
                  rows="6"
                  required
                />
                <div className="textarea-tips">
                  <i className="fas fa-lightbulb"></i>
                  <span>Include: Error messages, steps to reproduce, what you expected to happen</span>
                </div>
              </div>

              {/* Прикрепление файлов */}
              <div className="form-group">
                <label>
                  <i className="fas fa-paperclip"></i>
                  Attachments (Optional)
                </label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={handleFileChange}
                    className="file-input"
                    accept=".jpg,.jpeg,.png,.pdf,.zip,.ger,.xlsx,.csv"
                  />
                  <label htmlFor="attachments" className="upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <div>
                      <h4>Drop files or click to browse</h4>
                      <p>Max file size: 10MB. Supported: images, PDF, Gerber files, documents</p>
                    </div>
                  </label>
                </div>

                {/* Список прикрепленных файлов */}
                {formData.attachments.length > 0 && (
                  <div className="attachments-list">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="attachment-item">
                        <i className="fas fa-file-alt"></i>
                        <div className="attachment-info">
                          <span className="attachment-name">{file.name}</span>
                          <span className="attachment-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button
                          type="button"
                          className="attachment-remove"
                          onClick={() => removeAttachment(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопка отправки */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !formData.email || !formData.subject || !formData.description}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Submit Request
                    </>
                  )}
                </button>
                <div className="form-note">
                  <i className="fas fa-info-circle"></i>
                  <span>Average response time: 2-4 hours during business hours</span>
                </div>
              </div>
            </form>
          )}

          {/* Контактная информация */}
          <div className="contact-info">
            <div className="contact-card">
              <i className="fas fa-headset"></i>
              <div>
                <h4>Live Chat Support</h4>
                <p>Available during business hours</p>
                <button 
                  className="contact-action"
                  onClick={() => window.open('https://t.me/pcbhub_support', '_blank')}
                >
                  <i className="fab fa-telegram"></i>
                  Start Chat
                </button>
              </div>
            </div>

            <div className="contact-card">
              <i className="fas fa-phone"></i>
              <div>
                <h4>Phone Support</h4>
                <p>+374 (12) 345-678</p>
                <a href="tel:+37412345678" className="contact-action">
                  <i className="fas fa-phone"></i>
                  Call Now
                </a>
              </div>
            </div>

            <div className="contact-card">
              <i className="fas fa-envelope"></i>
              <div>
                <h4>Email Support</h4>
                <p>support@pcbhub.am</p>
                <a href="mailto:support@pcbhub.am" className="contact-action">
                  <i className="fas fa-envelope"></i>
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;