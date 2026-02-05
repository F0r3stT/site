import api from './api'; // твой настроенный axios instance

export const getAdminOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
};

export const updateOrderStatus = async (orderId, data) => {
    // data = { status: 'production', assignee_id: '...' }
    const response = await api.patch(`/admin/orders/${orderId}`, data);
    return response.data;
};

export const deleteOrder = async (orderId) => {
    return await api.delete(`/admin/orders/${orderId}`);
};