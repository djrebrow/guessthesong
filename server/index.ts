import express from 'express';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createInitialRoster, DEFAULT_SETTINGS } from '../src/lib/initialData';
import { PersistedRosterPayload } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'roster.json');
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const SESSION_TTL = Number(process.env.ADMIN_SESSION_TTL || 1000 * 60 * 60 * 8);

interface ActiveSession {
  expiresAt: number;
}

const activeSessions = new Map<string, ActiveSession>();

const createSessionToken = (): string => crypto.randomUUID();

const pruneExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
};

const extractToken = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const headerToken = req.headers['x-admin-token'];
  if (typeof headerToken === 'string') {
    return headerToken;
  }
  if (Array.isArray(headerToken)) {
    return headerToken[0];
  }
  return null;
};

const ensureAuthenticated: express.RequestHandler = (req, res, next) => {
  pruneExpiredSessions();
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Anmeldung erforderlich.' });
  }
  const session = activeSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ message: 'Sitzung abgelaufen.' });
  }
  next();
};

const readRoster = async (): Promise<PersistedRosterPayload | null> => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content) as PersistedRosterPayload;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const writeRoster = async (payload: PersistedRosterPayload) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
};

const sanitizeRosterPayload = (payload: Partial<PersistedRosterPayload>): PersistedRosterPayload => {
  const seed = createInitialRoster();
  const employees = Array.isArray(payload.employees) ? payload.employees : seed.employees;
  const weeks = Array.isArray(payload.weeks) ? payload.weeks : seed.weeks;
  const cells = Array.isArray(payload.cells) ? payload.cells : seed.cells;
  const settings = payload.settings ? { ...DEFAULT_SETTINGS, ...payload.settings } : seed.settings;
  const calendarBase = payload.calendarBase?.startMondayISO
    ? { startMondayISO: payload.calendarBase.startMondayISO }
    : seed.calendarBase;
  return {
    employees,
    weeks,
    cells,
    settings,
    calendarBase,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
  };
};

const ensureInitialData = async (): Promise<PersistedRosterPayload> => {
  const existing = await readRoster();
  if (existing) {
    const sanitized = sanitizeRosterPayload(existing);
    await writeRoster(sanitized);
    return sanitized;
  }
  const seed = { ...createInitialRoster(), updatedAt: new Date().toISOString() };
  await writeRoster(seed);
  return seed;
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password.length) {
    return res.status(400).json({ message: 'Passwort erforderlich.' });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Ungültiges Passwort.' });
  }
  pruneExpiredSessions();
  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_TTL;
  activeSessions.set(token, { expiresAt });
  return res.json({ token, expiresAt: new Date(expiresAt).toISOString() });
});

app.get('/api/auth/session', (req, res) => {
  pruneExpiredSessions();
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Nicht angemeldet.' });
  }
  const session = activeSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return res.status(401).json({ message: 'Sitzung abgelaufen.' });
  }
  return res.json({ token, expiresAt: new Date(session.expiresAt).toISOString() });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  res.status(204).send();
});

app.get('/api/roster', async (_req, res) => {
  try {
    const roster = await ensureInitialData();
    res.json(roster);
  } catch (error) {
    console.error('Failed to read roster', error);
    res.status(500).json({ message: 'Konnte Dienstplan nicht lesen.' });
  }
});

app.put('/api/roster', ensureAuthenticated, async (req, res) => {
  try {
    const sanitized = sanitizeRosterPayload(req.body ?? {});
    await writeRoster(sanitized);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to save roster', error);
    res.status(500).json({ message: 'Konnte Dienstplan nicht speichern.' });
  }
});

app.listen(PORT, () => {
  console.log(`Roster API listening on port ${PORT}`);
});
