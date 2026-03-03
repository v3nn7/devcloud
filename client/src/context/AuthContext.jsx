import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const isAuthenticated = Boolean(user);

  const refreshMe = async () => {
    const accessToken = localStorage.getItem("dc_access_token");
    if (!accessToken) {
      setLoaded(true);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      localStorage.removeItem("dc_access_token");
      setUser(null);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = (tokens, userData) => {
    localStorage.setItem("dc_access_token", tokens.accessToken);
    localStorage.setItem("dc_refresh_token", tokens.refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("dc_access_token");
    localStorage.removeItem("dc_refresh_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loaded,
      refreshMe,
      login,
      logout
    }),
    [user, loaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
