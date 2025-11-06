import { create } from 'zustand';
import produce from 'immer';
import { parseISO, startOfISOWeek } from 'date-fns';
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
  PersistedRosterPayload,
} from '../types';
import { buildWeeks, calendarBaseFromWeeks, collectWeekYears, isoString } from '../utils/calendar';
import { getPublicHolidaysForYears } from '../utils/holidays';
import {
  createInitialCalendarBase,
  createInitialRoster,
  DEFAULT_FILTERS,
  DEFAULT_SETTINGS,
  DEFAULT_WEEK_COUNT,
} from '../lib/initialData';
import { fetchRoster, saveRoster } from '../services/rosterApi';

export interface RosterStore extends RosterState {
  toasts: ToastMessage[];
  initialize: () => Promise<void>;
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

const createHistory = (): HistoryState => ({ past: [], future: [] });

const snapshotCells = (cells: RosterCell[]): RosterCell[] => cells.map((cell) => ({ ...cell }));

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

const baseSettings: SettingsState = { ...DEFAULT_SETTINGS };
const baseFilters: FilterState = { ...DEFAULT_FILTERS };

export const useRosterStore = create<RosterStore>()((set, get) => {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const ensureErrorToast = (message: string) => {
    set(
      produce<RosterStore>((state) => {
        if (state.toasts.some((toast) => toast.type === 'error' && toast.message === message)) {
          return;
        }
        state.toasts.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'error',
          message,
        });
      }),
    );
  };

  const buildPersistPayload = (): PersistedRosterPayload => {
    const state = get();
    return {
      employees: state.employees.map((employee) => ({ ...employee })),
      weeks: state.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({ ...day })),
      })),
      cells: snapshotCells(state.cells),
      settings: { ...state.settings },
      calendarBase: { ...state.calendarBase },
      updatedAt: new Date().toISOString(),
    };
  };

  const persistToServer = async (payload: PersistedRosterPayload) => {
    try {
      await saveRoster(payload);
    } catch (error) {
      console.error('Failed to persist roster', error);
      ensureErrorToast('Speichern am Server fehlgeschlagen.');
    }
  };

  const schedulePersist = () => {
    if (!get().initialized) {
      return;
    }
    if (persistTimer) {
      clearTimeout(persistTimer);
    }
    persistTimer = setTimeout(() => {
      void persistToServer(buildPersistPayload());
    }, 200);
  };

  const applyInitialization = (payload: PersistedRosterPayload) => {
    set(
      produce<RosterStore>((state) => {
        state.employees = payload.employees.map((employee) => ({ ...employee }));
        state.weeks = payload.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({ ...day })),
        }));
        state.cells = payload.cells.map((cell) => ({ ...cell }));
        state.settings = { ...DEFAULT_SETTINGS, ...payload.settings };
        state.filters = { ...DEFAULT_FILTERS };
        state.calendarBase = payload.calendarBase?.startMondayISO
          ? { startMondayISO: payload.calendarBase.startMondayISO }
          : state.weeks.length
            ? calendarBaseFromWeeks(state.weeks)
            : createInitialCalendarBase();
        state.holidays = computeHolidays(state.settings, state.weeks);
        state.holidayLocks = {};
        applyHolidayLocks(state);
        state.history = createHistory();
        state.initialized = true;
      }),
    );
  };

  return {
    employees: [],
    weeks: [],
    cells: [],
    initialized: false,
    settings: { ...baseSettings },
    filters: { ...baseFilters },
    history: createHistory(),
    calendarBase: createInitialCalendarBase(),
    holidays: [],
    holidayLocks: {},
    toasts: [],
    initialize: async () => {
      if (get().initialized) {
        set(
          produce<RosterStore>((state) => {
            state.holidays = computeHolidays(state.settings, state.weeks);
            applyHolidayLocks(state);
          }),
        );
        return;
      }
      try {
        const payload = await fetchRoster();
        if (payload && payload.employees?.length) {
          applyInitialization(payload);
          return;
        }
        const fallback = createInitialRoster();
        applyInitialization({ ...fallback, updatedAt: new Date().toISOString() });
        void persistToServer(buildPersistPayload());
      } catch (error) {
        console.error('Failed to fetch roster', error);
        ensureErrorToast('Dienstplan konnte nicht vom Server geladen werden.');
        const fallback = createInitialRoster();
        applyInitialization({ ...fallback, updatedAt: new Date().toISOString() });
      }
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
      schedulePersist();
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
      schedulePersist();
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
      schedulePersist();
    },
    setSettings: (settings) => {
      set(
        produce<RosterStore>((state) => {
          const prevBundesland = state.settings.bundesland;
          const prevAuto = state.settings.autoHolidayMarking;
          state.settings = { ...state.settings, ...settings };
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
      schedulePersist();
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
      schedulePersist();
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
      schedulePersist();
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
      schedulePersist();
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
      schedulePersist();
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
      schedulePersist();
    },
    removeEmployee: (id) => {
      set(
        produce<RosterStore>((state) => {
          state.employees = state.employees.filter((employee) => employee.id !== id);
          state.cells = state.cells.filter((cell) => cell.employeeId !== id);
          applyHolidayLocks(state);
        }),
      );
      schedulePersist();
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
      schedulePersist();
    },
    updateCalendarBase: (startMondayISO, options) => {
      set(
        produce<RosterStore>((state) => {
          const newStart = isoString(startOfISOWeek(parseISO(startMondayISO)));
          const oldWeeks = state.weeks;
          const oldCells = snapshotCells(state.cells);
          const weeks = buildWeeks(parseISO(newStart), oldWeeks.length || DEFAULT_WEEK_COUNT);
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
      schedulePersist();
    },
  };
});

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

