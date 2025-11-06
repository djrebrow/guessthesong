import { PublicHoliday } from '../types';
import { LOWER_SAXONY_HOLIDAYS_2025 } from '../lib/constants';

const HOLIDAYS_BY_STATE: Record<'NI', Record<number, PublicHoliday[]>> = {
  NI: {
    2025: LOWER_SAXONY_HOLIDAYS_2025,
  },
};

export const getPublicHolidaysForYears = (bundesland: 'NI', years: number[]): PublicHoliday[] => {
  const uniqueYears = Array.from(new Set(years));
  return uniqueYears.flatMap((year) => HOLIDAYS_BY_STATE[bundesland][year] ?? []);
};

export const isPublicHoliday = (
  dateISO: string,
  bundesland: 'NI',
  holidays: PublicHoliday[],
): PublicHoliday | undefined => {
  if (!holidays.length) return undefined;
  return holidays.find((holiday) => holiday.date === dateISO && holiday.bundesland === bundesland);
};

