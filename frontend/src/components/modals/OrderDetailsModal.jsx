// components/modals/OrderDetailsModal.jsx
import './OrderDetails.css';
import React from 'react';

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { color: 'var(--text-muted)', label: 'Draft', icon: 'fas fa-edit' },
      pending: { color: 'var(--accent-gold)', label: 'Pending', icon: 'fas fa-clock' },
      in_production: { color: 'var(--primary)', label: 'In Production', icon: 'fas fa-industry' },
      review: { color: 'var(--warning)', label: 'Design Review', icon: 'fas fa-search' },
      completed: { color: 'var(--success)', label: 'Completed', icon: 'fas fa-check-circle' },
      shipped: { color: 'var(--accent-teal)', label: 'Shipped', icon: 'fas fa-shipping-fast' },
      cancelled: { color: 'var(--danger)', label: 'Cancelled', icon: 'fas fa-times-circle' }
    };
    
    return statusMap[status] || statusMap.draft;
  };

  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h3>Order Details</h3>
            <div className="order-status-badge" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
              <i className={statusInfo.icon}></i>
              <span>{statusInfo.label}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Основная информация */}
          <div className="order-detail-section">
            <h4><i className="fas fa-info-circle"></i> Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Order ID</span>
                <span className="detail-value">{order.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Title</span>
                <span className="detail-value">{order.title || 'Untitled Order'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">{formatDate(order.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(order.updated_at || order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Спецификации PCB */}
          <div className="order-detail-section">
            <h4><i className="fas fa-microchip"></i> PCB Specifications</h4>
            <div className="spec-grid">
              <div className="spec-card">
                <div className="spec-icon">
                  <i className="fas fa-layer-group"></i>
                </div>
                <div className="spec-info">
                  <span className="spec-label">Layers</span>
                  <span className="spec-value">{order.layer_count || 2}</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">
                  <i className="fas fa-expand-arrows-alt"></i>
                </div>
                <div className="spec-info">
                  <span className="spec-label">Board Size</span>
                  <span className="spec-value">{order.pcb_width || 100} × {order.pcb_height || 80} mm</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">
                  <i className="fas fa-hashtag"></i>
                </div>
                <div className="spec-info">
                  <span className="spec-label">Quantity</span>
                  <span className="spec-value">{order.pcb_quantity || 10} pcs</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">
                  <i className="fas fa-weight"></i>
                </div>
                <div className="spec-info">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{order.material || 'FR-4'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Дополнительные детали */}
          {order.description && (
            <div className="order-detail-section">
              <h4><i className="fas fa-align-left"></i> Description</h4>
              <div className="description-box">
                <p>{order.description}</p>
              </div>
            </div>
          )}

          {/* Файлы */}
          {order.files && order.files.length > 0 && (
            <div className="order-detail-section">
              <h4><i className="fas fa-file"></i> Attached Files</h4>
              <div className="files-list">
                {order.files.map((file, index) => (
                  <div key={index} className="file-item">
                    <i className="fas fa-file-alt"></i>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size}</span>
                    </div>
                    <button className="file-download">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Прогресс производства */}
          <div className="order-detail-section">
            <h4><i className="fas fa-chart-line"></i> Production Progress</h4>
            <div className="progress-section">
              <div className="progress-steps">
                <div className={`progress-step ${order.status === 'draft' ? 'active' : 'completed'}`}>
                  <div className="step-number">1</div>
                  <div className="step-info">
                    <span className="step-title">Draft</span>
                    <span className="step-date">Created</span>
                  </div>
                </div>
                <div className={`progress-step ${order.status === 'pending' ? 'active' : order.status === 'draft' ? '' : 'completed'}`}>
                  <div className="step-number">2</div>
                  <div className="step-info">
                    <span className="step-title">Quotation</span>
                    <span className="step-date">Awaiting quotes</span>
                  </div>
                </div>
                <div className={`progress-step ${order.status === 'review' ? 'active' : order.status === 'in_production' || order.status === 'completed' || order.status === 'shipped' ? 'completed' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-info">
                    <span className="step-title">Design Review</span>
                    <span className="step-date">In progress</span>
                  </div>
                </div>
                <div className={`progress-step ${order.status === 'in_production' ? 'active' : order.status === 'completed' || order.status === 'shipped' ? 'completed' : ''}`}>
                  <div className="step-number">4</div>
                  <div className="step-info">
                    <span className="step-title">Production</span>
                    <span className="step-date">Estimated 5-7 days</span>
                  </div>
                </div>
                <div className={`progress-step ${order.status === 'completed' || order.status === 'shipped' ? 'active' : ''}`}>
                  <div className="step-number">5</div>
                  <div className="step-info">
                    <span className="step-title">Completed</span>
                    <span className="step-date">Ready for shipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Контакты производителя */}
          <div className="order-detail-section">
            <h4><i className="fas fa-industry"></i> Manufacturer</h4>
            <div className="manufacturer-contact">
              <div className="manufacturer-avatar">
                <i className="fas fa-warehouse"></i>
              </div>
              <div className="manufacturer-info">
                <span className="manufacturer-name">Armenia PCB Tech</span>
                <span className="manufacturer-contact">contact@armeniapcb.am</span>
                <span className="manufacturer-phone">+374 12 345678</span>
              </div>
              <button className="contact-btn">
                <i className="fas fa-envelope"></i>
                Contact
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {order.status === 'pending' && (
            <button className="btn btn-primary">
              <i className="fas fa-edit"></i>
              Edit Order
            </button>
          )}
          {order.status === 'draft' && (
            <button className="btn btn-danger">
              <i className="fas fa-trash"></i>
              Delete Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;