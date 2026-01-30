// pages/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import CreateOrderModal from '../components/modals/CreateOrderModal';
import OrderDetailsModal from '../components/modals/OrderDetailsModal';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    active: 5,
    completed: 24,
    pending: 3
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      setStats({ active: 0, completed: 0, pending: 0 });
      setOrders([
        { id: "demo-1", title: "Demo order", status: "draft", created_at: new Date().toISOString() }
      ]);
      return;
    }

    loadOrders();
    loadStats();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await orderService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const created = await orderService.createOrder(orderData);
      setShowCreateModal(false);
      loadOrders();
      return created;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
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

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-content">
            <h2>Welcome back, {user?.company_name || user?.email?.split('@')[0]}!</h2>
            <p>Manage your PCB manufacturing orders and track production progress</p>
          </div>
          <div className="welcome-stats">
            <div className="stat-badge">
              <i className="fas fa-clock"></i>
              <span>{stats.active} Active</span>
            </div>
            <div className="stat-badge">
              <i className="fas fa-check-circle"></i>
              <span>{stats.completed} Completed</span>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3>My Orders</h3>
          <div className="section-actions">
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i> New Order
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h4>No orders yet</h4>
          <p>Start your first PCB manufacturing order</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> Create First Order
          </button>
        </div>
      ) : (
        <div className="orders-container">
          {orders.map(order => {
            const statusInfo = getStatusBadge(order.status);
            
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-badge" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
                    <i className={statusInfo.icon}></i>
                    {statusInfo.label}
                  </div>
                  <div className="order-actions">
                    <button className="action-btn">
                      <i className="fas fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>
                <div className="order-content">
                  <div className="order-icon">
                    <i className="fas fa-microchip"></i>
                  </div>
                  <div className="order-details">
                    <h4>{order.title || 'Untitled Order'}</h4>
                    <p className="order-id">Order #{order.id}</p>
                    <div className="order-meta">
                      <span><i className="fas fa-layer-group"></i> {order.layer_count || 2} Layers</span>
                      <span><i className="fas fa-expand-arrows-alt"></i> {order.pcb_width || 100}x{order.pcb_height || 80}mm</span>
                      <span><i className="fas fa-hashtag"></i> {order.pcb_quantity || 10} pcs</span>
                    </div>
                  </div>
                </div>
                <div className="order-footer">
                  <button 
                    className="view-order-btn"
                    onClick={() => handleViewDetails(order)}
                  >
                    <i className="fas fa-external-link-alt"></i>
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;