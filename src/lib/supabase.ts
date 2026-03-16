import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPA_PUBLIC;
const supabaseKey = import.meta.env.VITE_SUPA_API;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Supabase] Missing VITE_SUPA_PUBLIC or VITE_SUPA_API in .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// ── Admin Session (localStorage) ──────────────────────────
const ADMIN_KEY = "pw_admin_session";

export interface AdminSession {
  id: number;
  email: string;
  name: string;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(admin: AdminSession): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_KEY);
}


