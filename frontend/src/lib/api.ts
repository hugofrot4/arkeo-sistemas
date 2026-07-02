const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "arkeo_admin_token";

export interface HeroContent {
  badge: string;
  h1Line1: string;
  h1Accent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }
  return res.json();
}

export function getHero() {
  return request<HeroContent>("/api/hero");
}

export function updateHero(data: HeroContent) {
  return request<HeroContent>("/api/hero", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function login(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<AuthUser>("/api/auth/me");
}
