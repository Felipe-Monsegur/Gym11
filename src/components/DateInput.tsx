import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getTodayDateString, isIOSDevice } from '../utils/date';

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  allowClear?: boolean;
  id?: string;
};

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function parseValue(value: string): Date | null {
  if (!value) return null;
  try {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function DateInput({
  value,
  onChange,
  className = '',
  required = false,
  allowClear = true,
  id,
}: DateInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [useNative] = useState(() => isIOSDevice());
  const selected = useMemo(() => parseValue(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => selected ?? parseISO(getTodayDateString()));

  useEffect(() => {
    if (open) {
      setViewMonth(selected ?? parseISO(getTodayDateString()));
    }
  }, [open, selected]);

  useEffect(() => {
    if (!open || useNative) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // En captura: Escape cierra solo el calendario, no el modal que lo contiene
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, useNative]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const today = parseISO(getTodayDateString());
  const display = selected ? format(selected, 'dd/MM/yyyy') : 'Elegir fecha';

  const muted = 'text-[var(--text-muted)]';

  if (useNative) {
    return (
      <div className="date-native-wrap">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
          required={required}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-full min-w-0">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full max-w-full min-w-0 text-left flex items-center justify-between gap-2 ${className}`}
      >
        <span className={!selected ? muted : undefined}>{display}</span>
        <svg className={`w-4 h-4 shrink-0 ${muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Hidden input so native form required still works */}
      <input
        type="text"
        tabIndex={-1}
        aria-hidden
        required={required}
        value={value}
        onChange={() => {}}
        className="sr-only"
      />

      {open && (
        <div
          role="dialog"
          aria-label="Calendario"
          className="ui-popover absolute left-0 z-50 mt-1.5 w-[min(100%,19rem)] p-3"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="pl-1.5 text-[0.9375rem] font-semibold capitalize">
              {format(viewMonth, 'MMMM yyyy', { locale: es })}
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="ui-icon-btn ui-icon-btn-ghost !w-9 !h-9 !min-w-0 !min-h-0 !text-[var(--accent-text)]"
                aria-label="Mes anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="ui-icon-btn ui-icon-btn-ghost !w-9 !h-9 !min-w-0 !min-h-0 !text-[var(--accent-text)]"
                aria-label="Mes siguiente"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="ui-cal-weekday">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={format(day, "d 'de' MMMM yyyy", { locale: es })}
                  onClick={() => {
                    onChange(format(day, 'yyyy-MM-dd'));
                    setOpen(false);
                  }}
                  className={[
                    'ui-cal-cell',
                    !inMonth ? 'is-outside' : '',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="ui-popover-footer flex items-center justify-between mt-2 pt-2">
            {allowClear ? (
              <button
                type="button"
                className="ui-link-btn"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Borrar
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="ui-link-btn"
              onClick={() => {
                const todayStr = getTodayDateString();
                onChange(todayStr);
                setViewMonth(parseISO(todayStr));
                setOpen(false);
              }}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
