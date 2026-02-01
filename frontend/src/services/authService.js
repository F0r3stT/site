import api from "./api";

const authService = {
  async register(data) {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  // шаг 1: логин (может вернуть токены, а может mfa_required)
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // важно: axios -> .data
  },

  // шаг 2: проверить код
  async verifyLoginCode(challengeId, code) {
    const res = await api.post("/auth/login/verify", {
      challenge_id: challengeId,
      code,
    });
    return res.data;
  },

  async resendCode(challengeId) {
    const res = await api.post("/auth/login/resend", {
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
