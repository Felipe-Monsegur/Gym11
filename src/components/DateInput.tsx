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
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
  const dark = theme === 'dark';
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, useNative]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const today = parseISO(getTodayDateString());
  const display = selected ? format(selected, 'dd/MM/yyyy') : 'Elegir fecha';

  const panel = dark
    ? 'bg-gray-800 border-gray-600 text-gray-100 shadow-xl'
    : 'bg-white border-gray-200 text-gray-900 shadow-xl';
  const muted = dark ? 'text-gray-500' : 'text-gray-400';
  const dayHover = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const todayRing = dark ? 'ring-1 ring-sky-400/70' : 'ring-1 ring-sky-500/60';
  const selectedDay = 'bg-sky-500 text-white hover:bg-sky-500';
  const footerBtn = dark
    ? 'text-sky-400 hover:text-sky-300'
    : 'text-sky-600 hover:text-sky-700';

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
          className={`absolute left-0 z-50 mt-1 w-[min(100%,18.5rem)] rounded-xl border p-3 ${panel}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className={`p-1.5 rounded-lg ${dayHover}`}
              aria-label="Mes anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-semibold capitalize">
              {format(viewMonth, 'MMMM yyyy', { locale: es })}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className={`p-1.5 rounded-lg ${dayHover}`}
              aria-label="Mes siguiente"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`text-center text-[10px] font-semibold uppercase tracking-wide py-1 ${muted}`}>
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
                  onClick={() => {
                    onChange(format(day, 'yyyy-MM-dd'));
                    setOpen(false);
                  }}
                  className={[
                    'h-8 w-full rounded-lg text-sm transition-colors',
                    !inMonth ? muted : '',
                    isSelected ? selectedDay : dayHover,
                    !isSelected && isToday ? todayRing : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-600/40">
            {allowClear ? (
              <button
                type="button"
                className={`text-sm font-medium ${footerBtn}`}
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
              className={`text-sm font-medium ${footerBtn}`}
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
