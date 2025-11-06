import { PersistedRosterPayload } from '../types';

const API_BASE = '/api/roster';

class UnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
  }
}

export const fetchRoster = async (): Promise<PersistedRosterPayload | null> => {
  const response = await fetch(API_BASE);
  if (response.status === 404 || response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to load roster: ${response.status}`);
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  const data = JSON.parse(text) as PersistedRosterPayload;
  return data;
};

export const saveRoster = async (payload: PersistedRosterPayload, token?: string | null): Promise<void> => {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (response.status === 401) {
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to save roster: ${response.status}`);
  }
};

export { UnauthorizedError };
