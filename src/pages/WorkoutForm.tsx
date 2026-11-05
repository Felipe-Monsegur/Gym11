import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  createWorkoutWithId,
  deleteWorkout,
  newWorkoutId,
  updateWorkout,
} from '../services/firebaseService';
import { Equipment, Workout, WorkoutExercise, WorkoutSet, WorkoutStatus } from '../types';
import { sortByDisplayOrder, sortExercisesByMuscleGroup } from '../utils/displayOrder';
import { defaultEquipmentFor, getInProgressWorkout } from '../utils/gymStats';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import DateInput from '../components/DateInput';
import PanelSkeleton from '../components/ui/PanelSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { getTodayDateString } from '../utils/date';

/** Las series se editan como texto: un campo vacío queda vacío (sin "0" adelante). */
interface FormSet {
  reps: string;
  weight: string;
  minutes: string;
  completed?: boolean;
}

interface FormExercise {
  tempId: string;
  exerciseId: string;
  equipment: Equipment;
  notes: string;
  sets: FormSet[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

const AUTOSAVE_DELAY_MS = 800;
/** Si el servidor no confirma en este tiempo, asumimos que no hay señal (queda en la caché local). */
const OFFLINE_HINT_MS = 4000;

const numToStr = (n?: number) => (n ? String(n) : '');
const cleanInt = (v: string) => v.replace(/\D/g, '');
const cleanDecimal = (v: string) => {
  const normalized = v.replace(',', '.').replace(/[^0-9.]/g, '');
  const [int, ...rest] = normalized.split('.');
  return rest.length ? `${int}.${rest.join('')}` : int;
};
const strToNum = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

let tempCounter = 0;
const nextTempId = () => `ex-${Date.now()}-${tempCounter++}`;

function toFormExercise(e: WorkoutExercise): FormExercise {
  return {
    tempId: nextTempId(),
    exerciseId: e.exerciseId,
    equipment: e.equipment ?? 'total',
    notes: e.notes || '',
    sets: e.sets.map((s) => ({
      reps: numToStr(s.reps),
      weight: numToStr(s.weight),
      minutes: numToStr(s.durationMinutes),
      completed: s.completed,
    })),
  };
}

function toWorkoutExercise(e: FormExercise, cardio: boolean): WorkoutExercise {
  return {
    exerciseId: e.exerciseId,
    notes: e.notes || undefined,
    equipment: cardio ? undefined : e.equipment,
    sets: e.sets.map((s) => {
      const set: WorkoutSet = { reps: strToNum(s.reps), weight: cardio ? 0 : strToNum(s.weight) };
      if (cardio) set.durationMinutes = strToNum(s.minutes);
      if (s.completed != null) set.completed = s.completed;
      return set;
    }),
  };
}

export default function WorkoutForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workouts, exercises, muscleGroups, loading, upsertWorkout, removeWorkout } = useData();
  const { showToast } = useToast();

  const existingWorkout = useMemo(() => (id ? workouts.find((w) => w.id === id) : undefined), [id, workouts]);
  const inProgress = useMemo(() => getInProgressWorkout(workouts), [workouts]);

