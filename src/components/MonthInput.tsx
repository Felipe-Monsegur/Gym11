import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { getTodayMonthString, isIOSDevice } from '../utils/date';

type MonthInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  allowClear?: boolean;
  id?: string;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i);

function parseMonthValue(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  try {
    const d = parseISO(`${value}-01`);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function MonthInput({
  value,
  onChange,
  className = '',
  required = false,
  allowClear = true,
  id,
}: MonthInputProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [useNative] = useState(() => isIOSDevice());
  const selected = useMemo(() => parseMonthValue(value), [value]);
  const [viewYear, setViewYear] = useState(() => (selected ?? parseISO(`${getTodayMonthString()}-01`)).getFullYear());

  useEffect(() => {
    if (open) {
      setViewYear((selected ?? parseISO(`${getTodayMonthString()}-01`)).getFullYear());
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

  const todayMonth = getTodayMonthString();
  const display = selected
    ? format(selected, 'MMMM yyyy', { locale: es })
    : 'Elegir mes';

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
      <div className="month-native-wrap">
        <input
          id={id}
          type="month"
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
        className={`w-full max-w-full min-w-0 text-left flex items-center justify-between gap-2 capitalize ${className}`}
      >
        <span className={!selected ? muted : undefined}>{display}</span>
        <svg className={`w-4 h-4 shrink-0 ${muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

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
          aria-label="Selector de mes"
          className={`absolute left-0 z-50 mt-1 w-[min(100%,18.5rem)] rounded-xl border p-3 ${panel}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className={`p-1.5 rounded-lg ${dayHover}`}
              aria-label="Año anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-semibold">{viewYear}</div>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className={`p-1.5 rounded-lg ${dayHover}`}
              aria-label="Año siguiente"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((monthIndex) => {
              const monthValue = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`;
              const labelDate = parseISO(`${monthValue}-01`);
              const isSelected = value === monthValue;
              const isToday = todayMonth === monthValue;
              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                  }}
                  className={[
                    'h-9 rounded-lg text-sm capitalize transition-colors',
                    isSelected ? selectedDay : dayHover,
                    !isSelected && isToday ? todayRing : '',
                  ].join(' ')}
                >
                  {format(labelDate, 'MMM', { locale: es })}
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
                const current = getTodayMonthString();
                onChange(current);
                setViewYear(parseISO(`${current}-01`).getFullYear());
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
