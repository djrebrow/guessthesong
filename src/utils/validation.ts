import { RosterCell } from '../types';

export interface Conflict {
  employeeId: string;
  weekId: string;
  dayIndex: number;
  message: string;
}

export const detectConflicts = (cells: RosterCell[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  const seen = new Map<string, RosterCell>();
  cells.forEach((cell) => {
    const key = `${cell.employeeId}_${cell.weekId}_${cell.dayIndex}`;
    const existing = seen.get(key);
    if (existing && existing.value && cell.value && existing.value !== cell.value) {
      conflicts.push({
        employeeId: cell.employeeId,
        weekId: cell.weekId,
        dayIndex: cell.dayIndex,
        message: 'Mehrfachbelegung erkannt',
      });
    } else if (!existing) {
      seen.set(key, cell);
    }
  });
  return conflicts;
};
