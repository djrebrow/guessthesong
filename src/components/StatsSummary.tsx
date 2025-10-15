import { Employee, RosterCell, Week } from '../types';
import { buildWeekStats } from '../utils/statistics';

interface StatsSummaryProps {
  weeks: Week[];
  employees: Employee[];
  cells: RosterCell[];
}

const StatsSummary = ({ weeks, employees, cells }: StatsSummaryProps) => {
  const stats = buildWeekStats(weeks, employees, cells);
  return (
    <section className="mt-6 overflow-x-auto rounded-md bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Summen je Woche</h3>
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-roster-header text-slate-900">
          <tr>
            <th className="border border-slate-300 px-2 py-1 text-left">KW</th>
            <th className="border border-slate-300 px-2 py-1 text-left">Name</th>
            <th className="border border-slate-300 px-2 py-1">Früh</th>
            <th className="border border-slate-300 px-2 py-1">Spät</th>
            <th className="border border-slate-300 px-2 py-1">Abwesend</th>
            <th className="border border-slate-300 px-2 py-1">Feiertag</th>
            <th className="border border-slate-300 px-2 py-1">Sonder/Einsatz</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((entry) => {
            const week = weeks.find((wk) => wk.id === entry.weekId);
            const employee = employees.find((emp) => emp.id === entry.employeeId);
            if (!week || !employee) return null;
            return (
              <tr key={`${entry.weekId}-${entry.employeeId}`} className="odd:bg-white even:bg-slate-50">
                <td className="border border-slate-200 px-2 py-1 font-semibold">KW {week.kw}</td>
                <td className="border border-slate-200 px-2 py-1">{employee.name}</td>
                <td className="border border-slate-200 px-2 py-1 text-center">{entry.counts.Früh}</td>
                <td className="border border-slate-200 px-2 py-1 text-center">{entry.counts.Spät}</td>
                <td className="border border-slate-200 px-2 py-1 text-center">{entry.counts.Abwesend}</td>
                <td className="border border-slate-200 px-2 py-1 text-center">{entry.counts.Feiertag}</td>
                <td className="border border-slate-200 px-2 py-1 text-center">{entry.counts.Sonder}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default StatsSummary;