  const [date, setDate] = useState(() => getTodayDateString());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<WorkoutStatus>('in_progress');
  const [items, setItems] = useState<FormExercise[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [finishing, setFinishing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [replacingTempId, setReplacingTempId] = useState<string | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Carga el entrenamiento una sola vez por id: los autoguardados actualizan `workouts`
  // y no deben pisar lo que se está escribiendo.
  const hydratedIdRef = useRef<string | null>(null);
  const lastSavedRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const creatingRef = useRef(false);
  const errorToastShownRef = useRef(false);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const groupById = useMemo(() => new Map(muscleGroups.map((g) => [g.id, g])), [muscleGroups]);

  const isCardioExercise = useCallback(
    (exerciseId: string) => {
      const ex = exerciseById.get(exerciseId);
      return ex ? groupById.get(ex.muscleGroupId)?.trackingMode === 'cardio' : false;
    },
    [exerciseById, groupById]
  );

  const getExerciseName = (exerciseId: string) => exerciseById.get(exerciseId)?.name || 'Ejercicio desconocido';
  const getExerciseColor = (exerciseId: string) => {
    const ex = exerciseById.get(exerciseId);
    if (!ex) return '#6b7280';
    return groupById.get(ex.muscleGroupId)?.color || ex.color || '#6b7280';
  };
  const getMuscleGroupName = (muscleGroupId: string) => groupById.get(muscleGroupId)?.name || '';

  const buildWorkoutData = useCallback(
    (overrideStatus?: WorkoutStatus): Omit<Workout, 'id' | 'createdAt'> => ({
      date,
      title: title.trim(),
      notes: notes.trim(),
      status: overrideStatus ?? status,
      exercises: items.map((e) => toWorkoutExercise(e, isCardioExercise(e.exerciseId))),
      userId: user?.uid ?? '',
    }),
    [date, title, notes, status, items, isCardioExercise, user]
  );

  useEffect(() => {
    if (!existingWorkout || hydratedIdRef.current === existingWorkout.id) return;
    hydratedIdRef.current = existingWorkout.id;
    setDate(existingWorkout.date);
    setTitle(existingWorkout.title);
    setNotes(existingWorkout.notes || '');
    setStatus(existingWorkout.status ?? 'done');
    setItems(existingWorkout.exercises.map(toFormExercise));
    lastSavedRef.current = '';
  }, [existingWorkout]);

  /** Espera la confirmación del servidor; si tarda, avisa que quedó guardado en el teléfono. */
  const trackWrite = useCallback((write: Promise<void>) => {
    setSaveState('saving');
    const offlineTimer = window.setTimeout(() => setSaveState('offline'), OFFLINE_HINT_MS);
    write
      .then(() => {
        setSaveState('saved');
        errorToastShownRef.current = false;
      })
      .catch((error) => {
        console.error(error);
        setSaveState('error');
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          showToast('No se pudo guardar. Se reintenta con el próximo cambio.', 'warning');
        }
        lastSavedRef.current = '';
      })
      .finally(() => window.clearTimeout(offlineTimer));
    return write;
  }, [showToast]);

  const saveNow = useCallback(
    (overrideStatus?: WorkoutStatus) => {
      if (!id || !existingWorkout || !user) return Promise.resolve();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const data = buildWorkoutData(overrideStatus);
      const json = JSON.stringify(data);
      if (json === lastSavedRef.current) return Promise.resolve();
      lastSavedRef.current = json;
      upsertWorkout({ ...existingWorkout, ...data, id });
      return trackWrite(updateWorkout(id, data));
    },
    [id, existingWorkout, user, buildWorkoutData, upsertWorkout, trackWrite]
  );

  // Nuevo: al agregar el primer ejercicio se crea el entrenamiento "en curso" y se pasa a su URL.
  useEffect(() => {
    if (id || !user || items.length === 0 || creatingRef.current) return;
    creatingRef.current = true;
    const newId = newWorkoutId();
    const data = buildWorkoutData('in_progress');
    upsertWorkout({ ...data, id: newId, createdAt: new Date().toISOString() });
    void trackWrite(createWorkoutWithId(newId, data));
    navigate(`/entrenamientos/${newId}`, { replace: true });
  }, [id, user, items.length, buildWorkoutData, upsertWorkout, trackWrite, navigate]);

  // Autoguardado con debounce ante cualquier cambio.
  useEffect(() => {
    if (!id || hydratedIdRef.current !== id) return;
    const json = JSON.stringify(buildWorkoutData());
    if (lastSavedRef.current === '') {
      // Primer render tras cargar: tomar como base, no guardar.
      lastSavedRef.current = json;
      return;
    }
    if (json === lastSavedRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
  }, [id, buildWorkoutData, saveNow]);

  // Al salir de la app (o de la página) se guarda lo pendiente sin esperar el debounce.
  const saveNowRef = useRef(saveNow);
  saveNowRef.current = saveNow;
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) void saveNowRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const filteredExercises = useMemo(() => {
    let filtered = sortExercisesByMuscleGroup(exercises, muscleGroups);
    if (selectedMuscleGroup) filtered = filtered.filter((e) => e.muscleGroupId === selectedMuscleGroup);
    if (exerciseSearch) {
      const q = exerciseSearch.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [exercises, muscleGroups, selectedMuscleGroup, exerciseSearch]);

  const muscleGroupsSorted = useMemo(() => sortByDisplayOrder(muscleGroups), [muscleGroups]);

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setReplacingTempId(null);
    setExerciseSearch('');
    setSelectedMuscleGroup('');
  };

  const openAddExerciseModal = () => {
    setReplacingTempId(null);
    setShowExerciseModal(true);
  };

  const openReplaceExerciseModal = (tempId: string) => {
    setReplacingTempId(tempId);
    setShowExerciseModal(true);
  };

  const emptySet = (): FormSet => ({ reps: '', weight: '', minutes: '' });

  const addOrReplaceExercise = (exerciseId: string) => {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    const equipment = defaultEquipmentFor(exerciseId, exercise.name, workouts, id);

    if (replacingTempId) {
      setItems((prev) =>
        prev.map((e) => {
          if (e.tempId !== replacingTempId) return e;
          const toCardio = isCardioExercise(exerciseId);
          const sets = e.sets.map((s) => (toCardio ? { ...s, weight: '' } : { ...s, minutes: '' }));
          return { ...e, exerciseId, equipment, sets };
        })
      );
    } else {
      setItems((prev) => [
        ...prev,
        { tempId: nextTempId(), exerciseId, equipment, notes: '', sets: [emptySet()] },
      ]);
    }
    closeExerciseModal();
  };

  const updateItem = (tempId: string, fn: (e: FormExercise) => FormExercise) =>
    setItems((prev) => prev.map((e) => (e.tempId === tempId ? fn(e) : e)));

  const removeExercise = (tempId: string) => setItems((prev) => prev.filter((e) => e.tempId !== tempId));

  // La serie nueva copia la anterior (lo habitual es repetir peso y reps).
  const addSet = (tempId: string) =>
    updateItem(tempId, (e) => {
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, last ? { reps: last.reps, weight: last.weight, minutes: last.minutes } : emptySet()] };
    });

