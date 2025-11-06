import { parseISO } from 'date-fns';
import { buildWeeks, collectWeekYears, fromISOWeek } from '../src/utils/calendar';
import { getPublicHolidaysForYears, isPublicHoliday } from '../src/utils/holidays';
import { LOWER_SAXONY_HOLIDAYS_2025 } from '../src/lib/constants';

describe('calendar utilities', () => {
  it('computes monday for ISO week 1/2025', () => {
    const monday = fromISOWeek(2025, 1);
    expect(monday.toISOString().slice(0, 10)).toBe('2024-12-30');
  });

  it('builds consecutive weeks with correct numbering', () => {
    const weeks = buildWeeks(parseISO('2025-10-13'), 2);
    expect(weeks[0].kw).toBe(42);
    expect(weeks[1].kw).toBe(43);
    expect(weeks[1].days[0].date).toBe('2025-10-20');
  });

  it('collects all years covered by weeks', () => {
    const weeks = buildWeeks(parseISO('2024-12-30'), 3);
    expect(collectWeekYears(weeks)).toEqual([2024, 2025]);
  });
});

describe('holiday utilities', () => {
  it('returns Niedersachsen holidays for 2025', () => {
    const holidays = getPublicHolidaysForYears('NI', [2025]);
    expect(holidays).toHaveLength(LOWER_SAXONY_HOLIDAYS_2025.length);
    expect(holidays.some((holiday) => holiday.date === '2025-10-31')).toBe(true);
  });

  it('detects a public holiday for Niedersachsen', () => {
    const holidays = getPublicHolidaysForYears('NI', [2025]);
    const holiday = isPublicHoliday('2025-10-31', 'NI', holidays);
    expect(holiday).toBeDefined();
    expect(holiday?.name).toBe('Reformationstag');
  });
});
