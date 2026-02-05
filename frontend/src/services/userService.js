import api from './api';

export const userService = {
  // Получение данных профиля
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Обновление профиля
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Смена пароля
  changePassword: async (passwordData) => {
    const response = await api.post('/profile/change-password', passwordData);
    return response.data;
  },

  // Валидация пароля
  validatePassword: (password) => {
    const requirements = {
      length: password.length >= 8,
      letters: /[a-zA-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    let score = 0;
    if (requirements.length) score += 25;
    if (requirements.letters) score += 25;
    if (requirements.numbers) score += 25;
    if (requirements.special) score += 25;
    
    return {
      score,
      requirements,
      isValid: Object.values(requirements).every(req => req)
    };
  }
};

// Экспорт отдельных функций для удобства
export const { getProfile, updateProfile, changePassword, validatePassword } = userService;