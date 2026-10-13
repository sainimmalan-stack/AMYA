import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "amya_admin_token";

function setAuthHeader(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null); // null=checking, false=no, obj=yes

  const check = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setAdmin(data);
    } catch {
      setAdmin(false);
    }
  };

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setAuthHeader(t);
    check();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthHeader(data.token);
    }
    setAdmin(data);
    return data;
  };

  const setupAdmin = async (name, email, password) => {
    const { data } = await api.post("/auth/setup", { name, email, password });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthHeader(data.token);
    }
    setAdmin(data);
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    setAuthHeader(null);
    setAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ admin, login, setupAdmin, logout, check }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
