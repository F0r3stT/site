// Конфигурация
const API_BASE_URL = 'http://localhost:3000/api/v1';
let currentUser = null;
let authToken = null;

// Инициализация приложения
async function initApp() {
    await checkAuth();
    await loadStats();
    
    // Обновление интерфейса в зависимости от роли
    updateUIForUserRole();
    
    // Загрузка заказов если пользователь авторизован
    if (currentUser) {
        loadUserOrders();
    }
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        try {
            // Проверяем валидность токена
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                authToken = token;
                currentUser = JSON.parse(userData);
                updateAuthUI(true);
                return true;
            } else {
                // Пробуем обновить токен
                const refreshed = await refreshToken();
                if (!refreshed) {
                    logout();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    }
    
    updateAuthUI(false);
    return false;
}

// Обновление UI для роли пользователя
function updateUIForUserRole() {
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (currentUser) {
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        
        // Обновляем табы в зависимости от роли
        const tabs = document.querySelector('.tabs');
        if (tabs && currentUser.role === 'factory') {
            const factoryTab = `
                <button class="tab-btn" onclick="switchTab('factory-dashboard')">
                    <i class="fas fa-chart-line"></i> Factory Dashboard
                </button>
            `;
            tabs.insertAdjacentHTML('beforeend', factoryTab);
        }
    } else {
        if (dashboardSection) {
            dashboardSection.style.display = 'none';
        }
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
            const stats = await response.json();
            
            // Анимируем счетчики
            animateCounter('active-orders', stats.active_orders || 154);
            animateCounter('registered-factories', stats.registered_factories || 23);
            animateCounter('completed-projects', stats.completed_projects || 892);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Анимация счетчиков
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 20);
}

// Переключение табов
function switchTab(tabName) {
    // Скрываем все табы
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранный таб
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.style.display = 'block';
        
        // Загружаем данные для таба
        switch(tabName) {
            case 'my-orders':
                loadUserOrders();
                break;
            case 'available-orders':
                loadAvailableOrders();
                break;
            case 'messages':
                loadMessages();
                break;
            case 'factory-dashboard':
                loadFactoryDashboard();
                break;
        }
    }
    
    // Делаем кнопку активной
    const activeBtn = document.querySelector(`[onclick*="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Загрузка компонентов
async function loadComponent(componentName, targetSelector, show = true) {
    try {
        const response = await fetch(`components/${componentName}.html`);
        if (response.ok) {
            const html = await response.text();
            const target = document.querySelector(targetSelector);
            if (target) {
                target.innerHTML = html;
                
                // Инициализация компонента
                switch(componentName) {
                    case 'header':
                        initHeader();
                        break;
                    case 'auth-modal':
                        initAuthModal();
                        break;
                    case 'create-order-modal':
                        initCreateOrderModal();
                        break;
                }
            }
        }
    } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error);
    }
}

// Показать модальное окно аутентификации
function showAuthModal(mode = 'login') {
    loadComponent('auth-modal', '#auth-modal', true).then(() => {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('active');
            switchAuthMode(mode);
        }
    });
}

// Закрыть модальное окно
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Прокрутка к разделу
function scrollToFeatures() {
    const features = document.querySelector('.features-section');
    if (features) {
        features.scrollIntoView({ behavior: 'smooth' });
    }
}

// Создание заказа
function createOrder(type) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    loadComponent('create-order-modal', '#create-order-modal', false).then(() => {
        const modal = document.getElementById('create-order-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Установка типа заказа
            if (type === 'pcb') {
                document.getElementById('order-type').value = 'pcb';
                document.getElementById('smt-required').checked = false;
            } else if (type === 'smt') {
                document.getElementById('order-type').value = 'smt';
                document.getElementById('smt-required').checked = true;
            }
        }
    });
}

// Обновление UI авторизации
function updateAuthUI(isLoggedIn) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (isLoggedIn && currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            document.getElementById('user-name').textContent = currentUser.company_name || currentUser.email.split('@')[0];
            document.getElementById('user-role').textContent = currentUser.role;
            document.getElementById('avatar-text').textContent = currentUser.company_name?.[0] || currentUser.email[0].toUpperCase();
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Выход из системы
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    authToken = null;
    currentUser = null;
    updateAuthUI(false);
    location.reload();
}

// Обновление токена
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            authToken = data.access_token;
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    
    return false;
}

// Глобальные обработчики событий
document.addEventListener('click', (e) => {
    // Закрытие модальных окон при клике вне их
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
    
    // Закрытие выпадающих меню
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);