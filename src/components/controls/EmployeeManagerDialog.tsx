import { FormEvent, useEffect, useState } from 'react';
import { Employee } from '../../types';

interface EmployeeManagerDialogProps {
  open: boolean;
  employees: Employee[];
  onClose: () => void;
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onReorder: (sourceIndex: number, targetIndex: number) => void;
}

const EmployeeManagerDialog = ({
  open,
  employees,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: EmployeeManagerDialogProps) => {
  const [newEmployeeName, setNewEmployeeName] = useState('');

  useEffect(() => {
    if (!open) {
      setNewEmployeeName('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newEmployeeName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewEmployeeName('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Mitarbeiter verwalten</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Schließen
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          <ul className="flex flex-col gap-3">
            {employees.map((employee, index) => (
              <li key={employee.id} className="flex items-center gap-2 rounded border border-slate-200 p-2">
                <span className="w-6 text-center text-xs font-semibold text-slate-500">{index + 1}</span>
                <input
                  type="text"
                  value={employee.name}
                  onChange={(event) => onUpdate(employee.id, event.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onReorder(index, Math.max(0, index - 1))}
                    aria-label="Nach oben"
                    className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    disabled={index === 0}
                  >
                    ⇡
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorder(index, Math.min(employees.length - 1, index + 1))}
                    aria-label="Nach unten"
                    className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    disabled={index === employees.length - 1}
                  >
                    ⇣
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(employee.id)}
                    className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(event) => setNewEmployeeName(event.target.value)}
            placeholder="Name hinzufügen"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button
            type="submit"
            className="rounded bg-orange-500 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Hinzufügen
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeManagerDialog;

