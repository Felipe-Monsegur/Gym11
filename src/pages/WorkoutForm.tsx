import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addWorkout, updateWorkout } from '../services/firebaseService';
import { WorkoutExercise, WorkoutSet } from '../types';
import Modal from '../components/Modal';

interface WorkoutExerciseForm extends WorkoutExercise {
  tempId: string;
}

export default function WorkoutForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workouts, exercises, muscleGroups, loading, refresh } = useData();
  const { theme, headerColor } = useTheme();
  const { showToast } = useToast();

  const isEditing = !!id;
  const existingWorkout = useMemo(
    () => (id ? workouts.find((w) => w.id === id) : null),
    [id, workouts]
  );

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseForm[]>([]);
  const [saving, setSaving] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [exerciseSearch, setExerciseSearch] = useState('');

  useEffect(() => {
    if (existingWorkout) {
      setDate(existingWorkout.date);
      setTitle(existingWorkout.title);
      setNotes(existingWorkout.notes || '');
      setDurationMinutes(existingWorkout.durationMinutes || '');
      setWorkoutExercises(
        existingWorkout.exercises.map((e, i) => ({
          ...e,
          tempId: `existing-${i}`,
        }))
      );
    }
  }, [existingWorkout]);

  const filteredExercises = useMemo(() => {
    let filtered = exercises;
    if (selectedMuscleGroup) {
      filtered = filtered.filter((e) => e.muscleGroupId === selectedMuscleGroup);
    }
    if (exerciseSearch) {
      const q = exerciseSearch.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [exercises, selectedMuscleGroup, exerciseSearch]);

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.name || 'Ejercicio desconocido';
  };

  const getExerciseColor = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.color || '#6b7280';
  };

  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find((g) => g.id === muscleGroupId);
    return group?.name || '';
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: WorkoutExerciseForm = {
      tempId: `new-${Date.now()}`,
      exerciseId,
      sets: [{ reps: 10, weight: 0, completed: false }],
      notes: '',
    };
    setWorkoutExercises([...workoutExercises, newExercise]);
    setShowExerciseModal(false);
    setExerciseSearch('');
    setSelectedMuscleGroup('');
  };

  const removeExercise = (tempId: string) => {
    setWorkoutExercises(workoutExercises.filter((e) => e.tempId !== tempId));
  };

  const addSet = (tempId: string) => {
    setWorkoutExercises(
      workoutExercises.map((e) => {
        if (e.tempId === tempId) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [
              ...e.sets,
              { reps: lastSet?.reps || 10, weight: lastSet?.weight || 0, completed: false },
            ],
          };
        }
        return e;
      })
    );
  };

  const removeSet = (tempId: string, setIndex: number) => {
    setWorkoutExercises(
      workoutExercises.map((e) => {
        if (e.tempId === tempId && e.sets.length > 1) {
          return {
            ...e,
            sets: e.sets.filter((_, i) => i !== setIndex),
          };
        }
        return e;
      })
    );
  };

  const updateSet = (tempId: string, setIndex: number, field: keyof WorkoutSet, value: number | boolean) => {
    setWorkoutExercises(
      workoutExercises.map((e) => {
        if (e.tempId === tempId) {
          return {
            ...e,
            sets: e.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
          };
        }
        return e;
      })
    );
  };

  const updateExerciseNotes = (tempId: string, notes: string) => {
    setWorkoutExercises(
      workoutExercises.map((e) => (e.tempId === tempId ? { ...e, notes } : e))
    );
  };

  const moveExercise = (tempId: string, direction: 'up' | 'down') => {
    const idx = workoutExercises.findIndex((e) => e.tempId === tempId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= workoutExercises.length) return;

    const newList = [...workoutExercises];
    [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
    setWorkoutExercises(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      showToast('Ingresá un título para el entrenamiento', 'warning');
      return;
    }

    if (workoutExercises.length === 0) {
      showToast('Agregá al menos un ejercicio', 'warning');
      return;
    }

    setSaving(true);
    try {
      const workoutData = {
        date,
        title: title.trim(),
        notes: notes.trim() || undefined,
        durationMinutes: durationMinutes || undefined,
        exercises: workoutExercises.map(({ exerciseId, sets, notes }) => ({
          exerciseId,
          sets,
          notes: notes || undefined,
        })),
        userId: user.uid,
      };

      if (isEditing && id) {
        await updateWorkout(id, workoutData);
        showToast('Entrenamiento actualizado', 'success');
      } else {
        await addWorkout(workoutData);
        showToast('Entrenamiento guardado', 'success');
      }
      await refresh();
      navigate('/entrenamientos');
    } catch (error) {
      console.error(error);
      showToast('Error al guardar entrenamiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (isEditing && !existingWorkout && !loading) {
    return (
      <div className="text-center py-20">
        <div className="text-[var(--text-muted)] mb-4">Entrenamiento no encontrado</div>
        <button
          type="button"
          onClick={() => navigate('/entrenamientos')}
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: headerColor }}
        >
          Volver al historial
        </button>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false);
          setExerciseSearch('');
          setSelectedMuscleGroup('');
        }}
        title="Agregar ejercicio"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="text-xs">Buscar</label>
              <input
                type="text"
                placeholder="Nombre del ejercicio..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="ui-input text-sm"
                autoFocus
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs">Grupo muscular</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="ui-input text-sm"
              >
                <option value="">Todos</option>
                {muscleGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredExercises.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                No se encontraron ejercicios
              </p>
            ) : (
              filteredExercises.map((exercise) => {
                const alreadyAdded = workoutExercises.some((we) => we.exerciseId === exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addExerciseToWorkout(exercise.id)}
                    disabled={alreadyAdded}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      alreadyAdded
                        ? 'opacity-50 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'hover:bg-white/5'
                        : 'hover:bg-black/5'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: exercise.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text)] truncate">{exercise.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {getMuscleGroupName(exercise.muscleGroupId)}
                      </div>
                    </div>
                    {alreadyAdded && (
                      <span className="text-xs text-[var(--text-muted)]">Agregado</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {isEditing ? 'Editar entrenamiento' : 'Nuevo entrenamiento'}
          </h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Basic Info */}
        <div className="ui-panel p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ui-input"
                required
              />
            </div>
            <div className="form-group mb-0">
              <label>Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Piernas, Push, Full Body..."
                className="ui-input"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label>Duración (minutos, opcional)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="60"
                min="1"
                className="ui-input"
              />
            </div>
            <div className="form-group mb-0">
              <label>Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas generales..."
                className="ui-input"
              />
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="ui-panel p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="ui-label ui-label-lg">Ejercicios</h2>
            <button
              type="button"
              onClick={() => setShowExerciseModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: headerColor }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
          </div>

          {workoutExercises.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-[var(--border)] rounded-lg">
              <div className="text-[var(--text-muted)] mb-2">No hay ejercicios agregados</div>
              <button
                type="button"
                onClick={() => setShowExerciseModal(true)}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: headerColor }}
              >
                Agregar primer ejercicio
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workoutExercises.map((we, exIndex) => (
                <div
                  key={we.tempId}
                  className="border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  {/* Exercise Header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-3"
                    style={{ backgroundColor: getExerciseColor(we.exerciseId) + '20' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveExercise(we.tempId, 'up')}
                          disabled={exIndex === 0}
                          className="text-xs px-1 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(we.tempId, 'down')}
                          disabled={exIndex === workoutExercises.length - 1}
                          className="text-xs px-1 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getExerciseColor(we.exerciseId) }}
                      />
                      <span className="font-semibold text-[var(--text)] truncate">
                        {getExerciseName(we.exerciseId)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(we.tempId)}
                      className={`p-1.5 rounded transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-red-500/20'
                          : 'text-red-600 hover:bg-red-100'
                      }`}
                      title="Quitar ejercicio"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-[var(--text-muted)] px-1">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-5">Peso (kg)</div>
                      <div className="col-span-2"></div>
                    </div>
                    {we.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-sm text-[var(--text-muted)]">{setIndex + 1}</div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(we.tempId, setIndex, 'reps', parseInt(e.target.value) || 0)
                            }
                            min="0"
                            className="ui-input text-sm py-1.5"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(we.tempId, setIndex, 'weight', parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.5"
                            className="ui-input text-sm py-1.5"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {we.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(we.tempId, setIndex)}
                              className={`p-1 rounded transition-colors ${
                                theme === 'dark'
                                  ? 'text-red-400 hover:bg-red-500/20'
                                  : 'text-red-600 hover:bg-red-100'
                              }`}
                              title="Quitar serie"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSet(we.tempId)}
                      className="w-full py-2 text-sm font-medium border border-dashed border-[var(--border)] rounded-lg transition-colors hover:border-[var(--border-strong)]"
                      style={{ color: headerColor }}
                    >
                      + Agregar serie
                    </button>

                    <div className="pt-2">
                      <input
                        type="text"
                        value={we.notes || ''}
                        onChange={(e) => updateExerciseNotes(we.tempId, e.target.value)}
                        placeholder="Notas del ejercicio (opcional)..."
                        className="ui-input text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: headerColor }}
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar entrenamiento'}
          </button>
        </div>
      </form>
    </>
  );
}
