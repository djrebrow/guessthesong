import { useTranslation } from 'react-i18next';

interface SettingsPanelProps {
  highContrast: boolean;
  fontScale: number;
  dateFormat: 'D.M.YYYY' | 'DD.MM.YYYY';
  autoHolidayMarking: boolean;
  bundesland: 'NI';
  onToggleContrast: () => void;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  onToggleDateFormat: () => void;
  onToggleHolidayMarking: (value: boolean) => void;
  onBundeslandChange: (bundesland: 'NI') => void;
}

const SettingsPanel = ({
  highContrast,
  fontScale,
  dateFormat,
  autoHolidayMarking,
  bundesland,
  onToggleContrast,
  onIncreaseFont,
  onDecreaseFont,
  onToggleDateFormat,
  onToggleHolidayMarking,
  onBundeslandChange,
}: SettingsPanelProps) => {
  const { t } = useTranslation();
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white/80 px-4 py-3 shadow-sm backdrop-blur print:hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{t('app.settings.title')}</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onToggleContrast}
          className={`rounded border px-3 py-1 font-semibold transition ${
            highContrast ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          {t('app.settings.contrast')}
        </button>
        <div className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1">
          <span className="text-xs font-semibold text-slate-500">{Math.round(fontScale * 100)}%</span>
          <button
            type="button"
            onClick={onDecreaseFont}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {t('app.settings.fontDown')}
          </button>
          <button
            type="button"
            onClick={onIncreaseFont}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {t('app.settings.fontUp')}
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleDateFormat}
          className="rounded border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {t('app.settings.dateFormat')}: {dateFormat}
        </button>
        <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={autoHolidayMarking}
            onChange={(event) => onToggleHolidayMarking(event.target.checked)}
            className="h-4 w-4"
          />
          {t('app.settings.autoHolidays')}
        </label>
        <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700">
          <span>{t('app.settings.region')}</span>
          <select
            value={bundesland}
            onChange={(event) => onBundeslandChange(event.target.value as 'NI')}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="NI">Niedersachsen</option>
          </select>
        </label>
      </div>
    </section>
  );
};

export default SettingsPanel;
