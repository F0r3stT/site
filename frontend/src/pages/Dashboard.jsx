import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom'; // Добавляем этот импорт!
import { AuthContext } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import OrderDetailsModal from '../components/modals/OrderDetailsModal';
import '../styles/dashboard.css'; // Убедитесь, что стили подключены

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    pending: 0
  });

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders();
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // ПРЕДПОЛОЖИМ, что есть отдельный метод для статистики
      const data = await orderService.getStats(); // ← Изменил на getStats()
      setStats(data || { active: 0, completed: 0, pending: 0 });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Если метода нет, можно считать из orders
      const activeOrders = orders.filter(order => 
        ['pending', 'in_production', 'review'].includes(order.status)
      ).length;
      const completedOrders = orders.filter(order => 
        ['completed', 'shipped'].includes(order.status)
      ).length;
      
      setStats({
        active: activeOrders,
        completed: completedOrders,
        pending: orders.filter(o => o.status === 'pending').length
      });
    }
  };

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-content">
            <h2>Welcome back, {user?.company_name || user?.email?.split('@')[0] || 'Guest'}!</h2>
            <p>Manage your PCB manufacturing orders and track production progress</p>
          </div>
          <div className="welcome-stats">
            <div className="stat-badge">
              <i className="fas fa-clock"></i>
              <span>{stats.active || 0} Active</span>
            </div>
            <div className="stat-badge">
              <i className="fas fa-check-circle"></i>
              <span>{stats.completed || 0} Completed</span>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h3>My Orders</h3>
          <div className="section-actions">
            <Link to="/create-order" className="btn btn-primary">
              <i className="fas fa-plus"></i> New Order
            </Link>
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
          <div className="empty-icon">
            <i className="fas fa-inbox"></i>
          </div>
          <h4>No orders yet</h4>
          <p>Start your first PCB manufacturing order</p>
          <Link to="/create-order" className="btn btn-primary">
            <i className="fas fa-plus"></i> Create First Order
          </Link>
        </div>
      ) : (
        <div className="orders-container">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-badge status-production">
                  <i className="fas fa-industry"></i>
                  {order.status === 'pending' ? 'Pending' :
                   order.status === 'in_production' ? 'In Production' :
                   order.status === 'review' ? 'Review' :
                   order.status === 'completed' ? 'Completed' :
                   order.status === 'shipped' ? 'Shipped' : 'Draft'}
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
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetails(true);
                  }}
                >
                  <i className="fas fa-external-link-alt"></i>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;