import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { deleteWorkout } from '../services/firebaseService';
import { workoutVolume, formatVolume, getCardioExerciseIds } from '../utils/gymStats';
import ConfirmModal from '../components/ConfirmModal';
import DateInput from '../components/DateInput';

export default function WorkoutHistory() {
  const { workouts, exercises, muscleGroups, loading, refresh } = useData();
  const { theme, headerColor } = useTheme();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
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
        <div className="flex items-center justify-between">
          <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Historial
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

        {/* Filters */}
        <div className="ui-panel p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="form-group mb-0">
              <label className="text-xs">Buscar</label>
              <input
                type="text"
                placeholder="Título o ejercicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input text-sm"
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs">Desde</label>
              <DateInput
                value={dateFrom}
                onChange={setDateFrom}
                className="ui-input text-sm"
                allowClear
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs">Hasta</label>
              <DateInput
                value={dateTo}
                onChange={setDateTo}
                className="ui-input text-sm"
                allowClear
              />
            </div>
          </div>
          {(searchTerm || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
              }}
              className="mt-3 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: headerColor }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Workouts List */}
        <div className="ui-panel p-4 sm:p-6">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[var(--text-muted)] mb-4">
                {workouts.length === 0
                  ? 'No tenés entrenamientos registrados'
                  : 'No se encontraron entrenamientos'}
              </div>
              {workouts.length === 0 && (
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
              )}
            </div>
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
                            {workout.title}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] shrink-0">
                            {new Date(workout.date).toLocaleDateString('es-AR', {
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
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'text-blue-400 hover:bg-blue-500/20'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              workoutId: workout.id,
                              workoutTitle: workout.title,
                            })
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="text-sm text-[var(--text-muted)] text-center">
          {filteredWorkouts.length} de {workouts.length} entrenamientos
        </div>
      </div>
    </>
  );
}
