import React, { useEffect, useState } from 'react';
import { getAdminOrders, deleteOrder, updateOrderStatus } from '../services/adminService';
import AdminOrderModal from '../components/modals/AdminOrderModal';
import '../styles/dashboard.css'; // Используем существующие стили или создаем admin.css

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getAdminOrders();
            setOrders(data);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            await deleteOrder(id);
            fetchOrders();
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleSave = async (id, updatedData) => {
        await updateOrderStatus(id, updatedData);
        setIsModalOpen(false);
        fetchOrders();
    };

    // Helper для цвета статуса (как в Django)
    const getStatusColor = (status) => {
        switch(status) {
            case 'ready': return 'bg-green-100 text-green-800';
            case 'production': return 'bg-blue-100 text-blue-800';
            case 'reviewing': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="admin-container" style={{ padding: '20px' }}>
            <h1>Admin Panel</h1>
            
            <table className="django-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead style={{ background: '#79aec8', color: 'white' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>Order ID</th>
                        <th>Client (Email)</th>
                        <th>Created At</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Assignee</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px' }}>{order.id.slice(0, 8)}...</td>
                            <td>
                                <div>{order.email}</div>
                                <small style={{color: '#666'}}>{order.company_name}</small>
                            </td>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td>{order.total_price} AMD</td>
                            <td>
                                <span className={`px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td>{order.assignee_id ? "Manager" : "—"}</td>
                            <td>
                                <button onClick={() => handleEdit(order)} style={{ marginRight: '10px', cursor: 'pointer' }}>✏️ Edit</button>
                                <button onClick={() => handleDelete(order.id)} style={{ color: 'red', cursor: 'pointer' }}>🗑️ Del</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <AdminOrderModal 
                    order={selectedOrder} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default AdminDashboard;