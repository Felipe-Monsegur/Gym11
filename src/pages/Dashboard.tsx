import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { weekWorkouts, workoutVolume, daysSinceLastWorkout, formatVolume, DEFAULT_WEEKLY_GOAL } from '../utils/gymStats';

export default function Dashboard() {
  const { workouts, exercises, muscleGroups, loading } = useData();
  const { theme, headerColor } = useTheme();

  const thisWeekWorkouts = useMemo(() => weekWorkouts(workouts), [workouts]);

  const weeklyVolume = useMemo(() => {
    return thisWeekWorkouts.reduce((total, w) => total + workoutVolume(w), 0);
  }, [thisWeekWorkouts]);

  const daysSince = useMemo(() => daysSinceLastWorkout(workouts), [workouts]);
  const weeklyGoal = DEFAULT_WEEKLY_GOAL;

  const last5Workouts = useMemo(() => workouts.slice(0, 5), [workouts]);

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
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Dashboard
        </h1>
        <Link
          to="/entrenamientos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: headerColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Entrenar</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="ui-panel p-4">
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Meta semanal</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            {thisWeekWorkouts.length}
            <span className="text-lg sm:text-xl font-semibold text-[var(--text-muted)]">/{weeklyGoal}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {thisWeekWorkouts.length >= weeklyGoal ? 'cumplida' : 'entrenamientos'}
          </div>
        </div>

        <div className="ui-panel p-4">
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Volumen semanal</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            {formatVolume(weeklyVolume)}
          </div>
          <div className="text-xs text-[var(--text-muted)]">total</div>
        </div>

        <div className="ui-panel p-4">
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Último</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            {daysSince === null ? '—' : daysSince === 0 ? 'Hoy' : daysSince}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {daysSince === null
              ? 'sin registros'
              : daysSince === 0
                ? 'entrenaste'
                : daysSince === 1
                  ? 'día atrás'
                  : 'días atrás'}
          </div>
        </div>

        <div className="ui-panel p-4">
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Total</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            {workouts.length}
          </div>
          <div className="text-xs text-[var(--text-muted)]">entrenamientos</div>
        </div>
      </div>

      {/* Last 5 Workouts */}
      <div className="ui-panel p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ui-label ui-label-lg">Últimos entrenamientos</h2>
          {workouts.length > 5 && (
            <Link
              to="/entrenamientos"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: headerColor }}
            >
              Ver todos
            </Link>
          )}
        </div>

        {last5Workouts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[var(--text-muted)] mb-4">No tenés entrenamientos registrados</div>
            <Link
              to="/entrenamientos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: headerColor }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar primer entrenamiento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {last5Workouts.map((workout) => {
              const volume = workoutVolume(workout);
              const exerciseCount = workout.exercises.length;
              const uniqueMuscleGroups = [
                ...new Set(
                  workout.exercises
                    .map((e) => {
                      const ex = exercises.find((ex) => ex.id === e.exerciseId);
                      return ex?.muscleGroupId;
                    })
                    .filter(Boolean)
                ),
              ];

              return (
                <Link
                  key={workout.id}
                  to={`/entrenamientos/${workout.id}`}
                  className="ui-list-item block p-4 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--text)] truncate">
                          {workout.title}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] shrink-0">
                          {new Date(workout.date).toLocaleDateString('es-AR', {
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
                            style={{ backgroundColor: getMuscleGroupColor(groupId as string) }}
                          >
                            {getMuscleGroupName(groupId as string)}
                          </span>
                        ))}
                        {uniqueMuscleGroups.length > 3 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            +{uniqueMuscleGroups.length - 3}
                          </span>
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

      {/* Quick Setup */}
      {(muscleGroups.length === 0 || exercises.length === 0) && (
        <div className="ui-panel p-4 sm:p-6 border-2 border-dashed border-[var(--border-strong)]">
          <h2 className="ui-label ui-label-lg mb-3">Configuración inicial</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Para empezar a registrar entrenamientos, primero necesitás crear algunos grupos musculares y ejercicios.
          </p>
          <div className="flex flex-wrap gap-2">
            {muscleGroups.length === 0 && (
              <Link
                to="/gestion"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 bg-blue-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear grupos musculares
              </Link>
            )}
            {muscleGroups.length > 0 && exercises.length === 0 && (
              <Link
                to="/gestion"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 bg-green-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear ejercicios
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
