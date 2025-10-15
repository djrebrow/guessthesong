import { addDays, addWeeks, formatISO, getISOWeek, getISOWeekYear, parseISO, startOfISOWeek } from 'date-fns';
import { CalendarBase, Week, WeekdayLabel } from '../types';

const WEEKDAY_LABELS: WeekdayLabel[] = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

export const isoString = (date: Date): string => formatISO(date, { representation: 'date' });

export const fromISOWeek = (isoYear: number, isoWeek: number): Date => {
  if (isoWeek < 1 || isoWeek > 53) {
    throw new RangeError('ISO week must be between 1 and 53');
  }

  const fourthJanuaryUTC = new Date(Date.UTC(isoYear, 0, 4));
  const firstWeekStartLocal = startOfISOWeek(fourthJanuaryUTC);
  const firstWeekMondayUTC = new Date(
    Date.UTC(
      firstWeekStartLocal.getFullYear(),
      firstWeekStartLocal.getMonth(),
      firstWeekStartLocal.getDate(),
    ),
  );

  const result = new Date(firstWeekMondayUTC);
  result.setUTCDate(result.getUTCDate() + (isoWeek - 1) * 7);
  return result;
};

export const buildWeeks = (startMonday: Date, numWeeks: number): Week[] => {
  const baseMonday = startOfISOWeek(startMonday);
  return Array.from({ length: numWeeks }, (_, index) => {
    const weekStart = addWeeks(baseMonday, index);
    const isoWeek = getISOWeek(weekStart);
    const isoYear = getISOWeekYear(weekStart);
    const start = isoString(weekStart);
    const end = isoString(addDays(weekStart, 4));
    return {
      id: `kw-${isoWeek}-${isoYear}`,
      kw: isoWeek,
      start,
      end,
      days: WEEKDAY_LABELS.map((label, dayIndex) => ({
        label,
        date: isoString(addDays(weekStart, dayIndex)),
      })),
    } satisfies Week;
  });
};

export const calendarBaseFromWeeks = (weeks: Week[]): CalendarBase => {
  if (!weeks.length) {
    throw new Error('Cannot derive calendar base from empty weeks list');
  }
  const monday = parseISO(weeks[0].days[0].date);
  return { startMondayISO: isoString(monday) };
};

export const collectWeekYears = (weeks: Week[]): number[] => {
  const years = new Set<number>();
  weeks.forEach((week) => {
    week.days.forEach((day) => {
      years.add(parseISO(day.date).getUTCFullYear());
    });
  });
  return Array.from(years.values()).sort((a, b) => a - b);
};

