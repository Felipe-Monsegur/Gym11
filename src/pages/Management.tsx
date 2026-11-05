import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  addMuscleGroup,
  updateMuscleGroup,
  deleteMuscleGroup,
  reorderMuscleGroups,
  addExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
  ensureInitialPack,
  saveUserSettings,
  INITIAL_PACK_VERSION,
  listAccessRequests,
  approveAccessRequest,
  denyAccessRequest,
  getAllowedUsers,
  removeAllowedUser,
} from '../services/firebaseService';
import { sortByDisplayOrder, sortExercisesByMuscleGroup } from '../utils/displayOrder';
import { MuscleGroup, Exercise, AccessRequest, AllowedUser, TrackingMode } from '../types';
import Modal from '../components/Modal';
import HamburgerMenuDropdown from '../components/HamburgerMenuDropdown';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_COLOR = '#3b82f6';

const emptyMuscleGroupForm = () => ({
  name: '',
  color: DEFAULT_COLOR,
  trackingMode: 'strength' as TrackingMode,
});

type TabType = 'muscleGroups' | 'exercises' | 'access';

export default function Management() {
  const { muscleGroups, exercises, workouts, refresh } = useData();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { headerColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('muscleGroups');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [allowedUsersList, setAllowedUsersList] = useState<AllowedUser[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const [showMuscleGroupForm, setShowMuscleGroupForm] = useState(false);
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroup | null>(null);
  const [muscleGroupSearchTerm, setMuscleGroupSearchTerm] = useState('');
  const [muscleGroupFormData, setMuscleGroupFormData] = useState(emptyMuscleGroupForm);
  const [reorderingMuscleGroups, setReorderingMuscleGroups] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] = useState('');
  const [exerciseFormData, setExerciseFormData] = useState({
    name: '',
    muscleGroupId: '',
    notes: '',
  });

  const getGroupColor = (muscleGroupId: string) =>
    muscleGroups.find((g) => g.id === muscleGroupId)?.color || DEFAULT_COLOR;
  const [reorderingExercises, setReorderingExercises] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadAccessData = useCallback(async () => {
    if (!isAdmin) return;
    setAccessLoading(true);
    try {
      const [reqs, allowed] = await Promise.all([listAccessRequests(), getAllowedUsers()]);
      setAccessRequests(reqs);
      setAllowedUsersList(allowed);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los pedidos de acceso', 'error');
    } finally {
      setAccessLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (activeTab === 'access' && isAdmin) {
      void loadAccessData();
    }
  }, [activeTab, isAdmin, loadAccessData]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'access') {
      setActiveTab('muscleGroups');
    }
  }, [isAdmin, activeTab]);

  const handleApproveRequest = async (req: AccessRequest) => {
    try {
      await approveAccessRequest(req);
      showToast(`Acceso aprobado para ${req.email}`, 'success');
      await loadAccessData();
    } catch (error) {
      console.error(error);
      showToast('Error al aprobar acceso', 'error');
    }
  };

  const handleDenyRequest = async (req: AccessRequest) => {
    try {
      await denyAccessRequest(req.id);
      showToast(`Pedido rechazado: ${req.email}`, 'info');
      await loadAccessData();
    } catch (error) {
      console.error(error);
      showToast('Error al rechazar pedido', 'error');
    }
  };

  const handleRevokeUser = (allowed: AllowedUser) => {
    if (allowed.id === user?.uid || allowed.userId === user?.uid) {
      showToast('No podés revocar tu propio acceso', 'warning');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Revocar acceso',
      message: `¿Revocar acceso a ${allowed.email}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        try {
          await removeAllowedUser(allowed.userId || allowed.id);
          showToast('Acceso revocado', 'success');
          await loadAccessData();
        } catch (error) {
          console.error(error);
          showToast('Error al revocar acceso', 'error');
        }
      },
    });
  };

  const handleLoadInitialPack = async () => {
    if (!user) return;
    setLoadingPack(true);
    try {
      const result = await ensureInitialPack(user.uid);
      await saveUserSettings(user.uid, { initialPackVersion: INITIAL_PACK_VERSION });
      await refresh();
      const added = result.groupsAdded + result.exercisesAdded + result.groupsUpdated;
      const removed = result.groupsRemoved + result.exercisesRemoved;
      if (added === 0 && removed === 0) {
        showToast('Ya tenés el pack completo', 'info');
      } else {
        const parts: string[] = [];
        if (result.groupsAdded || result.exercisesAdded) {
          parts.push(`+${result.groupsAdded} grupos, +${result.exercisesAdded} ejercicios`);
        }
        if (removed) {
          parts.push(`−${removed} duplicados`);
        }
        showToast(`Pack: ${parts.join(' · ')}`, 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Error al cargar el pack inicial', 'error');
    } finally {
      setLoadingPack(false);
    }
  };

  // Muscle Groups handlers
  const handleMuscleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingMuscleGroup) {
        await updateMuscleGroup(editingMuscleGroup.id, muscleGroupFormData);
        if (muscleGroupFormData.color !== editingMuscleGroup.color) {
          const linked = exercises.filter((e) => e.muscleGroupId === editingMuscleGroup.id);
          await Promise.all(
            linked.map((e) => updateExercise(e.id, { color: muscleGroupFormData.color }))
          );
        }
      } else {
        const maxOrder = muscleGroups.reduce((m, g) => Math.max(m, g.sortOrder ?? -1), -1);
        await addMuscleGroup({
          ...muscleGroupFormData,
          userId: user.uid,
          sortOrder: maxOrder + 1,
        });
      }
      setShowMuscleGroupForm(false);
      setEditingMuscleGroup(null);
      setMuscleGroupFormData(emptyMuscleGroupForm());
      await refresh();
      showToast(editingMuscleGroup ? 'Grupo actualizado' : 'Grupo creado', 'success');
    } catch (error) {
      showToast('Error al guardar grupo muscular', 'error');
    }
  };

  const handleMuscleGroupEdit = (group: MuscleGroup) => {
    setEditingMuscleGroup(group);
    setMuscleGroupFormData({
      name: group.name,
      color: group.color,
      trackingMode: group.trackingMode === 'cardio' ? 'cardio' : 'strength',
    });
    setShowMuscleGroupForm(true);
  };

  const handleMuscleGroupDelete = async (id: string) => {
    const hasExercises = exercises.some((e) => e.muscleGroupId === id);
    if (hasExercises) {
      showToast('No se puede eliminar: tiene ejercicios asociados', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Eliminar grupo muscular',
      message: '¿Eliminar este grupo muscular? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        try {
          await deleteMuscleGroup(id);
          await refresh();
          showToast('Grupo eliminado', 'success');
        } catch (error) {
          showToast('Error al eliminar grupo', 'error');
        }
      },
    });
  };

  // Exercise handlers
  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!exerciseFormData.muscleGroupId) {
      showToast('Seleccioná un grupo muscular', 'warning');
      return;
    }

    try {
      const color = getGroupColor(exerciseFormData.muscleGroupId);
      const payload = { ...exerciseFormData, color };
      if (editingExercise) {
        await updateExercise(editingExercise.id, payload);
      } else {
        const maxOrder = exercises.reduce((m, e) => Math.max(m, e.sortOrder ?? -1), -1);
        await addExercise({
          ...payload,
          userId: user.uid,
          sortOrder: maxOrder + 1,
        });
      }
      setShowExerciseForm(false);
      setEditingExercise(null);
      setExerciseFormData({ name: '', muscleGroupId: '', notes: '' });
      await refresh();
      showToast(editingExercise ? 'Ejercicio actualizado' : 'Ejercicio creado', 'success');
    } catch (error) {
      showToast('Error al guardar ejercicio', 'error');
    }
  };

  const handleExerciseEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseFormData({
      name: exercise.name,
      muscleGroupId: exercise.muscleGroupId,
      notes: exercise.notes || '',
    });
    setShowExerciseForm(true);
  };

  const handleExerciseDelete = async (id: string) => {
    const usedInWorkout = workouts.some((w) =>
      w.exercises.some((we) => we.exerciseId === id)
    );
    if (usedInWorkout) {
      showToast('No se puede eliminar: se usa en entrenamientos', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Eliminar ejercicio',
      message: '¿Eliminar este ejercicio? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        try {
          await deleteExercise(id);
          await refresh();
          showToast('Ejercicio eliminado', 'success');
        } catch (error) {
          showToast('Error al eliminar ejercicio', 'error');
        }
      },
    });
  };

  const muscleGroupsSorted = useMemo(() => sortByDisplayOrder(muscleGroups), [muscleGroups]);

  const filteredMuscleGroups = useMemo(() => {
    if (!muscleGroupSearchTerm.trim()) return muscleGroupsSorted;
    const q = muscleGroupSearchTerm.toLowerCase();
    return muscleGroupsSorted.filter((g) => g.name.toLowerCase().includes(q));
  }, [muscleGroupsSorted, muscleGroupSearchTerm]);

  const exercisesSorted = useMemo(
    () => sortExercisesByMuscleGroup(exercises, muscleGroups),
    [exercises, muscleGroups]
  );

  const filteredExercises = useMemo(() => {
    let filtered = exercisesSorted;
    if (exerciseFilterGroup) {
      filtered = filtered.filter((e) => e.muscleGroupId === exerciseFilterGroup);
    }
    if (exerciseSearchTerm.trim()) {
      const q = exerciseSearchTerm.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [exercisesSorted, exerciseSearchTerm, exerciseFilterGroup]);

  const moveMuscleGroup = async (id: string, direction: 'up' | 'down') => {
    if (reorderingMuscleGroups || muscleGroupSearchTerm.trim()) return;
    const sorted = muscleGroupsSorted;
    const idx = sorted.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const j = direction === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[j]] = [next[j], next[idx]];
    setReorderingMuscleGroups(true);
    try {
      await reorderMuscleGroups(next.map((g) => g.id));
      await refresh();
    } catch {
      showToast('Error al reordenar', 'error');
    } finally {
      setReorderingMuscleGroups(false);
    }
  };

  const moveExercise = async (id: string, direction: 'up' | 'down') => {
    if (reorderingExercises || exerciseSearchTerm.trim() || exerciseFilterGroup) return;
    const exercise = exercisesSorted.find((e) => e.id === id);
    if (!exercise) return;
    const groupExercises = exercisesSorted.filter((e) => e.muscleGroupId === exercise.muscleGroupId);
    const idx = groupExercises.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const j = direction === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= groupExercises.length) return;
    const next = [...groupExercises];
    [next[idx], next[j]] = [next[j], next[idx]];
    setReorderingExercises(true);
    try {
      await reorderExercises(next.map((e) => e.id));
      await refresh();
    } catch {
      showToast('Error al reordenar', 'error');
    } finally {
      setReorderingExercises(false);
    }
  };

  const getMuscleGroupName = (id: string) => {
    const group = muscleGroups.find((g) => g.id === id);
    return group?.name || '';
  };

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type || 'danger'}
      />

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="ui-page-title">Gestión</h1>
          <p className="ui-page-subtitle">Grupos musculares, ejercicios y acceso.</p>
        </div>

        {/* Tabs */}
        <div className="ui-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('muscleGroups')}
            className={`ui-label ui-label-md ui-tab inline-flex items-center gap-1.5 ${activeTab === 'muscleGroups' ? 'ui-tab-active' : ''}`}
            style={{ ['--tab-accent' as string]: headerColor }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Grupos musculares
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exercises')}
            className={`ui-label ui-label-md ui-tab inline-flex items-center gap-1.5 ${activeTab === 'exercises' ? 'ui-tab-active' : ''}`}
            style={{ ['--tab-accent' as string]: headerColor }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Ejercicios
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className={`ui-label ui-label-md ui-tab inline-flex items-center gap-1.5 ${activeTab === 'access' ? 'ui-tab-active' : ''}`}
              style={{ ['--tab-accent' as string]: headerColor }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
              </svg>
              Acceso
            </button>
          )}
        </div>

        {/* Muscle Groups Tab */}
        {activeTab === 'muscleGroups' && (
          <>
            <Modal
              isOpen={showMuscleGroupForm}
              onClose={() => {
                setShowMuscleGroupForm(false);
                setEditingMuscleGroup(null);
                setMuscleGroupFormData(emptyMuscleGroupForm());
              }}
              title={editingMuscleGroup ? 'Editar grupo muscular' : 'Nuevo grupo muscular'}
            >
              <form onSubmit={handleMuscleGroupSubmit} className="space-y-4">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={muscleGroupFormData.name}
                    onChange={(e) => setMuscleGroupFormData({ ...muscleGroupFormData, name: e.target.value })}
                    placeholder="Ej: Pecho, Espalda, Piernas..."
                    className="ui-input"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Color: selector"
                      value={muscleGroupFormData.color}
                      onChange={(e) => setMuscleGroupFormData({ ...muscleGroupFormData, color: e.target.value.toUpperCase() })}
                      className="w-11 h-11 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-1"
                    />
                    <input
                      type="text"
                      value={muscleGroupFormData.color}
                      onChange={(e) => {
                        const hex = e.target.value.replace(/[^0-9A-Fa-f#]/g, '').toUpperCase();
                        setMuscleGroupFormData({ ...muscleGroupFormData, color: hex.startsWith('#') ? hex : `#${hex}` });
                      }}
                      placeholder="#3b82f6"
                      className="ui-input flex-1 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={muscleGroupFormData.trackingMode === 'cardio'}
                      onChange={(e) =>
                        setMuscleGroupFormData({
                          ...muscleGroupFormData,
                          trackingMode: e.target.checked ? 'cardio' : 'strength',
                        })
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-[var(--text)] normal-case tracking-normal">Cardio (repeticiones y minutos)</span>
                      <span className="block ui-caption mt-0.5 normal-case tracking-normal font-normal">
                        Sin peso en kg; cada serie se registra con reps y minutos.
                      </span>
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMuscleGroupForm(false);
                      setEditingMuscleGroup(null);
                      setMuscleGroupFormData(emptyMuscleGroupForm());
                    }}
                    className="ui-btn ui-btn-secondary w-full"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary w-full">
                    Guardar
                  </button>
                </div>
              </form>
            </Modal>

            <div className="ui-panel p-3 sm:p-6">
              <div className="flex justify-between items-center gap-3 mb-3 sm:mb-4">
                <h2 className="ui-label ui-label-lg">Grupos musculares</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <HamburgerMenuDropdown align="right" title="Más opciones">
                    <button
                      type="button"
                      onClick={() => void handleLoadInitialPack()}
                      disabled={loadingPack}
                      className={`ui-menu-item${loadingPack ? ' is-disabled' : ''}`}
                      title="Agrega grupos y ejercicios del pack que te falten"
                    >
                      {loadingPack ? 'Cargando…' : 'Cargar pack inicial'}
                    </button>
                  </HamburgerMenuDropdown>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMuscleGroupForm(true);
                      setEditingMuscleGroup(null);
                      setMuscleGroupFormData(emptyMuscleGroupForm());
                    }}
                    className="ui-icon-btn ui-icon-btn-primary"
                    title="Nuevo grupo"
                    aria-label="Nuevo grupo muscular"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar grupo..."
                  value={muscleGroupSearchTerm}
                  onChange={(e) => setMuscleGroupSearchTerm(e.target.value)}
                  className="ui-input"
                />
                {!muscleGroupSearchTerm.trim() && muscleGroupsSorted.length > 1 && (
                  <p className="ui-caption mt-2">↑ ↓ define el orden en formularios y listas.</p>
                )}
              </div>

              <div className="space-y-2">
                {filteredMuscleGroups.map((group, idx) => (
                  <div key={group.id} className="ui-list-item flex items-center justify-between p-3">
                    {!muscleGroupSearchTerm.trim() && muscleGroupsSorted.length > 1 && (
                      <div className="flex flex-col gap-0.5 mr-2 pr-2 border-r shrink-0 border-[var(--border-strong)]">
                        <button
                          type="button"
                          disabled={reorderingMuscleGroups || idx === 0}
                          onClick={() => moveMuscleGroup(group.id, 'up')}
                          aria-label="Subir"
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={reorderingMuscleGroups || idx === muscleGroupsSorted.length - 1}
                          onClick={() => moveMuscleGroup(group.id, 'down')}
                          aria-label="Bajar"
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: group.color }} />
                      <span className="text-base text-[var(--text)] truncate">{group.name}</span>
                      {group.trackingMode === 'cardio' && (
                        <span
                          className="ui-label ui-label-xs px-1.5 py-0.5 rounded-pill shrink-0"
                          style={{ color: headerColor, background: `color-mix(in srgb, ${headerColor} 14%, transparent)` }}
                        >
                          Cardio
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMuscleGroupEdit(group)}
                        className="ui-row-action is-edit"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMuscleGroupDelete(group.id)}
                        className="ui-row-action is-delete"
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredMuscleGroups.length === 0 && (
                  <EmptyState title={muscleGroupSearchTerm ? 'No se encontraron grupos' : 'No hay grupos musculares'} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <>
            <Modal
              isOpen={showExerciseForm}
              onClose={() => {
                setShowExerciseForm(false);
                setEditingExercise(null);
                setExerciseFormData({ name: '', muscleGroupId: '', notes: '' });
              }}
              title={editingExercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            >
              <form onSubmit={handleExerciseSubmit} className="space-y-4">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={exerciseFormData.name}
                    onChange={(e) => setExerciseFormData({ ...exerciseFormData, name: e.target.value })}
                    placeholder="Ej: Press banca, Sentadilla..."
                    className="ui-input"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Grupo muscular</label>
                  <select
                    value={exerciseFormData.muscleGroupId}
                    onChange={(e) => setExerciseFormData({ ...exerciseFormData, muscleGroupId: e.target.value })}
                    className="ui-input"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {muscleGroupsSorted.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  {exerciseFormData.muscleGroupId && (
                    <p className="ui-caption mt-1.5 flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded"
                        style={{ backgroundColor: getGroupColor(exerciseFormData.muscleGroupId) }}
                      />
                      Usa el color del grupo
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Notas (opcional)</label>
                  <input
                    type="text"
                    value={exerciseFormData.notes}
                    onChange={(e) => setExerciseFormData({ ...exerciseFormData, notes: e.target.value })}
                    placeholder="Indicaciones, variantes..."
                    className="ui-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExerciseForm(false);
                      setEditingExercise(null);
                      setExerciseFormData({ name: '', muscleGroupId: '', notes: '' });
                    }}
                    className="ui-btn ui-btn-secondary w-full"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary w-full">
                    Guardar
                  </button>
                </div>
              </form>
            </Modal>

            <div className="ui-panel p-3 sm:p-6">
              <div className="flex justify-between items-center gap-3 mb-3 sm:mb-4">
                <h2 className="ui-label ui-label-lg">Ejercicios</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowExerciseForm(true);
                    setEditingExercise(null);
                    setExerciseFormData({ name: '', muscleGroupId: '', notes: '' });
                  }}
                  className="ui-icon-btn ui-icon-btn-primary shrink-0"
                  title="Nuevo ejercicio"
                  aria-label="Nuevo ejercicio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={exerciseSearchTerm}
                  onChange={(e) => setExerciseSearchTerm(e.target.value)}
                  className="ui-input"
                />
                <select
                  value={exerciseFilterGroup}
                  onChange={(e) => setExerciseFilterGroup(e.target.value)}
                  className="ui-input"
                >
                  <option value="">Todos los grupos</option>
                  {muscleGroupsSorted.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              {!exerciseSearchTerm.trim() && !exerciseFilterGroup && exercisesSorted.length > 1 && (
                <p className="ui-caption mb-3">
                  Ordenados por grupo. ↑ ↓ cambia el orden dentro del mismo grupo.
                </p>
              )}

              <div className="space-y-2">
                {filteredExercises.map((exercise, idx) => {
                  const prevGroupId = idx > 0 ? filteredExercises[idx - 1].muscleGroupId : null;
                  const showGroupHeader =
                    !exerciseFilterGroup && exercise.muscleGroupId !== prevGroupId;
                  const groupExercises = filteredExercises.filter(
                    (e) => e.muscleGroupId === exercise.muscleGroupId
                  );
                  const indexInGroup = groupExercises.findIndex((e) => e.id === exercise.id);

                  return (
                    <div key={exercise.id}>
                      {showGroupHeader && (
                        <div className="flex items-center gap-2 pt-2 pb-1 first:pt-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getGroupColor(exercise.muscleGroupId) }}
                          />
                          <span className="ui-label ui-label-xs">
                            {getMuscleGroupName(exercise.muscleGroupId) || 'Sin grupo'}
                          </span>
                        </div>
                      )}
                      <div className="ui-list-item flex items-center justify-between p-3">
                        {!exerciseSearchTerm.trim() && groupExercises.length > 1 && (
                          <div className="flex flex-col gap-0.5 mr-2 pr-2 border-r shrink-0 border-[var(--border-strong)]">
                            <button
                              type="button"
                              disabled={reorderingExercises || indexInGroup === 0}
                              onClick={() => moveExercise(exercise.id, 'up')}
                              aria-label="Subir"
                              className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={
                                reorderingExercises || indexInGroup === groupExercises.length - 1
                              }
                              onClick={() => moveExercise(exercise.id, 'down')}
                              aria-label="Bajar"
                              className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: getGroupColor(exercise.muscleGroupId) }}
                          />
                          <div className="min-w-0">
                            <div className="text-base text-[var(--text)] truncate">{exercise.name}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleExerciseEdit(exercise)}
                            className="ui-row-action is-edit"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExerciseDelete(exercise.id)}
                            className="ui-row-action is-delete"
                            title="Eliminar"
                            aria-label="Eliminar"
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
                {filteredExercises.length === 0 && (
                  <EmptyState title={exerciseSearchTerm || exerciseFilterGroup ? 'No se encontraron ejercicios' : 'No hay ejercicios'} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Access Tab */}
        {isAdmin && activeTab === 'access' && (
          <div className="ui-panel p-3 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="ui-label ui-label-lg">Pedidos de acceso</h2>
              <button
                type="button"
                onClick={() => void loadAccessData()}
                disabled={accessLoading}
                className="ui-btn ui-btn-secondary"
                data-loading={accessLoading}
              >
                Actualizar
              </button>
            </div>

            {accessLoading && accessRequests.length === 0 ? (
              <div className="space-y-2" aria-busy="true" aria-label="Cargando">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="ui-label ui-label-sm">Pendientes</h3>
                  {accessRequests.filter((r) => r.status === 'pending').length === 0 && (
                    <p className="ui-caption">No hay pedidos pendientes.</p>
                  )}
                  {accessRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div key={req.id} className="ui-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {req.photoURL ? (
                            <img src={req.photoURL} alt="" className="w-9 h-9 rounded-full" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--text)] text-sm font-semibold">
                              {(req.displayName || req.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate text-[var(--text)]">{req.displayName || 'Sin nombre'}</div>
                            <div className="text-sm truncate text-[var(--text-muted)]">{req.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleApproveRequest(req)}
                            className="ui-btn ui-btn-primary"
                            style={{ ['--btn-color' as string]: '#16a34a' }}
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDenyRequest(req)}
                            className="ui-btn ui-btn-secondary"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="space-y-2">
                  <h3 className="ui-label ui-label-sm">Usuarios con acceso</h3>
                  {allowedUsersList.length === 0 && (
                    <p className="ui-caption">No hay usuarios en la lista.</p>
                  )}
                  {allowedUsersList.map((allowed) => (
                    <div key={allowed.userId || allowed.id} className="ui-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate text-[var(--text)]">
                          {allowed.email}
                          {allowed.isAdmin && <span className="ml-2 ui-label ui-label-xs" style={{ color: '#f59e0b' }}>
                              admin
                            </span>}
                        </div>
                      </div>
                      {!allowed.isAdmin && allowed.id !== user?.uid && (
                        <button
                          type="button"
                          onClick={() => handleRevokeUser(allowed)}
                          className="ui-btn ui-btn-secondary"
                        >
                          Revocar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
