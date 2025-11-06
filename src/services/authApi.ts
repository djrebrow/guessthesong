import { AuthSession } from '../types';

const AUTH_BASE = '/api/auth';

const buildAuthHeaders = (token?: string): HeadersInit => {
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const loginRequest = async (password: string): Promise<AuthSession> => {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Login fehlgeschlagen';
    if (text) {
      try {
        const payload = JSON.parse(text) as { message?: string };
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // ignore parsing errors and fall back to raw text
      }
    }
    throw new Error(message);
  }
  return (await response.json()) as AuthSession;
};

export const validateSession = async (token: string): Promise<AuthSession> => {
  const response = await fetch(`${AUTH_BASE}/session`, {
    headers: buildAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Session ungültig');
  }
  return (await response.json()) as AuthSession;
};

export const logoutRequest = async (token: string): Promise<void> => {
  await fetch(`${AUTH_BASE}/logout`, {
    method: 'POST',
    headers: buildAuthHeaders(token),
  });
};
