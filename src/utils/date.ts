export const formatDate = (iso: string, format: 'D.M.YYYY' | 'DD.MM.YYYY'): string => {
  const date = new Date(iso + 'T00:00:00');
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (format === 'DD.MM.YYYY') {
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}.${mm}.${year}`;
  }
  return `${day}.${month}.${year}`;
};

export const formatWeekRange = (start: string, end: string, format: 'D.M.YYYY' | 'DD.MM.YYYY') => {
  return `${formatDate(start, format)} – ${formatDate(end, format)}`;
};

export const nowDateTimeString = () => {
  const now = new Date();
  return `${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE')}`;
};
