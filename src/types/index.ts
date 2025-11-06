export type DayAssignment =
  | 'Früh'
  | 'Spät'
  | 'Abwesend'
  | 'Feiertag'
  | 'Sonder'
  | 'Connox'
  | 'Schmalgang'
  | 'Außenlager'
  | 'Kleinteile/Konsi';

export interface Employee {
  id: string;
  name: string;
}

export type WeekdayLabel = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';

export interface WeekDay {
  label: WeekdayLabel;
  date: string; // ISO date
}

export interface Week {
  id: string;
  kw: number;
  start: string;
  end: string;
  days: WeekDay[];
}

export interface RosterCell {
  employeeId: string;
  weekId: string;
  dayIndex: number;
  value: DayAssignment | null;
}

export interface SettingsState {
  highContrast: boolean;
  fontScale: number;
  dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY';
  autoHolidayMarking: boolean;
  bundesland: 'NI';
}

export interface FilterState {
  employeeQuery: string;
  assignment: DayAssignment | 'Alle';
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface HistoryState {
  past: RosterCell[][];
  future: RosterCell[][];
}

export interface CalendarBase {
  startMondayISO: string;
}

export interface PublicHoliday {
  date: string;
  name: string;
  bundesland: 'NI';
}

export interface HolidayLock {
  name: string;
  date: string;
}

export interface RosterState {
  employees: Employee[];
  weeks: Week[];
  cells: RosterCell[];
  initialized: boolean;
  settings: SettingsState;
  filters: FilterState;
  history: HistoryState;
  calendarBase: CalendarBase;
  holidays: PublicHoliday[];
  holidayLocks: Record<string, HolidayLock>;
}

export interface PersistedRosterPayload {
  employees: Employee[];
  weeks: Week[];
  cells: RosterCell[];
  settings: SettingsState;
  calendarBase: CalendarBase;
  updatedAt?: string;
}

export interface SelectedCell {
  employeeId: string;
  weekId: string;
  dayIndex: number;
}

export type CopyScope = 'cell' | 'row' | 'week';

export interface CopyBuffer {
  scope: CopyScope;
  weekId: string;
  employeeId?: string;
  cells: RosterCell[];
}

export interface AuthSession {
  token: string;
  expiresAt: string;
}
