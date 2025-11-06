import { ChangeEvent, useEffect, useState } from 'react';
import { getISOWeek, getISOWeekYear, parseISO } from 'date-fns';
import { CalendarBase } from '../../types';
import { fromISOWeek, isoString } from '../../utils/calendar';

interface CalendarBaseDialogProps {
  open: boolean;
  calendarBase: CalendarBase;
  onClose: () => void;
  onConfirm: (
    startMondayISO: string,
    options: { clearAssignments: boolean; shiftRelatively: boolean },
  ) => void;
}

const CalendarBaseDialog = ({ open, calendarBase, onClose, onConfirm }: CalendarBaseDialogProps) => {
  const [startMondayISO, setStartMondayISO] = useState(calendarBase.startMondayISO);
  const [isoWeek, setIsoWeek] = useState(() => getISOWeek(parseISO(calendarBase.startMondayISO)));
  const [isoYear, setIsoYear] = useState(() => getISOWeekYear(parseISO(calendarBase.startMondayISO)));
  const [clearAssignments, setClearAssignments] = useState(true);
  const [shiftRelatively, setShiftRelatively] = useState(false);

  useEffect(() => {
    if (!open) return;
    const baseDate = parseISO(calendarBase.startMondayISO);
    setStartMondayISO(calendarBase.startMondayISO);
    setIsoWeek(getISOWeek(baseDate));
    setIsoYear(getISOWeekYear(baseDate));
    setClearAssignments(true);
    setShiftRelatively(false);
  }, [open, calendarBase.startMondayISO]);

  if (!open) return null;

  const applyFromWeekYear = (week: number, year: number) => {
    try {
      const monday = fromISOWeek(year, week);
      setStartMondayISO(isoString(monday));
      setIsoWeek(week);
      setIsoYear(year);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKwChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWeek = Number(event.target.value);
    if (!Number.isFinite(nextWeek)) return;
    const clamped = Math.min(53, Math.max(1, nextWeek));
    applyFromWeekYear(clamped, isoYear);
  };

  const handleYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextYear = Number(event.target.value);
    if (!Number.isFinite(nextYear)) return;
    applyFromWeekYear(isoWeek, nextYear);
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;
    const monday = parseISO(value);
    setStartMondayISO(isoString(monday));
    setIsoWeek(getISOWeek(monday));
    setIsoYear(getISOWeekYear(monday));
  };

  const handleConfirm = () => {
    onConfirm(startMondayISO, {
      clearAssignments,
      shiftRelatively: !clearAssignments && shiftRelatively,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
    >
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Kalenderbasis</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Abbrechen
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Start-KW
            <input
              type="number"
              min={1}
              max={53}
              value={isoWeek}
              onChange={handleKwChange}
              className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Jahr
            <input
              type="number"
              value={isoYear}
              onChange={handleYearChange}
              className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Start-Montag
            <input
              type="date"
              value={startMondayISO}
              onChange={handleDateChange}
              className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </label>
        </div>
        <div className="mt-6 rounded border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Kalenderbasis geändert. Alle Wochen werden neu berechnet.</p>
          <p className="mt-2">Wählen Sie aus, wie bestehende Einträge behandelt werden sollen:</p>
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={clearAssignments}
              onChange={(event) => {
                setClearAssignments(event.target.checked);
                if (event.target.checked) {
                  setShiftRelatively(false);
                }
              }}
            />
            <span>Zuweisungen leeren (Standard)</span>
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={shiftRelatively && !clearAssignments}
              disabled={clearAssignments}
              onChange={(event) => setShiftRelatively(event.target.checked)}
            />
            <span>Zuweisungen nach relativer Position verschieben</span>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-orange-500 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarBaseDialog;

