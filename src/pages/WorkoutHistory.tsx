import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { deleteWorkout } from '../services/firebaseService';
import {
  workoutVolume,
  formatVolume,
  getCardioExerciseIds,
  workoutDisplayTitle,
} from '../utils/gymStats';
import ConfirmModal from '../components/ConfirmModal';
import DateInput from '../components/DateInput';
import CollapsibleOptionsPanel from '../components/CollapsibleOptionsPanel';
import PanelSkeleton from '../components/ui/PanelSkeleton';
import EmptyState from '../components/ui/EmptyState';

export default function WorkoutHistory() {
  const { workouts, exercises, muscleGroups, loading, refresh } = useData();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    workoutId: string;
    workoutTitle: string;
  }>({ isOpen: false, workoutId: '', workoutTitle: '' });

  const cardioExerciseIds = useMemo(
    () => getCardioExerciseIds(exercises, muscleGroups),
    [exercises, muscleGroups]
  );

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(q);
        const matchExercise = w.exercises.some((we) => {
          const ex = exercises.find((e) => e.id === we.exerciseId);
          return ex?.name.toLowerCase().includes(q);
        });
        if (!matchTitle && !matchExercise) return false;
      }
      if (dateFrom && w.date < dateFrom) return false;
      if (dateTo && w.date > dateTo) return false;
      return true;
    });
  }, [workouts, exercises, searchTerm, dateFrom, dateTo]);

  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find((g) => g.id === muscleGroupId);
    return group?.name || '';
  };

  const getMuscleGroupColor = (muscleGroupId: string) => {
    const group = muscleGroups.find((g) => g.id === muscleGroupId);
    return group?.color || '#6b7280';
  };

  const handleDelete = async () => {
    try {
      await deleteWorkout(confirmModal.workoutId);
      await refresh();
      showToast('Entrenamiento eliminado', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar entrenamiento', 'error');
    } finally {
      setConfirmModal({ isOpen: false, workoutId: '', workoutTitle: '' });
    }
  };

  const hasFilters = Boolean(searchTerm || dateFrom || dateTo);
  const filterSummary = hasFilters
    ? [searchTerm && `"${searchTerm}"`, dateFrom && `desde ${dateFrom}`, dateTo && `hasta ${dateTo}`]
        .filter(Boolean)
        .join(' · ')
    : 'Sin filtros';

  if (loading) {
    return (
      <PanelSkeleton />
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, workoutId: '', workoutTitle: '' })}
        onConfirm={handleDelete}
        title="Eliminar entrenamiento"
        message={`¿Eliminar "${confirmModal.workoutTitle}"? Esta acción no se puede deshacer.`}
        type="danger"
      />

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="ui-page-title">Historial</h1>
          <p className="ui-page-subtitle">
            {filteredWorkouts.length} de {workouts.length} entrenamientos
          </p>
        </div>

        <CollapsibleOptionsPanel title="Filtros" summary={filterSummary} defaultOpen={hasFilters}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="form-group mb-0">
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Título o ejercicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
              />
            </div>
            <div className="form-group mb-0">
              <label>Desde</label>
              <DateInput
                value={dateFrom}
                onChange={setDateFrom}
                className="ui-input"
                allowClear
              />
            </div>
            <div className="form-group mb-0">
              <label>Hasta</label>
              <DateInput
                value={dateTo}
                onChange={setDateTo}
                className="ui-input"
                allowClear
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="ui-options-clear-btn"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </CollapsibleOptionsPanel>

        {/* Workouts List */}
        <div className="ui-panel p-4 sm:p-6">
          {filteredWorkouts.length === 0 ? (
            <EmptyState
              title={workouts.length === 0 ? 'Todavía no hay entrenamientos' : 'No se encontraron entrenamientos'}
              description={
                workouts.length === 0
                  ? 'Registrá tu primera sesión para empezar el historial.'
                  : 'Probá con otros filtros.'
              }
              action={
                workouts.length === 0 ? (
                  <Link to="/entrenamientos/nuevo" className="ui-btn ui-btn-primary">
                    Registrar entrenamiento
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredWorkouts.map((workout) => {
                const volume = workoutVolume(workout, cardioExerciseIds);
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
                  <div
                    key={workout.id}
                    className="ui-list-item p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/entrenamientos/${workout.id}`}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[var(--text)] truncate">
                            {workoutDisplayTitle(workout, exercises, muscleGroups)}
                          </span>
                          {workout.status === 'in_progress' && (
                            <span
                              className="ui-label ui-label-xs px-1.5 py-0.5 rounded-pill shrink-0"
                              style={{
                                color: 'var(--accent-text)',
                                background: 'color-mix(in srgb, var(--header-color) 16%, transparent)',
                              }}
                            >
                              En curso
                            </span>
                          )}
                          <span className="ui-caption shrink-0">
                            {new Date(workout.date + 'T12:00:00').toLocaleDateString('es-AR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {uniqueMuscleGroups.slice(0, 4).map((groupId) => (
                            <span
                              key={groupId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getMuscleGroupColor(groupId as string) }}
                            >
                              {getMuscleGroupName(groupId as string)}
                            </span>
                          ))}
                          {uniqueMuscleGroups.length > 4 && (
                            <span className="text-xs text-[var(--text-muted)]">
                              +{uniqueMuscleGroups.length - 4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                          <span>{exerciseCount} ejercicios</span>
                          <span>{formatVolume(volume)}</span>
                          {workout.durationMinutes && <span>{workout.durationMinutes} min</span>}
                        </div>
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/entrenamientos/${workout.id}`}
                          className="ui-row-action is-edit"
                          title="Editar"
                          aria-label="Editar entrenamiento"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              workoutId: workout.id,
                              workoutTitle: workoutDisplayTitle(workout, exercises, muscleGroups),
                            })
                          }
                          className="ui-row-action is-delete"
                          title="Eliminar"
                          aria-label="Eliminar entrenamiento"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
