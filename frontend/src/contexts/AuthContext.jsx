import React, { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingChallenge, setPendingChallenge] = useState(null); // {challengeId, expiresAt}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const userData = localStorage.getItem("user");

    // 1) если есть токен и user — просто поднимем user (интерцептор сам обновит токен на 401)
    if (token && userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
      return;
    }

    // 2) если токена нет, но есть refresh + user — попробуем refresh
    if (!token && refreshToken && userData) {
      try {
        const data = await authService.refresh(refreshToken); // {access_token, ...}
        if (data?.access_token) {
          localStorage.setItem("token", data.access_token);
          setUser(JSON.parse(userData));
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    setLoading(false);
  };

  // шаг 1 логина: пароль
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);

      // OTP включен -> бек вернёт mfa_required + challenge_id
      if (data?.mfa_required) {
        const payload = {
          challengeId: data.challenge_id,
          expiresAt: data.expires_at,
        };
        setPendingChallenge(payload);

        // на всякий случай сохраним, чтобы пережить refresh страницы
        localStorage.setItem("pending_challenge_id", payload.challengeId);

        return { success: false, mfaRequired: true, ...payload };
      }

      // OTP выключен -> обычный логин
      const { user: userData, access_token, refresh_token } = data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setPendingChallenge(null);
      localStorage.removeItem("pending_challenge_id");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  // шаг 2 логина: код
  const verifyLoginCode = async (challengeId, code) => {
    try {
      const data = await authService.verifyLoginCode(challengeId, code);
      const { user: userData, access_token, refresh_token } = data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setPendingChallenge(null);
      localStorage.removeItem("pending_challenge_id");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Invalid code",
      };
    }
  };

  const resendLoginCode = async (challengeId) => {
    try {
      await authService.resendCode(challengeId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Resend failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // ignore
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("pending_challenge_id");
    setPendingChallenge(null);
    setUser(null);
  };
  // В вашем AuthContext добавьте:
  const updateUser = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
    // Сохранить в localStorage, если нужно
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        pendingChallenge,
        login,
        verifyLoginCode,
        resendLoginCode,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
