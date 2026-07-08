"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

type AdminContextValue = {
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_token");
    if (stored) {
      setToken(stored);
      verifyToken(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyToken(t: string) {
    try {
      const res = await fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(password: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        setToken(data.token);
        sessionStorage.setItem("admin_token", data.token);
        setAuthenticated(true);
        return true;
      }
      toast.error(data.error || "Login failed");
      return false;
    } catch (e) {
      toast.error("Network error");
      return false;
    }
  }

  function logout() {
    setToken(null);
    setAuthenticated(false);
    sessionStorage.removeItem("admin_token");
  }

  async function adminFetch(url: string, opts: RequestInit = {}): Promise<Response> {
    if (!token) throw new Error("No admin token");
    const headers = new Headers(opts.headers);
    headers.set("Authorization", `Bearer ${token}`);
    
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
      logout();
      throw new Error("Session expired");
    }
    return res;
  }

  return (
    <AdminContext.Provider value={{ token, authenticated, loading, login, logout, adminFetch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
}
