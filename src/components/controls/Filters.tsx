import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DAY_ASSIGNMENTS } from '../../lib/constants';

interface FiltersProps {
  employeeQuery: string;
  assignment: string;
  onEmployeeChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
}

const Filters = ({ employeeQuery, assignment, onEmployeeChange, onAssignmentChange }: FiltersProps) => {
  const { t } = useTranslation();

  const handleAssignment = (event: ChangeEvent<HTMLSelectElement>) => {
    onAssignmentChange(event.target.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md bg-white/70 px-4 py-3 shadow-sm backdrop-blur print:hidden">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span>{t('app.filters.employee')}:</span>
        <input
          type="search"
          value={employeeQuery}
          onChange={(event) => onEmployeeChange(event.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="z.B. Amara"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span>{t('app.filters.assignment')}:</span>
        <select
          value={assignment}
          onChange={handleAssignment}
          className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="Alle">{t('app.filters.all')}</option>
          {DAY_ASSIGNMENTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default Filters;
