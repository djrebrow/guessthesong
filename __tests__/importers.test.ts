import { describe, expect, it } from 'vitest';
import { EMPLOYEES, WEEKS } from '../src/lib/constants';
import { parseCsv } from '../src/utils/importers';

const sampleCsv = `"KW";"Datum";"Name";"Montag";"Dienstag";"Mittwoch";"Donnerstag";"Freitag"\n"KW 42";"13.10.2025-17.10.2025";"${EMPLOYEES[0].name}";"Früh";"Spät";"";"";""`;

describe('parseCsv', () => {
  it('parses assignments from csv string', () => {
    const cells = parseCsv(sampleCsv, EMPLOYEES, WEEKS);
    expect(cells).toHaveLength(5);
    const monday = cells.find((cell) => cell.dayIndex === 0);
    expect(monday?.value).toBe('Früh');
    const tuesday = cells.find((cell) => cell.dayIndex === 1);
    expect(tuesday?.value).toBe('Spät');
  });
});
