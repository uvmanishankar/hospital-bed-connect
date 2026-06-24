// Tiny mock auth store using localStorage; UI-only.
import { useEffect, useState } from "react";

const KEY = "hc_auth_v1";

export interface MockUser {
  name: string;
  email: string;
  role: string;
}

export const defaultUser: MockUser = {
  name: "Dr. Priya Sharma",
  email: "priya.sharma@hospitalcare.io",
  role: "Ward Manager",
};

export function login(username: string) {
  if (typeof window === "undefined") return;
  const u = { ...defaultUser, email: username || defaultUser.email };
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function getUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getUser());
    setReady(true);
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { user, ready, refresh: () => setUser(getUser()) };
}
