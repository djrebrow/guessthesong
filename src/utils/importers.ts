import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import { DayAssignment, Employee, RosterCell, Week } from '../types';

interface ParsedRow {
  KW: string;
  Datum: string;
  Name: string;
  Montag: string;
  Dienstag: string;
  Mittwoch: string;
  Donnerstag: string;
  Freitag: string;
}

const parseAssignment = (value: string): DayAssignment | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const allowed: DayAssignment[] = [
    'Früh',
    'Spät',
    'Abwesend',
    'Feiertag',
    'Sonder',
    'Connox',
    'Schmalgang',
    'Außenlager',
    'Kleinteile/Konsi',
  ];
  return allowed.find((item) => item.toLowerCase() === normalized.toLowerCase()) ?? null;
};

export const parseCsv = (
  fileContent: string,
  employees: Employee[],
  weeks: Week[],
): RosterCell[] => {
  const result = Papa.parse<ParsedRow>(fileContent, { header: true, delimiter: ';', skipEmptyLines: true });
  const rows = result.data;
  const cells: RosterCell[] = [];
  rows.forEach((row) => {
    const employee = employees.find((emp) => emp.name === row.Name);
    if (!employee) return;
    const weekNumber = row.KW.replace(/[^0-9]/g, '');
    const week = weeks.find((wk) => wk.kw === Number(weekNumber));
    if (!week) return;
    const assignments = [row.Montag, row.Dienstag, row.Mittwoch, row.Donnerstag, row.Freitag];
    assignments.forEach((value, index) => {
      const assignment = parseAssignment(value);
      cells.push({ employeeId: employee.id, weekId: week.id, dayIndex: index, value: assignment });
    });
  });
  return cells;
};

export const parseXlsx = async (
  file: File,
  employees: Employee[],
  weeks: Week[],
): Promise<RosterCell[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<ParsedRow>(worksheet);
  const cells: RosterCell[] = [];
  rows.forEach((row) => {
    const employee = employees.find((emp) => emp.name === row.Name);
    if (!employee) return;
    const weekNumber = row.KW.replace(/[^0-9]/g, '');
    const week = weeks.find((wk) => wk.kw === Number(weekNumber));
    if (!week) return;
    const assignments = [row.Montag ?? '', row.Dienstag ?? '', row.Mittwoch ?? '', row.Donnerstag ?? '', row.Freitag ?? ''];
    assignments.forEach((value, index) => {
      const assignment = parseAssignment(value ?? '');
      cells.push({ employeeId: employee.id, weekId: week.id, dayIndex: index, value: assignment });
    });
  });
  return cells;
};
