import { Employee, HolidayLock, RosterCell, SelectedCell, Week } from '../../types';
import { findCellValue } from '../../state/useRosterStore';
import { formatDate } from '../../utils/date';
import RosterCellComponent from './RosterCell';

interface RosterTableProps {
  week: Week;
  employees: Employee[];
  cells: RosterCell[];
  selectedCell: SelectedCell | null;
  allowEditing: boolean;
  onSelectCell: (cell: SelectedCell) => void;
  onChangeCell: (cell: SelectedCell, value: RosterCell['value']) => void;
  onFillWeek: (employeeId: string, weekId: string, value: RosterCell['value']) => void;
  onFillColumn: (weekId: string, dayIndex: number, value: RosterCell['value']) => void;
  onClearCell: (cell: SelectedCell) => void;
  onCopy: (cell: SelectedCell, scope: 'cell' | 'row' | 'week') => void;
  onPaste: (cell: SelectedCell) => void;
  highContrast: boolean;
  dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY';
  holidayLocks: Record<string, HolidayLock>;
}

const RosterTable = ({
  week,
  employees,
  cells,
  selectedCell,
  allowEditing,
  onSelectCell,
  onChangeCell,
  onFillWeek,
  onFillColumn,
  onClearCell,
  onCopy,
  onPaste,
  highContrast,
  dateFormat,
  holidayLocks,
}: RosterTableProps) => {
  return (
    <section className="print-page rounded-md bg-white shadow-md">
      <header className="flex items-center justify-between bg-roster-header px-4 py-2 text-sm font-semibold uppercase text-slate-800">
        <span>KW {week.kw}</span>
        <span>
          {formatDate(week.start, dateFormat)} – {formatDate(week.end, dateFormat)}
        </span>
        <span className="rounded bg-roster-ap px-2 py-1 text-xs font-bold text-white">AP</span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-roster-ap text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="sticky left-0 z-20 border border-slate-300 bg-roster-ap px-3 py-2">Name</th>
              {week.days.map((day) => (
                <th key={day.label} className="border border-slate-300 px-3 py-2 text-center text-white">
                  <div className="flex flex-col text-[11px] leading-tight">
                    <span>{day.label.slice(0, 2)}</span>
                    <span className="font-semibold">{formatDate(day.date, dateFormat)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          {employees.map((employee) => (
            <tr key={`${week.id}-${employee.id}`} className="odd:bg-white even:bg-slate-50 hover:bg-orange-50">
              <th
                scope="row"
                className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
              >
                {employee.name}
              </th>
              {week.days.map((day, index) => {
                const cellValue = findCellValue(cells, employee.id, week.id, index);
                const cell: SelectedCell = { employeeId: employee.id, weekId: week.id, dayIndex: index };
                const lockKey = `${week.id}:${index}`;
                const lockInfo = holidayLocks[lockKey];
                return (
                  <td key={day.label + employee.id} className="p-0">
                    <RosterCellComponent
                      employeeId={employee.id}
                      weekId={week.id}
                      dayIndex={index}
                      allowEditing={allowEditing}
                      value={cellValue}
                      onChange={(newValue) => onChangeCell(cell, newValue)}
                        onSelect={() => onSelectCell(cell)}
                        selected={
                          !!selectedCell &&
                          selectedCell.employeeId === employee.id &&
                          selectedCell.weekId === week.id &&
                          selectedCell.dayIndex === index
                        }
                        highContrast={highContrast}
                        onClear={() => onClearCell(cell)}
                        onFillWeek={() => onFillWeek(employee.id, week.id, cellValue)}
                        onFillColumn={() => onFillColumn(week.id, index, cellValue)}
                        onCopy={(scope) => onCopy(cell, scope)}
                        onPaste={() => onPaste(cell)}
                        locked={Boolean(lockInfo)}
                        lockReason={lockInfo?.name}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RosterTable;
