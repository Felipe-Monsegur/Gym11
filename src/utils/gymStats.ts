import { Workout, WorkoutExercise } from '../types';

export function workoutVolume(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.reps * set.weight);
    }, 0);
  }, 0);
}

export function exerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((total, set) => total + (set.reps * set.weight), 0);
}

export function weekWorkouts(workouts: Workout[], referenceDate: Date = new Date()): Workout[] {
  const startOfWeek = new Date(referenceDate);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return workouts.filter((w) => {
    const d = new Date(w.date);
    return d >= startOfWeek && d < endOfWeek;
  });
}

export function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  const sortedDates = [...new Set(workouts.map((w) => w.date))].sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    if (sortedDates[i] === prevDateStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

/** Días desde el último entrenamiento (null si no hay ninguno). */
export function daysSinceLastWorkout(workouts: Workout[], referenceDate: Date = new Date()): number | null {
  if (workouts.length === 0) return null;
  const latest = [...workouts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
  const last = new Date(latest.date + 'T12:00:00');
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  const diffMs = today.getTime() - last.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/** Meta semanal por defecto para quien entrena 3–4 veces por semana. */
export const DEFAULT_WEEKLY_GOAL = 4;

export function maxWeightByExercise(
  workouts: Workout[]
): Map<string, { weight: number; reps: number; date: string }> {
  const result = new Map<string, { weight: number; reps: number; date: string }>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        const current = result.get(exercise.exerciseId);
        if (!current || set.weight > current.weight) {
          result.set(exercise.exerciseId, {
            weight: set.weight,
            reps: set.reps,
            date: workout.date,
          });
        }
      }
    }
  }

  return result;
}

export function monthlyVolume(workouts: Workout[], year: number, month: number): number {
  return workouts
    .filter((w) => {
      const d = new Date(w.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((total, w) => total + workoutVolume(w), 0);
}

export function getMonthlyVolumeData(workouts: Workout[], monthsBack: number = 6): { month: string; volume: number }[] {
  const result: { month: string; volume: number }[] = [];
  const today = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleDateString('es-AR', { month: 'short' });
    const volume = monthlyVolume(workouts, d.getFullYear(), d.getMonth());
    result.push({ month: monthName, volume });
  }

  return result;
}

/** Inicio de semana (lunes) en YYYY-MM-DD, mediodía local para evitar desfaces. */
function startOfWeekMonday(reference: Date): Date {
  const d = new Date(reference);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Entrenamientos por semana (últimas `weeksBack` semanas, lunes–domingo). */
export function getWeeklyWorkoutCounts(
  workouts: Workout[],
  weeksBack: number = 12
): { week: string; weekKey: string; count: number }[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisWeekStart = startOfWeekMonday(today);

  const counts = new Map<string, number>();
  for (const w of workouts) {
    const workoutDay = new Date(w.date + 'T12:00:00');
    const weekStart = startOfWeekMonday(workoutDay);
    const key = toDateKey(weekStart);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const result: { week: string; weekKey: string; count: number }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const key = toDateKey(weekStart);
    const label = weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    result.push({
      week: label,
      weekKey: key,
      count: counts.get(key) || 0,
    });
  }

  return result;
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${kg.toFixed(0)} kg`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M kg`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${volume.toFixed(0)} kg`;
}
