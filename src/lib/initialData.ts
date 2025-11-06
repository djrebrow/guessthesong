import { parseISO } from 'date-fns';
import {
  DAY_ASSIGNMENTS,
  EMPLOYEES as EMPLOYEE_SEED,
  INITIAL_ASSIGNMENTS,
  INITIAL_START_MONDAY_ISO,
} from './constants';
import {
  CalendarBase,
  DayAssignment,
  Employee,
  FilterState,
  RosterCell,
  SettingsState,
  Week,
  PersistedRosterPayload,
} from '../types';
import { buildWeeks } from '../utils/calendar';

export const DEFAULT_WEEK_COUNT = 6;

export const DEFAULT_SETTINGS: SettingsState = {
  highContrast: false,
  fontScale: 1,
  dateFormat: 'D.M.YYYY',
  autoHolidayMarking: true,
  bundesland: 'NI',
};

export const DEFAULT_FILTERS: FilterState = {
  employeeQuery: '',
  assignment: 'Alle',
};

export const getInitialEmployees = (): Employee[] =>
  EMPLOYEE_SEED.map((employee) => ({ ...employee }));

export const getInitialWeeks = (): Week[] => {
  const startMonday = parseISO(INITIAL_START_MONDAY_ISO);
  return buildWeeks(startMonday, DEFAULT_WEEK_COUNT);
};

export const createInitialCells = (
  employees: Employee[],
  weeks: Week[],
): RosterCell[] => {
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

export const createInitialCalendarBase = (): CalendarBase => ({
  startMondayISO: INITIAL_START_MONDAY_ISO,
});

export const createInitialRoster = (): PersistedRosterPayload => {
  const employees = getInitialEmployees();
  const weeks = getInitialWeeks();
  const cells = createInitialCells(employees, weeks);
  const calendarBase: CalendarBase = {
    startMondayISO: weeks[0]?.days[0]?.date ?? INITIAL_START_MONDAY_ISO,
  };
  return {
    employees,
    weeks,
    cells,
    settings: { ...DEFAULT_SETTINGS },
    calendarBase,
  };
};

export const assignmentOptions = DAY_ASSIGNMENTS.map((value) => ({
  id: value,
  label: value,
}));
