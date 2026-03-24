import { apiGet, apiPost } from './client';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  avatarIndex: number;
}

interface AuthResponse {
  user: AuthUser;
}

export async function register(email: string, username: string, password: string) {
  return apiPost<AuthResponse>('/api/auth/register', { email, username, password });
}

export async function login(email: string, password: string) {
  return apiPost<AuthResponse>('/api/auth/login', { email, password });
}

export async function logout() {
  return apiPost('/api/auth/logout', {});
}

export async function getMe() {
  return apiGet<AuthResponse>('/api/auth/me');
}
