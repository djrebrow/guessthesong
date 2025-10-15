import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import produce from 'immer';
import { parseISO, startOfISOWeek } from 'date-fns';
import {
  DAY_ASSIGNMENTS,
  EMPLOYEES as INITIAL_EMPLOYEES,
  INITIAL_ASSIGNMENTS,
  INITIAL_START_MONDAY_ISO,
} from '../lib/constants';
import {
  DayAssignment,
  Employee,
  FilterState,
  HistoryState,
  HolidayLock,
  PublicHoliday,
  RosterCell,
  RosterState,
  SettingsState,
  ToastMessage,
} from '../types';
import { buildWeeks, calendarBaseFromWeeks, collectWeekYears, isoString } from '../utils/calendar';
import { getPublicHolidaysForYears } from '../utils/holidays';

export interface RosterStore extends RosterState {
  toasts: ToastMessage[];
  initialize: () => void;
  setCell: (employeeId: string, weekId: string, dayIndex: number, value: DayAssignment | null) => void;
  bulkSetCells: (updates: { employeeId: string; weekId: string; dayIndex: number; value: DayAssignment | null }[]) => void;
  clearCell: (employeeId: string, weekId: string, dayIndex: number) => void;
  setSettings: (settings: Partial<SettingsState>) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  undo: () => void;
  redo: () => void;
  resetHistory: () => void;
  replaceAllCells: (cells: RosterCell[]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  addEmployee: (name: string) => void;
  updateEmployeeName: (id: string, name: string) => void;
  removeEmployee: (id: string) => void;
  reorderEmployees: (sourceIndex: number, targetIndex: number) => void;
  updateCalendarBase: (
    startMondayISO: string,
    options: { clearAssignments: boolean; shiftRelatively: boolean },
  ) => void;
}

const HISTORY_LIMIT = 50;
const DEFAULT_WEEKS = 6;

const createHistory = (): HistoryState => ({ past: [], future: [] });

const snapshotCells = (cells: RosterCell[]): RosterCell[] => cells.map((cell) => ({ ...cell }));

const buildInitialWeeks = () => {
  const startMonday = parseISO(INITIAL_START_MONDAY_ISO);
  return buildWeeks(startMonday, DEFAULT_WEEKS);
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ensureUniqueId = (existing: Employee[], name: string): string => {
  const base = slugify(name) || `employee-${Date.now()}`;
  let candidate = base;
  let counter = 1;
  while (existing.some((emp) => emp.id === candidate)) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
};

const createSeedCells = (employees: Employee[], weeks: RosterState['weeks']): RosterCell[] => {
  const cells: RosterCell[] = [];
  employees.forEach((employee) => {
    weeks.forEach((week) => {
      week.days.forEach((_, index) => {
        const key = `${employee.id}_${week.id}_${index}`;
        const value = INITIAL_ASSIGNMENTS[key] ?? null;
        cells.push({ employeeId: employee.id, weekId: week.id, dayIndex: index, value });
      });
    });
  });
  return cells;
};

const computeHolidays = (settings: SettingsState, weeks: RosterState['weeks']): PublicHoliday[] => {
  if (!weeks.length) return [];
  const years = collectWeekYears(weeks);
  return getPublicHolidaysForYears(settings.bundesland, years);
};

type RosterStoreDraft = RosterStore;

const applyHolidayLocks = (state: RosterStoreDraft): void => {
  state.holidayLocks = {};
  if (!state.settings.autoHolidayMarking) {
    return;
  }
  const relevant = new Map(
    state.holidays
      .filter((holiday) => holiday.bundesland === state.settings.bundesland)
      .map((holiday) => [holiday.date, holiday]),
  );
  state.weeks.forEach((week) => {
    week.days.forEach((day, dayIndex) => {
      const holiday = relevant.get(day.date);
      if (!holiday) return;
      const key = `${week.id}:${dayIndex}`;
      const lock: HolidayLock = { name: holiday.name, date: day.date };
      state.holidayLocks[key] = lock;
      state.employees.forEach((employee) => {
        const existing = state.cells.find(
          (cell) =>
            cell.employeeId === employee.id && cell.weekId === week.id && cell.dayIndex === dayIndex,
        );
        if (existing) {
          existing.value = 'Feiertag';
        } else {
          state.cells.push({ employeeId: employee.id, weekId: week.id, dayIndex, value: 'Feiertag' });
        }
      });
    });
  });
};

const withHistorySnapshot = (state: RosterStoreDraft) => {
  const snapshot = snapshotCells(state.cells);
  state.history.past.push(snapshot);
  if (state.history.past.length > HISTORY_LIMIT) {
    state.history.past.shift();
  }
  state.history.future = [];
};

const baseSettings: SettingsState = {
  highContrast: false,
  fontScale: 1,
  dateFormat: 'D.M.YYYY',
  autoHolidayMarking: true,
  bundesland: 'NI',
};

const baseFilters: FilterState = {
  employeeQuery: '',
  assignment: 'Alle',
};

export const useRosterStore = create<RosterStore>()(
  persist(
    (set, get) => ({
      employees: INITIAL_EMPLOYEES,
      weeks: [],
      cells: [],
      initialized: false,
      settings: baseSettings,
      filters: baseFilters,
      history: createHistory(),
      calendarBase: { startMondayISO: INITIAL_START_MONDAY_ISO },
      holidays: [],
      holidayLocks: {},
      toasts: [],
      initialize: () => {
        set(
          produce<RosterStore>((state) => {
            if (state.initialized) {
              if (!state.calendarBase.startMondayISO && state.weeks.length) {
                state.calendarBase = calendarBaseFromWeeks(state.weeks);
              }
              state.holidays = computeHolidays(state.settings, state.weeks);
              applyHolidayLocks(state);
              return;
            }
            const weeks = state.weeks.length ? state.weeks : buildInitialWeeks();
            state.weeks = weeks;
            state.calendarBase = { startMondayISO: weeks[0]?.days[0]?.date ?? INITIAL_START_MONDAY_ISO };
            state.employees = state.employees.length ? state.employees : INITIAL_EMPLOYEES;
            state.cells = state.cells.length ? state.cells : createSeedCells(state.employees, weeks);
            state.holidays = computeHolidays(state.settings, weeks);
            applyHolidayLocks(state);
            state.initialized = true;
            state.history = createHistory();
          }),
        );
      },
      setCell: (employeeId, weekId, dayIndex, value) => {
        set(
          produce<RosterStore>((state) => {
            const lockKey = `${weekId}:${dayIndex}`;
            if (state.settings.autoHolidayMarking && state.holidayLocks[lockKey]) {
              return;
            }
            withHistorySnapshot(state);
            const target = state.cells.find(
              (cell) =>
                cell.employeeId === employeeId && cell.weekId === weekId && cell.dayIndex === dayIndex,
            );
            if (target) {
              target.value = value;
            } else {
              state.cells.push({ employeeId, weekId, dayIndex, value });
            }
          }),
        );
      },
      bulkSetCells: (updates) => {
        if (!updates.length) return;
        set(
          produce<RosterStore>((state) => {
            withHistorySnapshot(state);
            updates.forEach(({ employeeId, weekId, dayIndex, value }) => {
              const lockKey = `${weekId}:${dayIndex}`;
              if (state.settings.autoHolidayMarking && state.holidayLocks[lockKey]) {
                return;
              }
              const target = state.cells.find(
                (cell) =>
                  cell.employeeId === employeeId &&
                  cell.weekId === weekId &&
                  cell.dayIndex === dayIndex,
              );
              if (target) {
                target.value = value;
              } else {
                state.cells.push({ employeeId, weekId, dayIndex, value });
              }
            });
          }),
        );
      },
      clearCell: (employeeId, weekId, dayIndex) => {
        set(
          produce<RosterStore>((state) => {
            const lockKey = `${weekId}:${dayIndex}`;
            if (state.settings.autoHolidayMarking && state.holidayLocks[lockKey]) {
              return;
            }
            withHistorySnapshot(state);
            const target = state.cells.find(
              (cell) =>
                cell.employeeId === employeeId && cell.weekId === weekId && cell.dayIndex === dayIndex,
            );
            if (target) {
              target.value = null;
            }
          }),
        );
      },
      setSettings: (settings) => {
        set(
          produce<RosterStore>((state) => {
            const prevBundesland = state.settings.bundesland;
            const prevAuto = state.settings.autoHolidayMarking;
            state.settings = { ...state.settings, ...settings };
            if (
              settings.dateFormat ||
              settings.fontScale ||
              settings.highContrast !== undefined
            ) {
              // no-op for history
            }
            const requiresHolidayRefresh =
              (settings.autoHolidayMarking !== undefined && settings.autoHolidayMarking !== prevAuto) ||
              (settings.bundesland && settings.bundesland !== prevBundesland);
            if (requiresHolidayRefresh) {
              state.holidays = computeHolidays(state.settings, state.weeks);
              applyHolidayLocks(state);
            } else if (settings.autoHolidayMarking === false) {
              state.holidayLocks = {};
            }
          }),
        );
      },
      setFilters: (filters) => {
        set(
          produce<RosterStore>((state) => {
            state.filters = { ...state.filters, ...filters };
          }),
        );
      },
      undo: () => {
        const { history } = get();
        if (!history.past.length) return;
        set(
          produce<RosterStore>((state) => {
            const previous = state.history.past.pop();
            if (!previous) return;
            const current = snapshotCells(state.cells);
            state.history.future.unshift(current);
            if (state.history.future.length > HISTORY_LIMIT) {
              state.history.future.pop();
            }
            state.cells = snapshotCells(previous);
            applyHolidayLocks(state);
          }),
        );
      },
      redo: () => {
        const { history } = get();
        if (!history.future.length) return;
        set(
          produce<RosterStore>((state) => {
            const next = state.history.future.shift();
            if (!next) return;
            const current = snapshotCells(state.cells);
            state.history.past.push(current);
            if (state.history.past.length > HISTORY_LIMIT) {
              state.history.past.shift();
            }
            state.cells = snapshotCells(next);
            applyHolidayLocks(state);
          }),
        );
      },
      resetHistory: () => {
        set(
          produce<RosterStore>((state) => {
            state.history = createHistory();
          }),
        );
      },
      replaceAllCells: (cells) => {
        set(
          produce<RosterStore>((state) => {
            withHistorySnapshot(state);
            state.cells = snapshotCells(cells);
            applyHolidayLocks(state);
          }),
        );
      },
      addToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set(
          produce<RosterStore>((state) => {
            state.toasts.push({ id, ...toast });
          }),
        );
      },
      removeToast: (id) => {
        set(
          produce<RosterStore>((state) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== id);
          }),
        );
      },
      addEmployee: (name) => {
        set(
          produce<RosterStore>((state) => {
            const id = ensureUniqueId(state.employees, name);
            const employee: Employee = { id, name };
            state.employees.push(employee);
            state.weeks.forEach((week) => {
              week.days.forEach((_, index) => {
                state.cells.push({ employeeId: id, weekId: week.id, dayIndex: index, value: null });
              });
            });
            applyHolidayLocks(state);
          }),
        );
      },
      updateEmployeeName: (id, name) => {
        set(
          produce<RosterStore>((state) => {
            const employee = state.employees.find((item) => item.id === id);
            if (employee) {
              employee.name = name;
            }
          }),
        );
      },
      removeEmployee: (id) => {
        set(
          produce<RosterStore>((state) => {
            state.employees = state.employees.filter((employee) => employee.id !== id);
            state.cells = state.cells.filter((cell) => cell.employeeId !== id);
            applyHolidayLocks(state);
          }),
        );
      },
      reorderEmployees: (sourceIndex, targetIndex) => {
        set(
          produce<RosterStore>((state) => {
            if (sourceIndex < 0 || sourceIndex >= state.employees.length) return;
            if (targetIndex < 0 || targetIndex >= state.employees.length) return;
            if (sourceIndex === targetIndex) return;
            const [moved] = state.employees.splice(sourceIndex, 1);
            if (!moved) return;
            state.employees.splice(targetIndex, 0, moved);
          }),
        );
      },
      updateCalendarBase: (startMondayISO, options) => {
        set(
          produce<RosterStore>((state) => {
            const newStart = isoString(startOfISOWeek(parseISO(startMondayISO)));
            const oldWeeks = state.weeks;
            const oldCells = snapshotCells(state.cells);
            const weeks = buildWeeks(parseISO(newStart), oldWeeks.length || DEFAULT_WEEKS);
            state.weeks = weeks;
            state.calendarBase = { startMondayISO: newStart };
            const newCells: RosterCell[] = [];
            const dateValueMap = new Map<string, DayAssignment | null>();
            if (!options.clearAssignments) {
              oldWeeks.forEach((week) => {
                week.days.forEach((day, dayIndex) => {
                  state.employees.forEach((employee) => {
                    const cell = oldCells.find(
                      (item) =>
                        item.employeeId === employee.id &&
                        item.weekId === week.id &&
                        item.dayIndex === dayIndex,
                    );
                    if (!cell || cell.value === null) return;
                    dateValueMap.set(`${employee.id}-${day.date}`, cell.value);
                  });
                });
              });
            }
            state.employees.forEach((employee) => {
              weeks.forEach((week, weekIndex) => {
                week.days.forEach((day, dayIndex) => {
                  let value: DayAssignment | null = null;
                  if (!options.clearAssignments) {
                    if (options.shiftRelatively) {
                      const oldWeek = oldWeeks[weekIndex];
                      if (oldWeek) {
                        const match = oldCells.find(
                          (cell) =>
                            cell.employeeId === employee.id &&
                            cell.weekId === oldWeek.id &&
                            cell.dayIndex === dayIndex,
                        );
                        value = match?.value ?? null;
                      }
                    } else {
                      value = dateValueMap.get(`${employee.id}-${day.date}`) ?? null;
                    }
                  }
                  newCells.push({ employeeId: employee.id, weekId: week.id, dayIndex, value });
                });
              });
            });
            state.cells = newCells;
            state.history = createHistory();
            state.holidays = computeHolidays(state.settings, weeks);
            applyHolidayLocks(state);
          }),
        );
      },
    }),
    {
      name: 'roster-store',
      partialize: (state) => ({
        employees: state.employees,
        weeks: state.weeks,
        cells: state.cells,
        settings: state.settings,
        filters: state.filters,
        initialized: state.initialized,
        calendarBase: state.calendarBase,
      }),
    },
  ),
);

