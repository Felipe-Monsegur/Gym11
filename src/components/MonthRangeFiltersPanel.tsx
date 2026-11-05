import { useId, useMemo, useState } from 'react';
import MonthInput from './MonthInput';

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

function formatMonthLabel(value: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value || '—';
  const [year, month] = value.split('-');
  const idx = Number(month) - 1;
  return `${MONTH_SHORT[idx]} ${year}`;
}

type MonthRangeFiltersPanelProps = {
  selectedMonth: string;
  dateFrom: string;
  dateTo: string;
  onSelectedMonth: (value: string) => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  onClear: () => void;
};

export default function MonthRangeFiltersPanel({
  selectedMonth,
  dateFrom,
  dateTo,
  onSelectedMonth,
  onDateFrom,
  onDateTo,
  onClear,
}: MonthRangeFiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const summary = useMemo(() => {
    const mes = formatMonthLabel(selectedMonth);
    if (!dateFrom && !dateTo) {
      return `Mes: ${mes} · Sin rango (año del mes)`;
    }
    const from = dateFrom ? formatMonthLabel(dateFrom) : '—';
    const to = dateTo ? formatMonthLabel(dateTo) : '—';
    return `Mes: ${mes} · ${from}–${to}`;
  }, [selectedMonth, dateFrom, dateTo]);

  return (
    <div className="ui-panel p-3 sm:p-4">
      <div className="ui-options-toolbar">
        <button
          type="button"
          className={`ui-options-toggle ui-label ui-label-md ${open ? 'is-open' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="ui-options-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Filtros de fecha</span>
        </button>
        <span className="ui-options-summary" title="Configuración actual">
          {summary}
        </span>
      </div>

      {open && (
        <div className="ui-options-panel" id={panelId}>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 items-end">
            <div className="w-full form-group">
              <label>Mes</label>
              <MonthInput
                value={selectedMonth}
                onChange={onSelectedMonth}
                className="ui-input text-xs sm:text-sm"
              />
            </div>
            <div className="w-full form-group">
              <label>Desde</label>
              <MonthInput
                value={dateFrom}
                onChange={onDateFrom}
                className="ui-input text-xs sm:text-sm"
              />
            </div>
            <div className="w-full form-group">
              <label>Hasta</label>
              <MonthInput
                value={dateTo}
                onChange={onDateTo}
                className="ui-input text-xs sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-auto flex sm:justify-end">
              <button type="button" onClick={onClear} className="ui-options-clear-btn">
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
