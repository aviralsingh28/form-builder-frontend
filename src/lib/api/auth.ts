import { apiRequest, setAccessToken } from "./client";
import type { LoginResult } from "./types";

export async function login(email: string, password: string) {
  const data = await apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setAccessToken(data.access_token);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}) {
  const data = await apiRequest<LoginResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...payload, role: payload.role ?? "INDIVIDUAL" }),
    skipAuth: true,
  });
  setAccessToken(data.access_token);
  return data;
}

export function logoutLocal() {
  setAccessToken(null);
}
