import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../components/layout/AppHeader';
import Filters from '../components/controls/Filters';
import SettingsPanel from '../components/controls/SettingsPanel';
import Legend from '../components/Legend';
import StatsSummary from '../components/StatsSummary';
import Toasts from '../components/Toasts';
import WeekBlock from '../components/table/WeekBlock';
import EmployeeManagerDialog from '../components/controls/EmployeeManagerDialog';
import CalendarBaseDialog from '../components/controls/CalendarBaseDialog';
import { useRosterStore } from '../state/useRosterStore';
import { CopyBuffer, CopyScope, DayAssignment, RosterCell, SelectedCell } from '../types';
import { exportElementToPdf, exportToCsv, exportToXlsx } from '../utils/exporters';
import { parseCsv, parseXlsx } from '../utils/importers';
import { detectConflicts } from '../utils/validation';

interface RosterPageProps {
  allowEditing?: boolean;
  onNavigateAdmin?: () => void;
  onNavigatePublic?: () => void;
  onLogout?: () => void;
}

const RosterPage = ({ allowEditing = true, onNavigateAdmin, onNavigatePublic, onLogout }: RosterPageProps) => {
  const rosterRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [copyBuffer, setCopyBuffer] = useState<CopyBuffer | null>(null);
  const [manageEmployeesOpen, setManageEmployeesOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  const {
    employees,
    weeks,
    cells,
    filters,
    settings,
    toasts,
    calendarBase,
    holidayLocks,
    setSettings,
    setFilters,
    setCell,
    bulkSetCells,
    clearCell,
    undo,
    redo,
    replaceAllCells,
    addToast,
    removeToast,
    addEmployee,
    updateEmployeeName,
    removeEmployee,
    reorderEmployees,
    updateCalendarBase,
  } = useRosterStore((state) => ({
    employees: state.employees,
    weeks: state.weeks,
    cells: state.cells,
    filters: state.filters,
    settings: state.settings,
    toasts: state.toasts,
    calendarBase: state.calendarBase,
    holidayLocks: state.holidayLocks,
    setSettings: state.setSettings,
    setFilters: state.setFilters,
    setCell: state.setCell,
    bulkSetCells: state.bulkSetCells,
    clearCell: state.clearCell,
    undo: state.undo,
    redo: state.redo,
    replaceAllCells: state.replaceAllCells,
    addToast: state.addToast,
    removeToast: state.removeToast,
    addEmployee: state.addEmployee,
    updateEmployeeName: state.updateEmployeeName,
    removeEmployee: state.removeEmployee,
    reorderEmployees: state.reorderEmployees,
    updateCalendarBase: state.updateCalendarBase,
  }));

  useEffect(() => {
    if (!employees.length || !weeks.length) {
      setSelectedCell(null);
      return;
    }
    if (
      !selectedCell ||
      !employees.some((employee) => employee.id === selectedCell.employeeId) ||
      !weeks.some((week) => week.id === selectedCell.weekId)
    ) {
      setSelectedCell({ employeeId: employees[0].id, weekId: weeks[0].id, dayIndex: 0 });
    }
  }, [selectedCell, employees, weeks]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        if (key === 'y') {
          event.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const isHolidayLocked = useCallback(
    (weekId: string, dayIndex: number) =>
      settings.autoHolidayMarking && Boolean(holidayLocks[`${weekId}:${dayIndex}`]),
    [settings.autoHolidayMarking, holidayLocks],
  );

  const filteredEmployees = useMemo(() => {
    const query = filters.employeeQuery.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery = !query || employee.name.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (filters.assignment === 'Alle') return true;
      return cells.some(
        (cell) => cell.employeeId === employee.id && cell.value === filters.assignment,
      );
    });
  }, [employees, filters, cells]);

  const weekColumns = useMemo(() => {
    const midpoint = Math.ceil(weeks.length / 2);
    return [weeks.slice(0, midpoint), weeks.slice(midpoint)];
  }, [weeks]);

  const handleChangeCell = useCallback(
    (cell: SelectedCell, value: DayAssignment | null) => {
      if (!allowEditing) return;
      if (isHolidayLocked(cell.weekId, cell.dayIndex)) {
        addToast({ type: 'warning', message: 'Automatischer Feiertag kann nicht bearbeitet werden.' });
        return;
      }
      if (value === null) {
        clearCell(cell.employeeId, cell.weekId, cell.dayIndex);
        return;
      }
      const nextCells = cells.map((item) =>
        item.employeeId === cell.employeeId &&
        item.weekId === cell.weekId &&
        item.dayIndex === cell.dayIndex
          ? { ...item, value }
          : item,
      );
      const conflicts = detectConflicts(nextCells);
      if (conflicts.length) {
        addToast({ type: 'warning', message: 'Konflikt erkannt: Mehrfachbelegung' });
      }
      const existing = cells.find(
        (item) =>
          item.employeeId === cell.employeeId &&
          item.weekId === cell.weekId &&
          item.dayIndex === cell.dayIndex,
      );
      if (existing?.value && existing.value !== value) {
        addToast({ type: 'warning', message: 'Vorheriger Eintrag überschrieben' });
      }
      setCell(cell.employeeId, cell.weekId, cell.dayIndex, value);
    },
    [cells, setCell, clearCell, addToast, isHolidayLocked, allowEditing],
  );

  const handleFillWeek = useCallback(
    (employeeId: string, weekId: string, value: DayAssignment | null) => {
      if (!allowEditing) return;
      if (!value) return;
      const week = weeks.find((wk) => wk.id === weekId);
      if (!week) return;
      const updates = week.days
        .map((_, index) => ({ employeeId, weekId, dayIndex: index, value }))
        .filter((update) => !isHolidayLocked(update.weekId, update.dayIndex));
      if (updates.length !== week.days.length) {
        addToast({ type: 'info', message: 'Feiertage bleiben unverändert.' });
      }
      bulkSetCells(updates);
    },
    [weeks, bulkSetCells, isHolidayLocked, addToast, allowEditing],
  );

  const handleFillColumn = useCallback(
    (weekId: string, dayIndex: number, value: DayAssignment | null) => {
      if (!allowEditing) return;
      if (!value) return;
      if (isHolidayLocked(weekId, dayIndex)) {
        addToast({ type: 'info', message: 'Feiertage bleiben unverändert.' });
        return;
      }
      const updates = employees.map((employee) => ({
        employeeId: employee.id,
        weekId,
        dayIndex,
        value,
      }));
      bulkSetCells(updates);
    },
    [employees, bulkSetCells, isHolidayLocked, addToast, allowEditing],
  );

  const handleClearCell = useCallback(
    (cell: SelectedCell) => {
      if (!allowEditing) return;
      if (isHolidayLocked(cell.weekId, cell.dayIndex)) {
        addToast({ type: 'warning', message: 'Automatischer Feiertag kann nicht gelöscht werden.' });
        return;
      }
      clearCell(cell.employeeId, cell.weekId, cell.dayIndex);
    },
    [clearCell, isHolidayLocked, addToast, allowEditing],
  );

  const handleCopy = useCallback(
    (cell: SelectedCell, scope: CopyScope) => {
      if (!allowEditing) return;
      if (scope === 'cell') {
        const match = cells.find(
          (item) =>
            item.employeeId === cell.employeeId &&
            item.weekId === cell.weekId &&
            item.dayIndex === cell.dayIndex,
        );
        if (!match) return;
        setCopyBuffer({ scope, weekId: cell.weekId, employeeId: cell.employeeId, cells: [match] });
        addToast({ type: 'info', message: 'Zelle kopiert' });
        return;
      }
      if (scope === 'row') {
        const rowCells = cells.filter(
          (item) => item.employeeId === cell.employeeId && item.weekId === cell.weekId,
        );
        setCopyBuffer({ scope, weekId: cell.weekId, employeeId: cell.employeeId, cells: rowCells });
        addToast({ type: 'info', message: 'Zeile kopiert' });
        return;
      }
      const weekCells = cells.filter((item) => item.weekId === cell.weekId);
      setCopyBuffer({ scope, weekId: cell.weekId, cells: weekCells });
      addToast({ type: 'info', message: 'Woche kopiert' });
    },
    [cells, addToast, allowEditing],
  );

  const handlePaste = useCallback(
    (target: SelectedCell) => {
      if (!allowEditing) return;
      if (!copyBuffer) return;
      if (copyBuffer.scope === 'cell') {
        const [cellData] = copyBuffer.cells;
        if (!cellData) return;
        if (isHolidayLocked(target.weekId, target.dayIndex)) {
          addToast({ type: 'warning', message: 'Feiertage bleiben unverändert.' });
          return;
        }
        setCell(target.employeeId, target.weekId, target.dayIndex, cellData.value);
        return;
      }
      if (copyBuffer.scope === 'row') {
        const updates = copyBuffer.cells.map((cell) => ({
          employeeId: target.employeeId,
          weekId: target.weekId,
          dayIndex: cell.dayIndex,
          value: cell.value,
        }));
        const filtered = updates.filter((update) => !isHolidayLocked(update.weekId, update.dayIndex));
        if (filtered.length !== updates.length) {
          addToast({ type: 'info', message: 'Feiertage bleiben unverändert.' });
        }
        bulkSetCells(filtered);
        return;
      }
      const updates = copyBuffer.cells.map((cell) => ({
        employeeId: cell.employeeId,
        weekId: target.weekId,
        dayIndex: cell.dayIndex,
        value: cell.value,
      }));
      const filtered = updates.filter((update) => !isHolidayLocked(update.weekId, update.dayIndex));
      if (filtered.length !== updates.length) {
        addToast({ type: 'info', message: 'Feiertage bleiben unverändert.' });
      }
      bulkSetCells(filtered);
    },
    [copyBuffer, setCell, bulkSetCells, isHolidayLocked, addToast, allowEditing],
  );

  const handleAddEmployee = useCallback(
    (name: string) => {
      if (!allowEditing) return;
      addEmployee(name);
      addToast({ type: 'success', message: `Mitarbeiter ${name} hinzugefügt.` });
    },
    [addEmployee, addToast, allowEditing],
  );

  const handleRemoveEmployee = useCallback(
    (id: string) => {
      if (!allowEditing) return;
      const employee = employees.find((item) => item.id === id);
      removeEmployee(id);
      if (employee) {
        addToast({ type: 'info', message: `${employee.name} entfernt.` });
      }
    },
    [removeEmployee, employees, addToast, allowEditing],
  );

  const handleReorderEmployees = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      if (!allowEditing) return;
      reorderEmployees(sourceIndex, targetIndex);
    },
    [reorderEmployees, allowEditing],
  );

  const handleUpdateCalendar = useCallback(
    (startMondayISO: string, options: { clearAssignments: boolean; shiftRelatively: boolean }) => {
      if (!allowEditing) return;
      updateCalendarBase(startMondayISO, options);
      setCalendarDialogOpen(false);
      addToast({ type: 'success', message: 'Kalenderbasis aktualisiert.' });
    },
    [updateCalendarBase, addToast, allowEditing],
  );

  const triggerImport = () => {
    if (!allowEditing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowEditing) {
      event.target.value = '';
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCsv(text, employees, weeks);
        applyImportedCells(parsed);
      } else if (file.name.endsWith('.xlsx')) {
        const parsed = await parseXlsx(file, employees, weeks);
        applyImportedCells(parsed);
      } else {
        addToast({ type: 'error', message: 'Unbekanntes Dateiformat' });
      }
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Import fehlgeschlagen' });
    } finally {
      event.target.value = '';
    }
  };

  const applyImportedCells = (imported: RosterCell[]) => {
    if (!allowEditing) return;
    const map = new Map<string, DayAssignment | null>();
    imported.forEach((cell) => {
      const key = `${cell.employeeId}_${cell.weekId}_${cell.dayIndex}`;
      map.set(key, cell.value ?? null);
    });
    const merged = cells.map((cell) => {
      const key = `${cell.employeeId}_${cell.weekId}_${cell.dayIndex}`;
      return { ...cell, value: map.has(key) ? map.get(key)! : cell.value };
    });
    replaceAllCells(merged);
    addToast({ type: 'success', message: 'Import abgeschlossen' });
  };

  const handleExportCsv = () => {
    const content = exportToCsv(weeks, employees, cells, settings.dateFormat);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'dienstplan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', message: 'CSV exportiert' });
  };

  const handleExportXlsx = () => {
    exportToXlsx(weeks, employees, cells, settings.dateFormat);
    addToast({ type: 'success', message: 'Excel exportiert' });
  };

  const handleExportPdf = async () => {
    if (!rosterRef.current) return;
    await exportElementToPdf(rosterRef.current, 'dienstplan.pdf');
    addToast({ type: 'success', message: 'PDF exportiert' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Fragment>
      <AppHeader
        mode={allowEditing ? 'admin' : 'view'}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        onExportPdf={handleExportPdf}
        onImport={allowEditing ? triggerImport : undefined}
        onUndo={allowEditing ? undo : undefined}
        onRedo={allowEditing ? redo : undefined}
        onPrint={handlePrint}
        onManageEmployees={allowEditing ? () => setManageEmployeesOpen(true) : undefined}
        onOpenCalendarBase={allowEditing ? () => setCalendarDialogOpen(true) : undefined}
        onNavigateAdmin={allowEditing ? undefined : onNavigateAdmin}
        onNavigatePublic={allowEditing ? onNavigatePublic : undefined}
        onLogout={allowEditing ? onLogout : undefined}
      />
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6" ref={rosterRef}>
        {allowEditing && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        )}
        <Filters
          employeeQuery={filters.employeeQuery}
          assignment={filters.assignment}
          onEmployeeChange={(value) => setFilters({ employeeQuery: value })}
          onAssignmentChange={(value) => setFilters({ assignment: value as any })}
        />
        <SettingsPanel
          highContrast={settings.highContrast}
          fontScale={settings.fontScale}
          dateFormat={settings.dateFormat}
          autoHolidayMarking={settings.autoHolidayMarking}
          bundesland={settings.bundesland}
          onToggleContrast={() => setSettings({ highContrast: !settings.highContrast })}
          onIncreaseFont={() => setSettings({ fontScale: Math.min(settings.fontScale + 0.05, 1.4) })}
          onDecreaseFont={() => setSettings({ fontScale: Math.max(settings.fontScale - 0.05, 0.8) })}
          onToggleDateFormat={() =>
            setSettings({ dateFormat: settings.dateFormat === 'D.M.YYYY' ? 'DD.MM.YYYY' : 'D.M.YYYY' })
          }
          onToggleHolidayMarking={(value) => setSettings({ autoHolidayMarking: value })}
          onBundeslandChange={(value) => setSettings({ bundesland: value })}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {weekColumns.map((columnWeeks, index) => (
            <div key={index} className="flex flex-col gap-4">
              <WeekBlock
                weeks={columnWeeks}
                employees={filteredEmployees}
                cells={cells}
                selectedCell={selectedCell}
                allowEditing={allowEditing}
                onSelectCell={(cell) => setSelectedCell(cell)}
                onChangeCell={handleChangeCell}
                onFillWeek={handleFillWeek}
                onFillColumn={handleFillColumn}
                onClearCell={handleClearCell}
                onCopy={handleCopy}
                onPaste={handlePaste}
                highContrast={settings.highContrast}
                dateFormat={settings.dateFormat}
                holidayLocks={holidayLocks}
              />
              <Legend variant="compact" />
            </div>
          ))}
        </div>
        <Legend />
        <StatsSummary weeks={weeks} employees={employees} cells={cells} />
        <footer className="mt-6 rounded-md bg-white/80 px-4 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm">
          Spätschicht plant sich bei Bedarf ein / Unterstützung in allen Bereichen.
          <br />
          Gilt nicht an gesetzlichen Feiertagen, bei Urlaub usw.!
        </footer>
      </main>
      {allowEditing && (
        <EmployeeManagerDialog
          open={manageEmployeesOpen}
          employees={employees}
          onClose={() => setManageEmployeesOpen(false)}
          onAdd={handleAddEmployee}
          onUpdate={updateEmployeeName}
          onRemove={handleRemoveEmployee}
          onReorder={handleReorderEmployees}
        />
      )}
      {allowEditing && (
        <CalendarBaseDialog
          open={calendarDialogOpen}
          calendarBase={calendarBase}
          onClose={() => setCalendarDialogOpen(false)}
          onConfirm={handleUpdateCalendar}
        />
      )}
      <Toasts toasts={toasts} onDismiss={removeToast} />
    </Fragment>
  );
};

export default RosterPage;
