import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE } from "./api";

const STORAGE_KEY = "sanoro_auth";
const UNAUTHORIZED_EVENT = "sanoro-unauthorized";

// Reads the middle part of the token so we can check when it expires.
function decodePayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const payload = decodePayload(data.token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Send the token with every request to our own API (and nowhere else).
axios.interceptors.request.use((config) => {
  const stored = readStoredAuth();
  if (stored && config.url && config.url.startsWith(API_BASE)) {
    config.headers.Authorization = `Bearer ${stored.token}`;
  }
  return config;
});

// If the API says "not logged in" (for example the token expired), log out.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes("/Auth/")) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export function roleHome(roles) {
  if (roles.includes("PlatformAdmin")) return "/platform";
  if (roles.includes("SurgeryAdmin")) return "/admin";
  return "/patient";
}

export function roleLabel(roles) {
  if (roles.includes("PlatformAdmin")) return "Platform admin";
  if (roles.includes("SurgeryAdmin")) return "My surgery";
  return "My appointments";
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredAuth);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const saveUser = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const response = await axios.post(`${API_BASE}/Auth/login`, { email, password });
      return saveUser(response.data);
    },
    [saveUser]
  );

  const register = useCallback(
    async (details) => {
      const response = await axios.post(`${API_BASE}/Auth/register`, details);
      return saveUser(response.data);
    },
    [saveUser]
  );
    const registerSurgery = useCallback(
    async (details) => {
      const response = await axios.post(`${API_BASE}/Auth/register-surgery`, details);
      return saveUser(response.data);
    },
    [saveUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

   const value = useMemo(
    () => ({ user, login, register, registerSurgery, logout }),
    [user, login, register, registerSurgery, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}