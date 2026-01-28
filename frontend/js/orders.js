// Загрузка заказов пользователя
async function loadUserOrders() {
    if (!currentUser || !authToken) return;
    
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading orders...
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            renderOrders(orders, container);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load orders</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Network error. Please try again.</p>
            </div>
        `;
    }
}

// Загрузка доступных заказов (для заводов)
async function loadAvailableOrders() {
    if (!currentUser || !authToken || currentUser.role !== 'factory') return;
    
    const container = document.getElementById('available-orders-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading available orders...
        </div>
    `;
    
    try {
        const filter = document.getElementById('order-filter')?.value || 'all';
        const search = document.getElementById('search-orders')?.value || '';
        
        const url = new URL(`${API_BASE_URL}/factory/orders`);
        if (filter !== 'all') url.searchParams.append('filter', filter);
        if (search) url.searchParams.append('search', search);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            renderAvailableOrders(orders, container);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load available orders</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load available orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Network error. Please try again.</p>
            </div>
        `;
    }
}

// Рендеринг заказов пользователя
function renderOrders(orders, container) {
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No orders yet</h3>
                <p>Create your first order to get started</p>
                <button class="btn btn-primary" onclick="showCreateOrderModal()">
                    <i class="fas fa-plus"></i> Create Order
                </button>
            </div>
        `;
        return;
    }
    
    const ordersHtml = orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <h3 class="order-title">${escapeHtml(order.title)}</h3>
                    <p class="order-description">${escapeHtml(order.description.substring(0, 100))}${order.description.length > 100 ? '...' : ''}</p>
                </div>
                <span class="order-status status-${order.status}">
                    ${formatStatus(order.status)}
                </span>
            </div>
            
            <div class="order-meta">
                <span class="order-tag">
                    <i class="fas fa-layer-group"></i> ${order.layer_count} layers
                </span>
                <span class="order-tag">
                    <i class="fas fa-cube"></i> ${order.pcb_quantity} pcs
                </span>
                ${order.smt_required ? `
                    <span class="order-tag">
                        <i class="fas fa-robot"></i> SMT Required
                    </span>
                ` : ''}
                <span class="order-tag">
                    <i class="fas fa-calendar"></i> ${formatDate(order.created_at)}
                </span>
            </div>
            
            <div class="order-actions">
                ${order.status === 'draft' ? `
                    <button class="btn btn-outline btn-sm" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="submitOrder('${order.id}')">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                ` : ''}
                
                ${order.status === 'quoted' ? `
                    <button class="btn btn-success btn-sm" onclick="viewQuote('${order.id}')">
                        <i class="fas fa-file-invoice-dollar"></i> View Quote
                    </button>
                ` : ''}
                
                <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHtml;
}

// Рендеринг доступных заказов
function renderAvailableOrders(orders, container) {
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No available orders</h3>
                <p>Check back later for new orders</p>
                <button class="btn btn-outline" onclick="refreshOrders()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    const ordersHtml = orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <h3 class="order-title">${escapeHtml(order.title)}</h3>
                    <p class="order-description">${escapeHtml(order.description.substring(0, 100))}${order.description.length > 100 ? '...' : ''}</p>
                </div>
                <span class="order-tag">
                    <i class="fas fa-tag"></i> ${order.pcb_quantity} × ${order.pcb_width}mm × ${order.pcb_height}mm
                </span>
            </div>
            
            <div class="order-meta">
                <span class="order-tag">
                    <i class="fas fa-layer-group"></i> ${order.layer_count} layers
                </span>
                <span class="order-tag">
                    <i class="fas fa-dollar-sign"></i> Budget: ${order.budget || 'Not specified'}
                </span>
                <span class="order-tag">
                    <i class="fas fa-clock"></i> ${order.due_date ? formatDate(order.due_date) : 'No deadline'}
                </span>
                ${order.smt_required ? `
                    <span class="order-tag">
                        <i class="fas fa-robot"></i> SMT Assembly
                    </span>
                ` : ''}
            </div>
            
            <div class="order-footer">
                <div class="order-stats">
                    <span class="stat">
                        <i class="fas fa-industry"></i> ${order.offer_count || 0} offers
                    </span>
                </div>
                <div class="order-actions">
                    <button class="btn btn-primary btn-sm" onclick="createOffer('${order.id}')">
                        <i class="fas fa-handshake"></i> Make Offer
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHtml;
}

// Создание заказа
async function createNewOrder(orderData) {
    if (!currentUser || !authToken) {
        showAlert('Please login to create an order', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#create-order-form button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.status === 201) {
            showAlert('Order created successfully!', 'success');
            closeModal('create-order-modal');
            
            // Обновляем список заказов
            loadUserOrders();
            
            // Сбрасываем форму
            document.getElementById('create-order-form').reset();
        } else {
            showAlert(data.error || 'Failed to create order', 'error');
        }
    } catch (error) {
        console.error('Failed to create order:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Order';
    }
}

// Инициализация модального окна создания заказа
function initCreateOrderModal() {
    const form = document.getElementById('create-order-form');
    if (form) {
        form.addEventListener('submit', handleCreateOrder);
    }
    
    // Обработчик загрузки файлов
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('click', () => {
            document.getElementById('order-files').click();
        });
        
        document.getElementById('order-files').addEventListener('change', handleFileSelect);
    }
}

// Обработка создания заказа
async function handleCreateOrder(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('order-title').value,
        description: document.getElementById('order-description').value,
        pcb_quantity: parseInt(document.getElementById('pcb-quantity').value),
        pcb_width: parseInt(document.getElementById('pcb-width').value),
        pcb_height: parseInt(document.getElementById('pcb-height').value),
        layer_count: parseInt(document.getElementById('layer-count').value),
        material: document.getElementById('material').value,
        smt_required: document.getElementById('smt-required').checked,
        components_qty: document.getElementById('smt-required').checked ? 
            parseInt(document.getElementById('components-qty').value) : 0
    };
    
    // Валидация
    if (!formData.title || !formData.description || !formData.pcb_quantity) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    await createNewOrder(formData);
}

// Обработка выбора файлов
function handleFileSelect(e) {
    const files = e.target.files;
    const fileList = document.getElementById('file-list');
    
    if (!files.length) return;
    
    fileList.innerHTML = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeFile(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    }
}

// Вспомогательные функции
function formatStatus(status) {
    return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обновление заказов
function refreshOrders() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('onclick').match(/switchTab\('([^']+)'\)/)[1];
        switch(tabName) {
            case 'my-orders':
                loadUserOrders();
                break;
            case 'available-orders':
                loadAvailableOrders();
                break;
        }
    }
}