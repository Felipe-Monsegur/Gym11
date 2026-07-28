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
  listAccessRequests,
  approveAccessRequest,
  denyAccessRequest,
  getAllowedUsers,
  removeAllowedUser,
} from '../services/firebaseService';
import { sortByDisplayOrder } from '../utils/displayOrder';
import { MuscleGroup, Exercise, AccessRequest, AllowedUser } from '../types';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_COLOR = '#3b82f6';

type TabType = 'muscleGroups' | 'exercises' | 'access';

export default function Management() {
  const { muscleGroups, exercises, workouts, refresh } = useData();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { theme, headerColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('muscleGroups');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [allowedUsersList, setAllowedUsersList] = useState<AllowedUser[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const [showMuscleGroupForm, setShowMuscleGroupForm] = useState(false);
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroup | null>(null);
  const [muscleGroupSearchTerm, setMuscleGroupSearchTerm] = useState('');
  const [muscleGroupFormData, setMuscleGroupFormData] = useState({
    name: '',
    color: DEFAULT_COLOR,
  });
  const [reorderingMuscleGroups, setReorderingMuscleGroups] = useState(false);

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] = useState('');
  const [exerciseFormData, setExerciseFormData] = useState({
    name: '',
    muscleGroupId: '',
    notes: '',
    color: DEFAULT_COLOR,
  });
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

  // Muscle Groups handlers
  const handleMuscleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingMuscleGroup) {
        await updateMuscleGroup(editingMuscleGroup.id, muscleGroupFormData);
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
      setMuscleGroupFormData({ name: '', color: DEFAULT_COLOR });
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
      if (editingExercise) {
        await updateExercise(editingExercise.id, exerciseFormData);
      } else {
        const maxOrder = exercises.reduce((m, e) => Math.max(m, e.sortOrder ?? -1), -1);
        await addExercise({
          ...exerciseFormData,
          userId: user.uid,
          sortOrder: maxOrder + 1,
        });
      }
      setShowExerciseForm(false);
      setEditingExercise(null);
      setExerciseFormData({ name: '', muscleGroupId: '', notes: '', color: DEFAULT_COLOR });
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
      color: exercise.color,
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

  const exercisesSorted = useMemo(() => sortByDisplayOrder(exercises), [exercises]);

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
    const sorted = exercisesSorted;
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const j = direction === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
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
        <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Gestión
        </h1>

        {/* Tabs */}
        <div className="ui-tabs">
          <button
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
                setMuscleGroupFormData({ name: '', color: DEFAULT_COLOR });
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
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={muscleGroupFormData.color}
                      onChange={(e) => setMuscleGroupFormData({ ...muscleGroupFormData, color: e.target.value.toUpperCase() })}
                      className="w-16 h-12 rounded border-2 border-gray-600 cursor-pointer"
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
                <div className="flex gap-2">
                  <button type="submit" className="ui-btn-submit flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMuscleGroupForm(false);
                      setEditingMuscleGroup(null);
                      setMuscleGroupFormData({ name: '', color: DEFAULT_COLOR });
                    }}
                    className={`px-4 py-2.5 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Modal>

            <div className="ui-panel p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <h2 className="ui-label ui-label-lg">Grupos musculares</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowMuscleGroupForm(true);
                    setEditingMuscleGroup(null);
                    setMuscleGroupFormData({ name: '', color: DEFAULT_COLOR });
                  }}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 shrink-0"
                  title="Nuevo grupo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar grupo..."
                  value={muscleGroupSearchTerm}
                  onChange={(e) => setMuscleGroupSearchTerm(e.target.value)}
                  className="ui-input text-sm"
                />
                {!muscleGroupSearchTerm.trim() && muscleGroupsSorted.length > 1 && (
                  <p className="text-xs mt-2 text-[var(--text-muted)]">↑ ↓ define el orden en formularios y listas.</p>
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
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={reorderingMuscleGroups || idx === muscleGroupsSorted.length - 1}
                          onClick={() => moveMuscleGroup(group.id, 'down')}
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: group.color }} />
                      <span className="text-base text-[var(--text)]">{group.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMuscleGroupEdit(group)}
                        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-100'}`}
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMuscleGroupDelete(group.id)}
                        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'}`}
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredMuscleGroups.length === 0 && (
                  <p className="text-center py-8 text-[var(--text-muted)]">
                    {muscleGroupSearchTerm ? 'No se encontraron grupos' : 'No hay grupos musculares'}
                  </p>
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
                setExerciseFormData({ name: '', muscleGroupId: '', notes: '', color: DEFAULT_COLOR });
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
                    {muscleGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
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
                <div className="form-group">
                  <label>Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={exerciseFormData.color}
                      onChange={(e) => setExerciseFormData({ ...exerciseFormData, color: e.target.value.toUpperCase() })}
                      className="w-16 h-12 rounded border-2 border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={exerciseFormData.color}
                      onChange={(e) => {
                        const hex = e.target.value.replace(/[^0-9A-Fa-f#]/g, '').toUpperCase();
                        setExerciseFormData({ ...exerciseFormData, color: hex.startsWith('#') ? hex : `#${hex}` });
                      }}
                      placeholder="#3b82f6"
                      className="ui-input flex-1 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="ui-btn-submit flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExerciseForm(false);
                      setEditingExercise(null);
                      setExerciseFormData({ name: '', muscleGroupId: '', notes: '', color: DEFAULT_COLOR });
                    }}
                    className={`px-4 py-2.5 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Modal>

            <div className="ui-panel p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <h2 className="ui-label ui-label-lg">Ejercicios</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowExerciseForm(true);
                    setEditingExercise(null);
                    setExerciseFormData({ name: '', muscleGroupId: '', notes: '', color: DEFAULT_COLOR });
                  }}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white hover:bg-blue-700 shrink-0"
                  title="Nuevo ejercicio"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="ui-input text-sm"
                />
                <select
                  value={exerciseFilterGroup}
                  onChange={(e) => setExerciseFilterGroup(e.target.value)}
                  className="ui-input text-sm"
                >
                  <option value="">Todos los grupos</option>
                  {muscleGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              {!exerciseSearchTerm.trim() && !exerciseFilterGroup && exercisesSorted.length > 1 && (
                <p className="text-xs mb-3 text-[var(--text-muted)]">↑ ↓ define el orden en formularios y listas.</p>
              )}

              <div className="space-y-2">
                {filteredExercises.map((exercise, idx) => (
                  <div key={exercise.id} className="ui-list-item flex items-center justify-between p-3">
                    {!exerciseSearchTerm.trim() && !exerciseFilterGroup && exercisesSorted.length > 1 && (
                      <div className="flex flex-col gap-0.5 mr-2 pr-2 border-r shrink-0 border-[var(--border-strong)]">
                        <button
                          type="button"
                          disabled={reorderingExercises || idx === 0}
                          onClick={() => moveExercise(exercise.id, 'up')}
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={reorderingExercises || idx === exercisesSorted.length - 1}
                          onClick={() => moveExercise(exercise.id, 'down')}
                          className="ui-list-item-btn px-1.5 py-0.5 text-sm leading-none disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: exercise.color }} />
                      <div className="min-w-0">
                        <div className="text-base text-[var(--text)] truncate">{exercise.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{getMuscleGroupName(exercise.muscleGroupId)}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleExerciseEdit(exercise)}
                        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-100'}`}
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleExerciseDelete(exercise.id)}
                        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'}`}
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredExercises.length === 0 && (
                  <p className="text-center py-8 text-[var(--text-muted)]">
                    {exerciseSearchTerm || exerciseFilterGroup ? 'No se encontraron ejercicios' : 'No hay ejercicios'}
                  </p>
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
                className="ui-list-item-btn px-3 py-1.5 text-sm"
              >
                {accessLoading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>

            {accessLoading && accessRequests.length === 0 ? (
              <p className="text-[var(--text-muted)]">Cargando...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-muted)]">Pendientes</h3>
                  {accessRequests.filter((r) => r.status === 'pending').length === 0 && (
                    <p className="text-sm text-[var(--text-muted)]">No hay pedidos pendientes.</p>
                  )}
                  {accessRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div key={req.id} className="ui-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {req.photoURL ? (
                            <img src={req.photoURL} alt="" className="w-9 h-9 rounded-full" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
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
                            className="px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDenyRequest(req)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-muted)]">Usuarios con acceso</h3>
                  {allowedUsersList.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)]">No hay usuarios en la lista.</p>
                  )}
                  {allowedUsersList.map((allowed) => (
                    <div key={allowed.userId || allowed.id} className="ui-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate text-[var(--text)]">
                          {allowed.email}
                          {allowed.isAdmin && <span className="ml-2 text-xs font-semibold text-amber-500">admin</span>}
                        </div>
                      </div>
                      {!allowed.isAdmin && allowed.id !== user?.uid && (
                        <button
                          type="button"
                          onClick={() => handleRevokeUser(allowed)}
                          className="ui-list-item-btn px-3 py-1.5 text-sm"
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
