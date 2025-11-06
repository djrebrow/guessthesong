import { Employee, HolidayLock, RosterCell, SelectedCell, Week } from '../../types';
import RosterTable from './RosterTable';

interface WeekBlockProps {
  weeks: Week[];
  employees: Employee[];
  cells: RosterCell[];
  selectedCell: SelectedCell | null;
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

const WeekBlock = ({
  weeks,
  employees,
  cells,
  selectedCell,
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
}: WeekBlockProps) => {
  return (
    <div className="flex flex-col gap-6">
      {weeks.map((week) => (
        <RosterTable
          key={week.id}
          week={week}
          employees={employees}
          cells={cells}
          selectedCell={selectedCell}
          onSelectCell={onSelectCell}
          onChangeCell={onChangeCell}
          onFillWeek={onFillWeek}
          onFillColumn={onFillColumn}
          onClearCell={onClearCell}
          onCopy={onCopy}
          onPaste={onPaste}
          highContrast={highContrast}
          dateFormat={dateFormat}
          holidayLocks={holidayLocks}
        />
      ))}
    </div>
  );
};

export default WeekBlock;