  const removeSet = (tempId: string, setIndex: number) =>
    updateItem(tempId, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) } : e));

  const updateSet = (tempId: string, setIndex: number, field: keyof Omit<FormSet, 'completed'>, value: string) =>
    updateItem(tempId, (e) => ({
      ...e,
      sets: e.sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
    }));

  const moveExercise = (tempId: string, direction: 'up' | 'down') =>
    setItems((prev) => {
      const idx = prev.findIndex((e) => e.tempId === tempId);
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Agregá al menos un ejercicio', 'warning');
      return;
    }
    const wasInProgress = status === 'in_progress';
    setFinishing(true);
    setStatus('done');
    // No esperamos al servidor: sin señal queda en la caché y se sube al volver.
    void saveNow('done');
    showToast(wasInProgress ? 'Entrenamiento terminado' : 'Cambios guardados', 'success');
    navigate('/entrenamientos');
  };

  const handleDiscard = async () => {
    setConfirmDiscard(false);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (id) {
      removeWorkout(id);
      deleteWorkout(id).catch((error) => {
        console.error(error);
        showToast('No se pudo descartar el entrenamiento', 'error');
      });
    }
    showToast('Entrenamiento descartado', 'info');
    navigate('/');
  };

  if (loading) return <PanelSkeleton />;

  // Si ya hay uno en curso, "Nuevo" lleva a ese para no duplicar.
  if (!id && inProgress) return <Navigate to={`/entrenamientos/${inProgress.id}`} replace />;

  if (id && !existingWorkout) {
    return (
      <EmptyState
        title="Entrenamiento no encontrado"
        description="Puede que se haya eliminado."
        action={
          <button type="button" onClick={() => navigate('/entrenamientos')} className="ui-btn ui-btn-secondary">
            Volver al historial
          </button>
        }
      />
    );
  }

  const isInProgress = status === 'in_progress';
  const pageTitle = !id ? 'Nuevo entrenamiento' : isInProgress ? 'Entrenamiento en curso' : 'Editar entrenamiento';
  const saveLabel: Record<SaveState, string> = {
    idle: isInProgress ? 'Se guarda solo mientras cargás' : 'Los cambios se guardan solos',
    saving: 'Guardando…',
    saved: 'Guardado',
    offline: 'Sin señal: guardado en el teléfono, se sube al volver',
    error: 'No se pudo guardar',
  };

  const chipClass = (active: boolean) =>
    `ui-label ui-label-xs h-7 px-2.5 rounded-pill border transition-colors ${
      active
        ? 'bg-[var(--header-color)] border-transparent text-white'
        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
    }`;

  return (
    <>
      <ConfirmModal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Descartar entrenamiento"
        message="Se borra todo lo cargado en este entrenamiento. Esta acción no se puede deshacer."
        confirmText="Descartar"
        type="danger"
      />

      <Modal
        isOpen={showExerciseModal}
        onClose={closeExerciseModal}
        title={replacingTempId ? 'Cambiar ejercicio' : 'Agregar ejercicio'}
      >
        <div className="space-y-4">
          {replacingTempId && <p className="ui-caption">Se mantienen las series ya cargadas.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Nombre del ejercicio..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="ui-input"
              />
            </div>
            <div className="form-group mb-0">
              <label>Grupo muscular</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="ui-input"
              >
                <option value="">Todos</option>
                {muscleGroupsSorted.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {filteredExercises.length === 0 ? (
              <p className="ui-caption text-center py-4">No se encontraron ejercicios</p>
            ) : (
              filteredExercises.map((exercise) => {
                const currentId = replacingTempId
                  ? items.find((e) => e.tempId === replacingTempId)?.exerciseId
                  : null;
                const isCurrent = currentId === exercise.id;
                const disabled = items.some((e) => e.exerciseId === exercise.id) && !isCurrent;
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addOrReplaceExercise(exercise.id)}
                    disabled={disabled}
                    className={`ui-list-item w-full text-left p-3 flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getExerciseColor(exercise.id) }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text)] truncate">{exercise.name}</div>
                      <div className="ui-caption">{getMuscleGroupName(exercise.muscleGroupId)}</div>
                    </div>
                    {isCurrent && <span className="ui-caption">Actual</span>}
                    {disabled && <span className="ui-caption">Agregado</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <form onSubmit={handleFinish} className="space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="ui-page-title">{pageTitle}</h1>
            <p className="ui-page-subtitle" aria-live="polite">
              {id ? saveLabel[saveState] : 'Agregá el primer ejercicio y se empieza a guardar solo.'}
            </p>
          </div>
          {isInProgress ? (
            <button type="button" onClick={() => (id ? setConfirmDiscard(true) : navigate(-1))} className="ui-link-btn shrink-0">
              {id ? 'Descartar' : 'Cancelar'}
            </button>
          ) : (
            <button type="button" onClick={() => navigate(-1)} className="ui-link-btn shrink-0">
              Volver
            </button>
          )}
        </div>

        <div className="ui-panel p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label>Fecha</label>
              <DateInput value={date} onChange={setDate} className="ui-input" required allowClear={false} />
            </div>
            <div className="form-group mb-0">
              <label>Título (opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Piernas, Push, Full Body..."
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

        <div className="ui-panel p-4 sm:p-6">
          <h2 className="ui-label ui-label-lg mb-4">Ejercicios</h2>

          {items.length === 0 ? (
            <EmptyState
              title="No hay ejercicios agregados"
              description="Sumá el primero para empezar a cargar series."
              action={
                <button type="button" onClick={openAddExerciseModal} className="ui-btn ui-btn-primary">
                  Agregar ejercicio
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {items.map((item, exIndex) => {
                const color = getExerciseColor(item.exerciseId);
                const cardio = isCardioExercise(item.exerciseId);
                const weightLabel = item.equipment === 'dumbbell' ? 'Kg c/u' : 'Kg';
                return (
                  <div
                    key={item.tempId}
                    className="border border-[var(--border)] rounded-[var(--radius-control)] overflow-hidden bg-[var(--surface-2)]"
                  >
                    <div
                      className="px-3 sm:px-4 py-3 space-y-2"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 16%, var(--surface))`,
                        boxShadow: `inset 4px 0 0 ${color}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => moveExercise(item.tempId, 'up')}
                              disabled={exIndex === 0}
                              className="ui-link-btn !min-h-0 !px-1 text-xs disabled:opacity-30"
                              aria-label="Subir ejercicio"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExercise(item.tempId, 'down')}
                              disabled={exIndex === items.length - 1}
                              className="ui-link-btn !min-h-0 !px-1 text-xs disabled:opacity-30"
                              aria-label="Bajar ejercicio"
                            >
                              ↓
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => openReplaceExerciseModal(item.tempId)}
                            className="font-semibold text-[var(--text)] truncate text-left hover:underline underline-offset-2"
                            title="Cambiar ejercicio (conserva las series)"
                          >
                            {getExerciseName(item.exerciseId)}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openReplaceExerciseModal(item.tempId)}
                            className="ui-link-btn text-xs"
                            title="Cambiar ejercicio (conserva las series)"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExercise(item.tempId)}
                            className="ui-row-action is-delete"
                            title="Quitar ejercicio"
                            aria-label="Quitar ejercicio"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {!cardio && (
                        <div className="flex items-center gap-1.5 pl-7" role="group" aria-label="Equipamiento">
                          <button
                            type="button"
                            className={chipClass(item.equipment === 'total')}
                            aria-pressed={item.equipment === 'total'}
                            onClick={() => updateItem(item.tempId, (e) => ({ ...e, equipment: 'total' }))}
                          >
                            Barra / Máq.
                          </button>
                          <button
                            type="button"
                            className={chipClass(item.equipment === 'dumbbell')}
                            aria-pressed={item.equipment === 'dumbbell'}
                            onClick={() => updateItem(item.tempId, (e) => ({ ...e, equipment: 'dumbbell' }))}
                          >
                            Mancuernas
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="grid grid-cols-12 gap-2 ui-label ui-label-xs px-1">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Reps</div>
                        <div className="col-span-5">{cardio ? 'Minutos' : weightLabel}</div>
                        <div className="col-span-1" />
                      </div>
                      {item.sets.map((set, setIndex) => (
                        <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1 text-sm text-[var(--text-muted)]">{setIndex + 1}</div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              enterKeyHint="next"
                              value={set.reps}
                              placeholder="10"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateSet(item.tempId, setIndex, 'reps', cleanInt(e.target.value))}
                              className="ui-input"
                              aria-label={`Reps serie ${setIndex + 1}`}
                            />
                          </div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              inputMode="decimal"
                              enterKeyHint="done"
                              value={cardio ? set.minutes : set.weight}
                              placeholder={cardio ? 'min' : 'kg'}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateSet(item.tempId, setIndex, cardio ? 'minutes' : 'weight', cleanDecimal(e.target.value))
                              }
                              className="ui-input"
                              aria-label={`${cardio ? 'Minutos' : weightLabel} serie ${setIndex + 1}`}
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {item.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSet(item.tempId, setIndex)}
                                className="ui-row-action is-delete"
                                title="Quitar serie"
                                aria-label="Quitar serie"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addSet(item.tempId)} className="ui-btn ui-btn-secondary w-full">
                        + Agregar serie
                      </button>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateItem(item.tempId, (x) => ({ ...x, notes: e.target.value }))}
                        placeholder="Notas del ejercicio (opcional)..."
                        className="ui-input"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex justify-end mt-4">
              <button type="button" onClick={openAddExerciseModal} className="ui-btn ui-btn-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar ejercicio
              </button>
            </div>
          )}
        </div>

        {id && (
          <button
            type="submit"
            disabled={finishing}
            className="ui-btn ui-btn-primary ui-btn-submit w-full !min-h-[3rem]"
          >
            {isInProgress ? 'Terminar entrenamiento' : 'Listo'}
          </button>
        )}
      </form>
    </>
  );
}