export const findCellValue = (
  cells: RosterCell[],
  employeeId: string,
  weekId: string,
  dayIndex: number,
): DayAssignment | null => {
  const match = cells.find(
    (cell) => cell.employeeId === employeeId && cell.weekId === weekId && cell.dayIndex === dayIndex,
  );
  return match ? match.value : null;
};

export const getAssignmentColor = (assignment: DayAssignment | null, highContrast?: boolean): string => {
  if (!assignment) return highContrast ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-900';
  const palette: Record<DayAssignment, string> = highContrast
    ? {
        Früh: 'bg-roster-contrast text-white',
        Spät: 'bg-roster-contrastAccent text-black',
        Abwesend: 'bg-yellow-400 text-black',
        Feiertag: 'bg-yellow-500 text-black',
        Sonder: 'bg-purple-600 text-white',
        Connox: 'bg-amber-600 text-white',
        Schmalgang: 'bg-slate-600 text-white',
        Außenlager: 'bg-emerald-600 text-white',
        'Kleinteile/Konsi': 'bg-cyan-600 text-white',
      }
    : {
        Früh: 'bg-roster-early text-slate-900',
        Spät: 'bg-roster-late text-slate-900',
        Abwesend: 'bg-roster-absent text-slate-900',
        Feiertag: 'bg-roster-absent text-slate-900',
        Sonder: 'bg-roster-special text-slate-900',
        Connox: 'bg-roster-connox text-slate-900',
        Schmalgang: 'bg-roster-schmalgang text-slate-900',
        Außenlager: 'bg-roster-aussenlager text-slate-900',
        'Kleinteile/Konsi': 'bg-roster-kleinteile text-slate-900',
      };
  return palette[assignment] ?? 'bg-white text-slate-900';
};

export const assignmentShortcutMap: Record<string, DayAssignment | null> = {
  f: 'Früh',
  s: 'Spät',
  a: 'Abwesend',
  h: 'Feiertag',
  '-': null,
};

export const isSpecialAssignment = (assignment: DayAssignment | null): boolean => {
  if (!assignment) return false;
  return !['Früh', 'Spät', 'Abwesend', 'Feiertag'].includes(assignment);
};

export const assignmentGroups: Record<string, DayAssignment[]> = {
  standard: ['Früh', 'Spät'],
  absence: ['Abwesend', 'Feiertag'],
  special: ['Sonder', 'Connox', 'Schmalgang', 'Außenlager', 'Kleinteile/Konsi'],
};

export const assignmentOptions = DAY_ASSIGNMENTS.map((value) => ({
  id: value,
  label: value,
}));

