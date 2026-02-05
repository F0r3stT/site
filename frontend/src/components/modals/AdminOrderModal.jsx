import React, { useState } from 'react';
import '../../styles/modals.css'; 

const AdminOrderModal = ({ order, onClose, onSave }) => {
    const [status, setStatus] = useState(order.status);
    const [assignee, setAssignee] = useState(order.assignee_id || "");
    // Если нужно редактировать цену вручную (для Not Found деталей)
    const [price, setPrice] = useState(order.total_price);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(order.id, { 
            status, 
            assignee_id: assignee || null,
            total_price: Number(price) // Если добавишь это поле в API
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ minWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Manage Order #{order.id.slice(0,8)}</h2>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                
                <div className="modal-body" style={{ display: 'flex', gap: '20px' }}>
                    {/* Левая колонка: Инфо */}
                    <div style={{ flex: 1 }}>
                        <h3>Client Info</h3>
                        <p><strong>Email:</strong> {order.email}</p>
                        <p><strong>Company:</strong> {order.company_name || 'N/A'}</p>
                        
                        <h3 style={{marginTop: '20px'}}>PCB Files</h3>
                        <a href={`/uploads/${order.file_path}`} target="_blank" rel="noreferrer">
                            📥 Download Gerber
                        </a>
                        
                        <h3 style={{marginTop: '20px'}}>BOM List</h3>
                         {/* Здесь можно вывести список товаров, если есть */}
                        <div style={{ border: '1px solid #eee', padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                            <p><i>BOM Items visualization would go here...</i></p>
                        </div>
                    </div>

                    {/* Правая колонка: Управление */}
                    <div style={{ flex: 1, background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                        <form onSubmit={handleSubmit}>
                            <label style={{display:'block', marginBottom:'10px'}}>
                                <strong>Change Status:</strong>
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                                >
                                    <option value="reviewing">Reviewing (На проверке)</option>
                                    <option value="payment_pending">Payment Pending (Оплата)</option>
                                    <option value="production">Production (В работе)</option>
                                    <option value="ready">Ready (Готов)</option>
                                    <option value="completed">Completed (Выдан)</option>
                                    <option value="cancelled">Cancelled (Отмена)</option>
                                </select>
                            </label>

                            <label style={{display:'block', marginBottom:'10px'}}>
                                <strong>Assign To (Distribution):</strong>
                                <select 
                                    value={assignee} 
                                    onChange={(e) => setAssignee(e.target.value)}
                                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                                >
                                    <option value="">-- Unassigned --</option>
                                    <option value="uuid-admin-1">Admin Main</option>
                                    <option value="uuid-manager-2">Manager Suren</option>
                                    {/* В идеале этот список грузится из API /admin/users */}
                                </select>
                            </label>
                            
                            <label style={{display:'block', marginBottom:'20px'}}>
                                <strong>Manual Price Override (AMD):</strong>
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={{width: '100%', padding: '8px', marginTop: '5px'}}
                                />
                                <small style={{color:'gray'}}>Use if BOM calculation was partial.</small>
                            </label>

                            <button type="submit" className="btn-primary" style={{width: '100%'}}>
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderModal;