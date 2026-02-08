import React, { createContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext();

function normalizeUser(u) {
  if (!u) return u;

  const next = { ...u };

  // snake_case -> camelCase
  if (next.first_name && !next.firstName) next.firstName = next.first_name;
  if (next.last_name && !next.lastName) next.lastName = next.last_name;
  if (next.company_name && !next.companyName) next.companyName = next.company_name;

  // camelCase -> snake_case (чтобы бэку и остальным частям было удобно)
  if (next.firstName && !next.first_name) next.first_name = next.firstName;
  if (next.lastName && !next.last_name) next.last_name = next.lastName;
  if (next.companyName && !next.company_name) next.company_name = next.companyName;

  return next;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingChallenge, setPendingChallenge] = useState(null); // оставлено на будущее
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
      const parsed = normalizeUser(JSON.parse(userData));
      setUser(parsed);
      localStorage.setItem("user", JSON.stringify(parsed));
      setLoading(false);
      return;
    }

    // 2) если токена нет, но есть refresh + user — попробуем refresh
    if (!token && refreshToken && userData) {
      try {
        const data = await authService.refresh(refreshToken); // {access_token, ...}
        if (data?.access_token) {
          localStorage.setItem("token", data.access_token);
          const parsed = normalizeUser(JSON.parse(userData));
          setUser(parsed);
          localStorage.setItem("user", JSON.stringify(parsed));
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    setLoading(false);
  };

  // ✅ Обновление user в контексте + localStorage (нужно для ProfileSettings)
  const updateUser = useCallback((patchOrFullUser) => {
     setUser((prev) => {
       const merged = normalizeUser({ ...(prev || {}), ...(patchOrFullUser || {}) });
       localStorage.setItem("user", JSON.stringify(merged));
       return merged;
     });
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);

      if (!data?.access_token) {
        return { success: false, error: data?.error || "Login failed" };
      }

      const normalized = normalizeUser(data.user);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(normalized));

      setUser(normalized);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || "Login failed" };
    }
  };

  const verifyRegisterCode = async (challengeId, code) => {
    try {
      const data = await authService.verifyRegisterCode(challengeId, code);

      const normalized = normalizeUser(data.user);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(normalized));

      localStorage.removeItem("pending_register_challenge_id");
      setUser(normalized);

      return { success: true };
    } catch {
      return { success: false, error: "Invalid or expired code" };
    }
  };

  const resendRegisterCode = async (challengeId) => {
    try {
      await authService.resendRegisterCode(challengeId);
      return { success: true };
    } catch {
      return { success: false, error: "Failed to resend" };
    }
  };

  const register = async (payload) => {
    try {
      const data = await authService.register(payload);

      if (data?.verify_required) {
        localStorage.setItem("pending_register_challenge_id", data.challenge_id);
        return { success: true, verifyRequired: true, challengeId: data.challenge_id };
      }

      return { success: true, verifyRequired: false };
    } catch {
      return { success: false, error: "Registration failed" };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        updateUser, // ✅ добавили
        login,
        register,
        verifyRegisterCode,
        resendRegisterCode,
        logout,
        pendingChallenge,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
