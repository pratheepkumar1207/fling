import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("fling_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const persist = useCallback((token, u) => {
    localStorage.setItem("fling_jwt", token);
    localStorage.setItem("fling_user", JSON.stringify(u));
    setUser(u);
  }, []);

  // POST /auth/firebase — exchange a Firebase ID token for our own JWT + user record
  const loginWithFirebaseToken = useCallback(async (idToken) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/firebase", { idToken });
      persist(data.token, data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // POST /auth/dev-login — TEST-ONLY bypass, see auth.js for the gating rules.
  const loginWithDevPhone = useCallback(async (phone) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/dev-login", { phone });
      persist(data.token, data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const updateProfile = useCallback(async (name) => {
    const { data } = await api.patch("/auth/me", { name });
    setUser((u) => {
      const next = { ...u, name: data.name };
      localStorage.setItem("fling_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    const { data } = await api.get("/wallet/balance");
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, coinBalance: data.coinBalance };
      localStorage.setItem("fling_user", JSON.stringify(next));
      return next;
    });
    return data.coinBalance;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fling_jwt");
    localStorage.removeItem("fling_user");
    setUser(null);
  }, []);

  // Keep balance fresh on load
  useEffect(() => {
    if (user) refreshBalance().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithFirebaseToken, loginWithDevPhone, updateProfile, refreshBalance, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
