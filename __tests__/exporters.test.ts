import { describe, expect, it } from 'vitest';
import { EMPLOYEES, WEEKS } from '../src/lib/constants';
import { exportToCsv } from '../src/utils/exporters';
import { RosterCell } from '../src/types';

describe('exportToCsv', () => {
  it('creates a semicolon separated CSV', () => {
    const cells: RosterCell[] = [
      { employeeId: EMPLOYEES[0].id, weekId: WEEKS[0].id, dayIndex: 0, value: 'Früh' },
      { employeeId: EMPLOYEES[0].id, weekId: WEEKS[0].id, dayIndex: 1, value: 'Spät' },
    ];
    const csv = exportToCsv(WEEKS.slice(0, 1), EMPLOYEES.slice(0, 1), cells, 'DD.MM.YYYY');
    expect(csv).toContain('"KW";"Datum";"Name";"Montag";"Dienstag";"Mittwoch";"Donnerstag";"Freitag"');
    expect(csv).toContain('"KW 42"');
    expect(csv).toContain('"Früh"');
    expect(csv).toContain('"Spät"');
  });
});
