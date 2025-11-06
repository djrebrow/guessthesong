import { useTranslation } from 'react-i18next';
import { DayAssignment } from '../types';
import { assignmentOptions } from '../lib/initialData';

const colorMap: Record<DayAssignment, string> = {
  Früh: 'bg-roster-early',
  Spät: 'bg-roster-late',
  Abwesend: 'bg-roster-absent',
  Feiertag: 'bg-roster-absent',
  Sonder: 'bg-roster-special',
  Connox: 'bg-roster-connox',
  Schmalgang: 'bg-roster-schmalgang',
  Außenlager: 'bg-roster-aussenlager',
  'Kleinteile/Konsi': 'bg-roster-kleinteile',
};

interface LegendProps {
  variant?: 'default' | 'compact';
}

const Legend = ({ variant = 'default' }: LegendProps) => {
  const { t } = useTranslation();
  return (
    <section
      className={`rounded-md bg-white/80 px-4 py-4 shadow-sm backdrop-blur ${
        variant === 'default' ? 'mt-6' : ''
      }`}
    >
      {variant === 'default' && (
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          {t('app.legend')}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-4">
        {assignmentOptions.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <span className={`inline-block h-4 w-4 rounded border border-slate-300 ${colorMap[option.id as DayAssignment]}`} />
            <span className="text-slate-700">{option.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Legend;
