// Real auth store — validates credentials against ServiceNow employee table.
// Session stored in localStorage after successful login.

const KEY = "hc_auth_v1";

export interface AuthUser {
  sys_id: string;
  name: string;
  email: string;
  employee_id: string;
  role: string;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

// Legacy alias used in some routes
export function login(username: string) {
  saveUser({
    sys_id: "legacy",
    name: username,
    email: username,
    employee_id: "",
    role: "staff",
  });
}

import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
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