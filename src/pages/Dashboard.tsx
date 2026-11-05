import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import WorkoutCalendar from '../components/WorkoutCalendar';
import {
  weekWorkouts,
  workoutVolume,
  daysSinceLastWorkout,
  formatVolume,
  getCardioExerciseIds,
  workoutDisplayTitle,
  getInProgressWorkout,
} from '../utils/gymStats';

// Nombres literales: Tailwind descarta las clases de @layer components que no ve completas en el código.
const KPI_TINTS = ['ui-kpi-pastel-1', 'ui-kpi-pastel-2', 'ui-kpi-pastel-3', 'ui-kpi-pastel-4'];

function InProgressChip() {
  return (
    <span
      className="ui-label ui-label-xs px-1.5 py-0.5 rounded-pill shrink-0"
      style={{ color: 'var(--accent-text)', background: 'color-mix(in srgb, var(--header-color) 16%, transparent)' }}
    >
      En curso
    </span>
  );
}

export default function Dashboard() {
  const { workouts, exercises, muscleGroups, loading } = useData();

  const cardioExerciseIds = useMemo(
    () => getCardioExerciseIds(exercises, muscleGroups),
    [exercises, muscleGroups]
  );

  const thisWeekWorkouts = useMemo(() => weekWorkouts(workouts), [workouts]);

  const weeklyVolume = useMemo(() => {
    return thisWeekWorkouts.reduce((total, w) => total + workoutVolume(w, cardioExerciseIds), 0);
  }, [thisWeekWorkouts, cardioExerciseIds]);

  const daysSince = useMemo(() => daysSinceLastWorkout(workouts), [workouts]);

  const last5Workouts = useMemo(() => workouts.slice(0, 5), [workouts]);
  const inProgress = useMemo(() => getInProgressWorkout(workouts), [workouts]);

  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find((g) => g.id === muscleGroupId);
    return group?.name || '';
  };

  const getMuscleGroupColor = (muscleGroupId: string) => {
    const group = muscleGroups.find((g) => g.id === muscleGroupId);
    return group?.color || '#6b7280';
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Cargando">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[5.5rem] !rounded-[var(--radius-panel)]" />
          ))}
        </div>
        <Skeleton className="h-80 !rounded-[var(--radius-panel)]" />
        <Skeleton className="h-72 !rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Esta semana',
      value: String(thisWeekWorkouts.length),
      caption: thisWeekWorkouts.length === 1 ? 'entrenamiento' : 'entrenamientos',
    },
    { label: 'Volumen semanal', value: formatVolume(weeklyVolume), caption: 'total' },
    {
      label: 'Último',
      value: daysSince === null ? '—' : daysSince === 0 ? 'Hoy' : String(daysSince),
      caption:
        daysSince === null
          ? 'sin registros'
          : daysSince === 0
            ? 'entrenaste'
            : daysSince === 1
              ? 'día atrás'
              : 'días atrás',
    },
    { label: 'Total', value: String(workouts.length), caption: 'entrenamientos' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="ui-page-title">Dashboard</h1>
        <p className="ui-page-subtitle">Tu semana de entrenamiento de un vistazo.</p>
      </div>

      {inProgress && (
        <Link
          to={`/entrenamientos/${inProgress.id}`}
          className="ui-panel p-4 sm:p-5 flex items-center justify-between gap-3"
          style={{
            background: 'color-mix(in srgb, var(--header-color) 14%, var(--surface))',
            boxShadow: 'inset 4px 0 0 var(--header-color)',
          }}
        >
          <div className="min-w-0">
            <div className="ui-label ui-label-sm" style={{ color: 'var(--accent-text)' }}>
              Entrenamiento en curso
            </div>
            <div className="font-semibold text-[var(--text)] truncate">
              {workoutDisplayTitle(inProgress, exercises, muscleGroups)}
            </div>
            <div className="ui-caption">
              {inProgress.exercises.length} {inProgress.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} cargados
            </div>
          </div>
          <span className="ui-btn ui-btn-primary shrink-0">Continuar</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`ui-kpi ${KPI_TINTS[i]}`}>
            <div className="ui-kpi-label">{kpi.label}</div>
            <div className="ui-kpi-value">{kpi.value}</div>
            <div className="ui-caption">{kpi.caption}</div>
          </div>
        ))}
      </div>

      <div className="ui-panel p-4 sm:p-6">
        <WorkoutCalendar workouts={workouts} exercises={exercises} muscleGroups={muscleGroups} />
      </div>

      <div className="ui-panel p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ui-label ui-label-lg">Últimos entrenamientos</h2>
          {workouts.length > 5 && (
            <Link to="/entrenamientos" className="ui-link-btn">
              Ver todos
            </Link>
          )}
        </div>

        {last5Workouts.length === 0 ? (
          <EmptyState
            title="Todavía no hay entrenamientos"
            description="Registrá tu primera sesión para empezar a ver tus estadísticas."
            action={
              <Link to="/entrenamientos/nuevo" className="ui-btn ui-btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar entrenamiento
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {last5Workouts.map((workout) => {
              const volume = workoutVolume(workout, cardioExerciseIds);
              const exerciseCount = workout.exercises.length;
              const uniqueMuscleGroups = [
                ...new Set(
                  workout.exercises
                    .map((e) => exercises.find((ex) => ex.id === e.exerciseId)?.muscleGroupId)
                    .filter(Boolean)
                ),
              ] as string[];

              return (
                <Link key={workout.id} to={`/entrenamientos/${workout.id}`} className="ui-list-item block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--text)] truncate">
                          {workoutDisplayTitle(workout, exercises, muscleGroups)}
                        </span>
                        {workout.status === 'in_progress' && <InProgressChip />}
                        <span className="ui-caption shrink-0">
                          {new Date(workout.date + 'T12:00:00').toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {uniqueMuscleGroups.slice(0, 3).map((groupId) => (
                          <span
                            key={groupId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getMuscleGroupColor(groupId) }}
                          >
                            {getMuscleGroupName(groupId)}
                          </span>
                        ))}
                        {uniqueMuscleGroups.length > 3 && (
                          <span className="ui-caption">+{uniqueMuscleGroups.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                        <span>{exerciseCount} ejercicios</span>
                        <span>{formatVolume(volume)}</span>
                        {workout.durationMinutes && <span>{workout.durationMinutes} min</span>}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-[var(--text-muted)] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Fallback si el pack inicial no se pudo cargar */}
      {(muscleGroups.length === 0 || exercises.length === 0) && (
        <div className="ui-panel p-4 sm:p-6">
          <h2 className="ui-label ui-label-lg mb-3">Configuración inicial</h2>
          <p className="ui-caption mb-4">
            Los usuarios nuevos reciben un pack de grupos y ejercicios automáticamente. Si no aparecen, crealos en Gestión.
          </p>
          <Link to="/gestion" className="ui-btn ui-btn-secondary">
            Ir a Gestión
          </Link>
        </div>
      )}
    </div>
  );
}
