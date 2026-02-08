import api from "./api";

const authService = {
  async register(data) {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // всегда токены или ошибка
  },

  // ✅ verify/resend теперь для регистрации
  async verifyRegisterCode(challengeId, code) {
    const res = await api.post("/auth/register/verify", {
      challenge_id: challengeId,
      code,
    });
    return res.data;
  },

  async resendRegisterCode(challengeId) {
    const res = await api.post("/auth/register/resend", {
      challenge_id: challengeId,
    });
    return res.data;
  },

  async refresh(refreshToken) {
    const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return res.data;
  },

  async logout(refreshToken) {
    const res = await api.post("/auth/logout", { refresh_token: refreshToken });
    return res.data;
  },
};

export { authService };
export default authService;
