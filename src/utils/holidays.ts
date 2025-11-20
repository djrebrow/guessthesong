import { Bundesland, PublicHoliday } from '../types';
import {
  BAVARIA_HOLIDAYS_2025,
  BERLIN_HOLIDAYS_2025,
  LOWER_SAXONY_HOLIDAYS_2025,
  NATIONAL_HOLIDAYS_2025,
  NORTH_RHINE_WESTPHALIA_HOLIDAYS_2025,
} from '../lib/constants';

const NATIONAL_BY_YEAR: Record<number, PublicHoliday[]> = {
  2025: NATIONAL_HOLIDAYS_2025,
};

const HOLIDAYS_BY_STATE: Record<Bundesland, Record<number, PublicHoliday[]>> = {
  DE: {
    // bundesweit erhält keine zusätzlichen landesspezifischen Tage
  },
  NI: {
    2025: LOWER_SAXONY_HOLIDAYS_2025,
  },
  BY: {
    2025: BAVARIA_HOLIDAYS_2025,
  },
  NW: {
    2025: NORTH_RHINE_WESTPHALIA_HOLIDAYS_2025,
  },
  BE: {
    2025: BERLIN_HOLIDAYS_2025,
  },
};

export const getPublicHolidaysForYears = (bundesland: Bundesland, years: number[]): PublicHoliday[] => {
  const uniqueYears = Array.from(new Set(years));
  return uniqueYears.flatMap((year) => {
    const national = NATIONAL_BY_YEAR[year] ?? [];
    const stateSpecific = HOLIDAYS_BY_STATE[bundesland]?.[year] ?? [];
    return [
      ...national.map((holiday) => ({ ...holiday, bundesland })),
      ...stateSpecific.map((holiday) => ({ ...holiday, bundesland })),
    ];
  });
};

export const isPublicHoliday = (
  dateISO: string,
  bundesland: Bundesland,
  holidays: PublicHoliday[],
): PublicHoliday | undefined => {
  if (!holidays.length) return undefined;
  return holidays.find((holiday) => holiday.date === dateISO && holiday.bundesland === bundesland);
};

