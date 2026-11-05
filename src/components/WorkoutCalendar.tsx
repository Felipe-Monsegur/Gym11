import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise, MuscleGroup, Workout } from '../types';
import { toDateKey, workoutDisplayTitle } from '../utils/gymStats';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const FALLBACK_COLOR = '#6b7280';

interface Props {
  workouts: Workout[];
  exercises: Exercise[];
  muscleGroups: MuscleGroup[];
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

export default function WorkoutCalendar({ workouts, exercises, muscleGroups }: Props) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const currentMonth = firstOfMonth(today);

  const [viewMonth, setViewMonth] = useState<Date>(currentMonth);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const isCurrentMonth =
    viewMonth.getFullYear() === currentMonth.getFullYear() && viewMonth.getMonth() === currentMonth.getMonth();

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const list = map.get(w.date);
      if (list) list.push(w);
      else map.set(w.date, [w]);
    }
    return map;
  }, [workouts]);

  const colorsForWorkouts = useMemo(() => {
    const exerciseGroup = new Map(exercises.map((e) => [e.id, e.muscleGroupId]));
    const groupColor = new Map(muscleGroups.map((g) => [g.id, g.color]));
    return (list: Workout[]) => {
      const groupIds = new Set<string>();
      for (const w of list) {
        for (const e of w.exercises) {
          const gid = exerciseGroup.get(e.exerciseId);
          if (gid) groupIds.add(gid);
        }
      }
      const colors = [...groupIds].map((id) => groupColor.get(id) || FALLBACK_COLOR);
      return colors.length > 0 ? colors : [FALLBACK_COLOR];
    };
  }, [exercises, muscleGroups]);

  const { cells, monthWorkoutCount, monthDayCount } = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const offset = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();

    const result: ({ day: number; key: string; date: Date } | null)[] = Array(offset).fill(null);
    let wCount = 0;
    let dCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12);
      const key = toDateKey(date);
      const list = byDate.get(key);
      if (list) {
        wCount += list.length;
        dCount++;
      }
      result.push({ day, key, date });
    }
    return { cells: result, monthWorkoutCount: wCount, monthDayCount: dCount };
  }, [viewMonth, byDate]);

  const changeMonth = (delta: number) => {
    setSelectedKey(null);
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1, 12));
  };

  const goToday = () => {
    setSelectedKey(null);
    setViewMonth(currentMonth);
  };

  const monthLabel = viewMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const selectedWorkouts = selectedKey ? byDate.get(selectedKey) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="ui-label ui-label-lg">Calendario</h2>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button type="button" className="ui-link-btn mr-1" onClick={goToday}>
              Hoy
            </button>
          )}
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn-ghost"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="min-w-[9rem] text-center font-semibold text-[var(--text)] capitalize">{monthLabel}</span>
          <button
            type="button"
            className="ui-icon-btn ui-icon-btn-ghost"
            onClick={() => changeMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Mes siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="ui-caption font-medium py-1">
            {d}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} aria-hidden />;

          const list = byDate.get(cell.key);
          const isToday = cell.key === todayKey;
          const isFuture = cell.key > todayKey;
          const longDate = cell.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

          const base =
            'relative flex flex-col items-center justify-center gap-1 aspect-square sm:aspect-auto sm:h-14 rounded-[var(--radius-control)] text-sm transition-colors';
          const todayRing = isToday ? ' ring-2 ring-[var(--header-color)] ring-inset' : '';

          if (!list) {
            return (
              <div
                key={cell.key}
                className={`${base}${todayRing} ${isFuture ? 'text-[var(--text-muted)] opacity-50' : 'text-[var(--text-muted)]'}`}
                aria-label={`${longDate}, sin entrenamiento`}
              >
                <span>{cell.day}</span>
              </div>
            );
          }

          const colors = colorsForWorkouts(list);
          const inProgress = list.some((w) => w.status === 'in_progress');
          const isSelected = selectedKey === cell.key;
          const label = `${longDate}, ${list.length} ${list.length === 1 ? 'entrenamiento' : 'entrenamientos'}`;
          const activeClass = `${base}${todayRing} font-semibold text-[var(--text)] bg-[color-mix(in_srgb,var(--header-color)_14%,transparent)] hover:bg-[color-mix(in_srgb,var(--header-color)_24%,transparent)]${
            isSelected ? ' outline outline-2 outline-[var(--header-color)]' : ''
          }${inProgress ? ' border border-dashed border-[var(--header-color)]' : ''}`;

          const content = (
            <>
              <span>{cell.day}</span>
              <span className="flex gap-0.5" aria-hidden>
                {colors.slice(0, 3).map((c, idx) => (
                  <span key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
              {list.length > 1 && (
                <span className="absolute top-0.5 right-1 text-[10px] leading-none text-[var(--text-muted)]">
                  ×{list.length}
                </span>
              )}
            </>
          );

          return list.length === 1 ? (
            <Link key={cell.key} to={`/entrenamientos/${list[0].id}`} className={activeClass} aria-label={label}>
              {content}
            </Link>
          ) : (
            <button
              key={cell.key}
              type="button"
              className={activeClass}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => setSelectedKey(isSelected ? null : cell.key)}
            >
              {content}
            </button>
          );
        })}
      </div>

      {selectedWorkouts.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedWorkouts.map((w) => (
            <Link
              key={w.id}
              to={`/entrenamientos/${w.id}`}
              className="ui-list-item flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="font-medium text-[var(--text)] truncate">
                {workoutDisplayTitle(w, exercises, muscleGroups)}
              </span>
              <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      <p className="ui-caption mt-3">
        {monthWorkoutCount === 0
          ? 'Sin entrenamientos este mes'
          : `${monthWorkoutCount} ${monthWorkoutCount === 1 ? 'entrenamiento' : 'entrenamientos'} · ${monthDayCount} ${
              monthDayCount === 1 ? 'día' : 'días'
            }`}
      </p>
    </div>
  );
}
