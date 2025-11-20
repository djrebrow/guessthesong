import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DayAssignment } from '../../types';
import { assignmentShortcutMap, getAssignmentColor, isSpecialAssignment } from '../../state/useRosterStore';
import { assignmentOptions } from '../../lib/initialData';

interface RosterCellProps {
  employeeId: string;
  weekId: string;
  dayIndex: number;
  value: DayAssignment | null;
  allowEditing: boolean;
  onChange: (value: DayAssignment | null) => void;
  onSelect: () => void;
  selected: boolean;
  highContrast: boolean;
  onClear: () => void;
  onFillWeek: () => void;
  onFillColumn: () => void;
  onCopy: (scope: 'cell' | 'row' | 'week') => void;
  onPaste: () => void;
  locked?: boolean;
  lockReason?: string;
}

const RosterCell = ({
  employeeId,
  weekId,
  dayIndex,
  value,
  allowEditing,
  onChange,
  onSelect,
  selected,
  highContrast,
  onClear,
  onFillWeek,
  onFillColumn,
  onCopy,
  onPaste,
  locked = false,
  lockReason,
}: RosterCellProps) => {
  const [open, setOpen] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const filterTimer = useRef<number | null>(null);
  const editable = allowEditing && !locked;

  useEffect(() => {
    if (!editable) {
      setOpen(false);
      setMenuPosition(null);
    }
  }, [editable]);

  useEffect(() => {
    if (!open && filterTerm) {
      setFilterTerm('');
    }
  }, [open, filterTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMenuPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!filterTerm) return assignmentOptions;
    return assignmentOptions.filter((option) =>
      option.label.toLowerCase().includes(filterTerm.toLowerCase()),
    );
  }, [filterTerm]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!allowEditing || locked) {
      if (['Enter', ' ', 'f', 's', 'a', 'h'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        if (event.shiftKey) {
          onCopy('row');
        } else if (event.altKey) {
          onCopy('week');
        } else {
          onCopy('cell');
        }
        return;
      }
      if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        onPaste();
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        return; // handled globally
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setMenuPosition(null);
      return;
    }

    const shortcut = assignmentShortcutMap[event.key.toLowerCase()];
    if (shortcut !== undefined) {
      event.preventDefault();
      onChange(shortcut);
      return;
    }

    if (/^[a-zA-ZäöüÄÖÜ\s]$/.test(event.key)) {
      const nextTerm = `${filterTerm}${event.key}`.trimStart();
      setFilterTerm(nextTerm);
      setOpen(true);
      if (filterTimer.current) {
        window.clearTimeout(filterTimer.current);
      }
      filterTimer.current = window.setTimeout(() => {
        setFilterTerm('');
      }, 1500) as unknown as number;
    }

    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      if (!filteredOptions.length) return;
      const currentIndex = filteredOptions.findIndex((option) => option.id === value);
      const next = filteredOptions[(currentIndex + 1) % filteredOptions.length];
      if (next) {
        onChange(next.id as DayAssignment);
      }
      return;
    }

    if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      if (!filteredOptions.length) return;
      const currentIndex = filteredOptions.findIndex((option) => option.id === value);
      const prevIndex = (currentIndex - 1 + filteredOptions.length) % filteredOptions.length;
      const prev = filteredOptions[prevIndex];
      if (prev) {
        onChange(prev.id as DayAssignment);
      }
    }
  };

  const openMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!editable) return;
    setMenuPosition({ x: event.clientX, y: event.clientY });
    onSelect();
  };

  const tooltip = locked
    ? lockReason
      ? `Automatisch als gesetzlicher Feiertag markiert: ${lockReason}`
      : 'Automatisch als gesetzlicher Feiertag markiert'
    : undefined;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="gridcell"
      aria-selected={selected}
      aria-disabled={locked}
      data-employee={employeeId}
      data-week={weekId}
      data-day={dayIndex}
      onFocus={onSelect}
      onKeyDown={handleKeyDown}
      onClick={() => {
        onSelect();
        if (editable) {
          setOpen((prev) => !prev);
        }
      }}
      onContextMenu={openMenu}
      className={`relative flex h-12 ${
        editable ? 'cursor-pointer' : 'cursor-default'
      } items-center justify-center border border-slate-300 text-sm font-semibold outline-none transition ${
        selected ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-100' : 'focus:ring-1 focus:ring-orange-400'
      } ${getAssignmentColor(value, highContrast)} ${isSpecialAssignment(value) ? 'uppercase tracking-wide' : ''}`}
      title={tooltip}
    >
      <span>{value ?? ''}</span>
      {open && editable && (
        <div
          role="listbox"
          aria-activedescendant={value ?? undefined}
          className="absolute left-0 top-full z-30 mt-1 w-48 rounded-md border border-slate-300 bg-white shadow-lg"
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs uppercase text-slate-500 hover:bg-slate-100"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            — Leeren —
          </button>
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-orange-100 ${
                  option.id === value ? 'bg-orange-50 font-bold' : 'font-medium text-slate-700'
                }`}
                onClick={() => {
                  onChange(option.id as DayAssignment);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {menuPosition && editable && (
        <div
          role="menu"
          className="fixed z-40 w-60 rounded-md border border-slate-300 bg-white py-1 text-sm shadow-xl"
          style={{ top: menuPosition.y, left: menuPosition.x }}
        >
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onClear();
              setMenuPosition(null);
            }}
          >
            Wert leeren
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onFillWeek();
              setMenuPosition(null);
            }}
          >
            Auf ganze Woche für Mitarbeiter kopieren
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onFillColumn();
              setMenuPosition(null);
            }}
          >
            Auf alle Mitarbeiter an diesem Tag kopieren
          </button>
          <div className="my-1 border-t border-slate-200" />
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onCopy('cell');
              setMenuPosition(null);
            }}
          >
            Zelle kopieren
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onCopy('row');
              setMenuPosition(null);
            }}
          >
            Zeile kopieren
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onCopy('week');
              setMenuPosition(null);
            }}
          >
            Woche kopieren
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left hover:bg-orange-100"
            onClick={() => {
              onPaste();
              setMenuPosition(null);
            }}
          >
            Einfügen
          </button>
        </div>
      )}
    </div>
  );
};

export default RosterCell;
