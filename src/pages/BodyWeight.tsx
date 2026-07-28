import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addBodyWeight, updateBodyWeight, deleteBodyWeight } from '../services/firebaseService';
import { BodyWeight as BodyWeightType } from '../types';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import DateInput from '../components/DateInput';

export default function BodyWeight() {
  const { user } = useAuth();
  const { bodyWeights, loading, refresh } = useData();
  const { theme, headerColor } = useTheme();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingWeight, setEditingWeight] = useState<BodyWeightType | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    weight: number;
  }>({ isOpen: false, id: '', weight: 0 });

  const sortedWeights = useMemo(
    () => [...bodyWeights].sort((a, b) => b.date.localeCompare(a.date)),
    [bodyWeights]
  );

  const latestWeight = sortedWeights[0];
  const previousWeight = sortedWeights[1];

  const weightDiff = latestWeight && previousWeight
    ? latestWeight.weight - previousWeight.weight
    : null;

  const handleOpenForm = (weight?: BodyWeightType) => {
    if (weight) {
      setEditingWeight(weight);
      setFormData({
        date: weight.date,
        weight: weight.weight.toString(),
        notes: weight.notes || '',
      });
    } else {
      setEditingWeight(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        notes: '',
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWeight(null);
    setFormData({ date: new Date().toISOString().split('T')[0], weight: '', notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const weightNum = parseFloat(formData.weight);
    if (!weightNum || weightNum <= 0) {
      showToast('Ingresá un peso válido', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingWeight) {
        await updateBodyWeight(editingWeight.id, {
          date: formData.date,
          weight: weightNum,
          notes: formData.notes || undefined,
        });
        showToast('Peso actualizado', 'success');
      } else {
        await addBodyWeight({
          date: formData.date,
          weight: weightNum,
          notes: formData.notes || undefined,
          userId: user.uid,
        });
        showToast('Peso registrado', 'success');
      }
      await refresh();
      handleCloseForm();
    } catch (error) {
      console.error(error);
      showToast('Error al guardar peso', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBodyWeight(confirmModal.id);
      await refresh();
      showToast('Registro eliminado', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar registro', 'error');
    } finally {
      setConfirmModal({ isOpen: false, id: '', weight: 0 });
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
        onClose={() => setConfirmModal({ isOpen: false, id: '', weight: 0 })}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message={`¿Eliminar el registro de ${confirmModal.weight} kg? Esta acción no se puede deshacer.`}
        type="danger"
      />

      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingWeight ? 'Editar peso' : 'Registrar peso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Fecha</label>
            <DateInput
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              className="ui-input"
              required
              allowClear={false}
            />
          </div>
          <div className="form-group">
            <label>Peso (kg)</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="75.5"
              step="0.1"
              min="0"
              className="ui-input"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Notas (opcional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="En ayunas, después de entrenar..."
              className="ui-input"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: headerColor }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCloseForm}
              className={`px-4 py-2.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Peso corporal
          </h1>
          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: headerColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Registrar</span>
          </button>
        </div>

        {/* Current Weight Card */}
        {latestWeight && (
          <div className="ui-panel p-6 text-center">
            <div className="text-sm text-[var(--text-muted)] mb-1">Último registro</div>
            <div className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-2">
              {latestWeight.weight} <span className="text-2xl">kg</span>
            </div>
            <div className="text-sm text-[var(--text-muted)] mb-2">
              {new Date(latestWeight.date).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            {weightDiff !== null && (
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  weightDiff > 0
                    ? 'bg-red-500/20 text-red-400'
                    : weightDiff < 0
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {weightDiff > 0 ? '+' : ''}
                {weightDiff.toFixed(1)} kg desde el anterior
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="ui-panel p-4 sm:p-6">
          <h2 className="ui-label ui-label-lg mb-4">Historial</h2>

          {sortedWeights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[var(--text-muted)] mb-4">No hay registros de peso</div>
              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: headerColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar primer peso
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedWeights.map((bw, idx) => {
                const prev = sortedWeights[idx + 1];
                const diff = prev ? bw.weight - prev.weight : null;

                return (
                  <div
                    key={bw.id}
                    className="ui-list-item flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-right shrink-0">
                        <div className="font-bold text-[var(--text)] text-lg">{bw.weight} kg</div>
                        {diff !== null && (
                          <div
                            className={`text-xs ${
                              diff > 0
                                ? 'text-red-400'
                                : diff < 0
                                ? 'text-green-400'
                                : 'text-gray-400'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {diff.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-[var(--text)]">
                          {new Date(bw.date).toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {bw.notes && (
                          <div className="text-xs text-[var(--text-muted)] truncate">{bw.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenForm(bw)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:bg-blue-500/20'
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ isOpen: true, id: bw.id, weight: bw.weight })}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-red-600 hover:bg-red-100'
                        }`}
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
