import { create } from 'zustand';
import { loginRequest, logoutRequest, validateSession } from '../services/authApi';

const STORAGE_KEY = 'roster-admin-token';

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  token: string | null;
  expiresAt: string | null;
  status: AuthStatus;
  error?: string;
  initialize: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  markUnauthorized: () => void;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || null;
  } catch (error) {
    console.warn('Session storage unavailable', error);
    return null;
  }
};

const storeToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Session storage unavailable', error);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  expiresAt: null,
  status: 'idle',
  error: undefined,
  initialize: async () => {
    if (get().status === 'checking') {
      return;
    }
    const storedToken = getStoredToken();
    if (!storedToken) {
      set({ token: null, expiresAt: null, status: 'unauthenticated' });
      return;
    }
    set({ status: 'checking', error: undefined });
    try {
      const session = await validateSession(storedToken);
      set({
        token: session.token,
        expiresAt: session.expiresAt,
        status: 'authenticated',
        error: undefined,
      });
      storeToken(session.token);
    } catch (error) {
      console.warn('Session validation failed', error);
      storeToken(null);
      set({ token: null, expiresAt: null, status: 'unauthenticated', error: undefined });
    }
  },
  login: async (password: string) => {
    set({ status: 'checking', error: undefined });
    try {
      const session = await loginRequest(password);
      storeToken(session.token);
      set({
        token: session.token,
        expiresAt: session.expiresAt,
        status: 'authenticated',
        error: undefined,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login fehlgeschlagen';
      set({ status: 'unauthenticated', error: message, token: null, expiresAt: null });
      storeToken(null);
      return false;
    }
  },
  logout: async () => {
    const token = get().token;
    storeToken(null);
    set({ token: null, expiresAt: null, status: 'unauthenticated', error: undefined });
    if (token) {
      try {
        await logoutRequest(token);
      } catch (error) {
        console.warn('Logout failed', error);
      }
    }
  },
  clearError: () => set({ error: undefined }),
  markUnauthorized: () => {
    storeToken(null);
    set({ token: null, expiresAt: null, status: 'unauthenticated', error: 'Sitzung abgelaufen. Bitte erneut anmelden.' });
  },
}));
