import { describe, expect, it } from 'vitest';
import { detectConflicts } from '../src/utils/validation';
import { RosterCell } from '../src/types';

describe('detectConflicts', () => {
  it('returns conflict when same cell has differing assignments', () => {
    const cells: RosterCell[] = [
      { employeeId: 'a', weekId: 'w', dayIndex: 0, value: 'Früh' },
      { employeeId: 'a', weekId: 'w', dayIndex: 0, value: 'Spät' },
    ];
    const conflicts = detectConflicts(cells);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].employeeId).toBe('a');
  });

  it('returns empty array when there are no conflicts', () => {
    const cells: RosterCell[] = [
      { employeeId: 'a', weekId: 'w', dayIndex: 0, value: 'Früh' },
      { employeeId: 'a', weekId: 'w', dayIndex: 1, value: 'Spät' },
    ];
    expect(detectConflicts(cells)).toHaveLength(0);
  });
});
