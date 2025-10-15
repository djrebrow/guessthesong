import { DayAssignment, Employee, RosterCell, Week } from '../types';

export interface EmployeeWeekStats {
  employeeId: string;
  weekId: string;
  counts: Record<'Früh' | 'Spät' | 'Abwesend' | 'Feiertag' | 'Sonder', number>;
}

const baseCounts = (): Record<'Früh' | 'Spät' | 'Abwesend' | 'Feiertag' | 'Sonder', number> => ({
  Früh: 0,
  Spät: 0,
  Abwesend: 0,
  Feiertag: 0,
  Sonder: 0,
});

export const buildWeekStats = (weeks: Week[], employees: Employee[], cells: RosterCell[]): EmployeeWeekStats[] => {
  return weeks.flatMap((week) => {
    return employees.map((employee) => {
      const counts = baseCounts();
      week.days.forEach((_, index) => {
        const cell = cells.find(
          (c) => c.employeeId === employee.id && c.weekId === week.id && c.dayIndex === index,
        );
        const value = cell?.value;
        if (!value) return;
        switch (value) {
          case 'Früh':
          case 'Spät':
          case 'Abwesend':
          case 'Feiertag':
            counts[value] += 1;
            break;
          default:
            counts.Sonder += 1;
            break;
        }
      });
      return { employeeId: employee.id, weekId: week.id, counts };
    });
  });
};

export const summarizeAssignments = (assignments: (DayAssignment | null)[]) => {
  return assignments.reduce(
    (acc, assignment) => {
      if (!assignment) return acc;
      switch (assignment) {
        case 'Früh':
        case 'Spät':
        case 'Abwesend':
        case 'Feiertag':
          acc[assignment] += 1;
          break;
        default:
          acc.Sonder += 1;
          break;
      }
      return acc;
    },
    baseCounts(),
  );
};
