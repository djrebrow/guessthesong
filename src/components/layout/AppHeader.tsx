import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  mode: 'view' | 'admin';
  onExportCsv: () => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
  onImport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPrint: () => void;
  onManageEmployees?: () => void;
  onOpenCalendarBase?: () => void;
  onNavigateAdmin?: () => void;
  onNavigatePublic?: () => void;
}

const AppHeader = ({
  mode,
  onExportCsv,
  onExportXlsx,
  onExportPdf,
  onImport,
  onUndo,
  onRedo,
  onPrint,
  onManageEmployees,
  onOpenCalendarBase,
  onNavigateAdmin,
  onNavigatePublic,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 bg-roster-header text-slate-900 shadow-sm print:hidden">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wide">{t('app.title')}</h1>
          <p className="text-sm font-medium uppercase tracking-widest text-slate-700">
            {t('app.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'admin' ? (
            <>
              {onNavigatePublic && (
                <button
                  type="button"
                  onClick={onNavigatePublic}
                  className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  {t('app.actions.leaveAdmin')}
                </button>
              )}
              {onManageEmployees && (
                <button
                  type="button"
                  onClick={onManageEmployees}
                  className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Mitarbeiter verwalten
                </button>
              )}
              {onOpenCalendarBase && (
                <button
                  type="button"
                  onClick={onOpenCalendarBase}
                  className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Kalenderbasis
                </button>
              )}
              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  {t('app.actions.undo')}
                </button>
              )}
              {onRedo && (
                <button
                  type="button"
                  onClick={onRedo}
                  className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  {t('app.actions.redo')}
                </button>
              )}
              {onImport && (
                <button
                  type="button"
                  onClick={onImport}
                  className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t('app.actions.import')}
                </button>
              )}
            </>
          ) : (
            onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="rounded border border-orange-500 bg-white px-3 py-1 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
              >
                {t('app.actions.enterAdmin')}
              </button>
            )
          )}
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={onExportXlsx}
            className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {t('app.actions.print')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
