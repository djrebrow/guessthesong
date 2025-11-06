import express from 'express';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { createInitialRoster, DEFAULT_SETTINGS } from '../src/lib/initialData';
import { PersistedRosterPayload } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'roster.json');
const PORT = Number(process.env.PORT) || 3000;

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

app.get('/api/roster', async (_req, res) => {
  try {
    const roster = await ensureInitialData();
    res.json(roster);
  } catch (error) {
    console.error('Failed to read roster', error);
    res.status(500).json({ message: 'Konnte Dienstplan nicht lesen.' });
  }
});

app.put('/api/roster', async (req, res) => {
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
