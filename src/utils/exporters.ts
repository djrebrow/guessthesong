import { utils, writeFileXLSX } from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RosterCell, Week, Employee, DayAssignment } from '../types';
import { formatDate, nowDateTimeString } from './date';

interface ExportRow {
  KW: string;
  Datum: string;
  Name: string;
  Montag: DayAssignment | '';
  Dienstag: DayAssignment | '';
  Mittwoch: DayAssignment | '';
  Donnerstag: DayAssignment | '';
  Freitag: DayAssignment | '';
}

const buildRows = (weeks: Week[], employees: Employee[], cells: RosterCell[], dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY'): ExportRow[] => {
  return weeks.flatMap((week) => {
    return employees.map((employee) => {
      const row: ExportRow = {
        KW: `KW ${week.kw}`,
        Datum: `${formatDate(week.start, dateFormat)}-${formatDate(week.end, dateFormat)}`,
        Name: employee.name,
        Montag: '',
        Dienstag: '',
        Mittwoch: '',
        Donnerstag: '',
        Freitag: '',
      };
      week.days.forEach((_, index) => {
        const cell = cells.find(
          (c) => c.employeeId === employee.id && c.weekId === week.id && c.dayIndex === index,
        );
        const value = cell?.value ?? '';
        switch (index) {
          case 0:
            row.Montag = value as DayAssignment | '';
            break;
          case 1:
            row.Dienstag = value as DayAssignment | '';
            break;
          case 2:
            row.Mittwoch = value as DayAssignment | '';
            break;
          case 3:
            row.Donnerstag = value as DayAssignment | '';
            break;
          case 4:
            row.Freitag = value as DayAssignment | '';
            break;
        }
      });
      return row;
    });
  });
};

export const exportToCsv = (
  weeks: Week[],
  employees: Employee[],
  cells: RosterCell[],
  dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY',
): string => {
  const rows = buildRows(weeks, employees, cells, dateFormat);
  return Papa.unparse(rows, { quotes: true, delimiter: ';' });
};

export const exportToXlsx = (
  weeks: Week[],
  employees: Employee[],
  cells: RosterCell[],
  dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY',
  filename = 'dienstplan.xlsx',
): void => {
  const rows = buildRows(weeks, employees, cells, dateFormat);
  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Dienstplan');
  writeFileXLSX(workbook, filename);
};

export const exportElementToPdf = async (element: HTMLElement, filename = 'dienstplan.pdf') => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.setFontSize(10);
  pdf.text(`Exportiert am ${nowDateTimeString()}`, 40, 30);
  pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
  pdf.save(filename);
};
