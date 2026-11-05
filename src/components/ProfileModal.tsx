import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Modal from './Modal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const presetColors = [
  { name: 'Rojo', value: '#A80000' },
  { name: 'Azul', value: '#1E3A8A' },
  { name: 'Verde', value: '#16A34A' },
  { name: 'Naranja', value: '#EA580C' },
  { name: 'Amarillo', value: '#CA8A04' },
  { name: 'Morado', value: '#9333EA' },
  { name: 'Rosa', value: '#DB2777' },
  { name: 'Negro', value: '#111827' },
];

type ColorFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function ColorField({ label, value, placeholder, onChange }: ColorFieldProps) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label}: selector`}
          className="w-11 h-11 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ui-input flex-1 font-mono uppercase"
          placeholder={placeholder}
        />
      </div>
      <div className="grid grid-cols-8 gap-2 mt-2.5" role="group" aria-label={`${label}: predefinidos`}>
        {presetColors.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`ui-swatch ${value.toLowerCase() === preset.value.toLowerCase() ? 'is-selected' : ''}`}
            style={{ backgroundColor: preset.value }}
            title={preset.name}
            aria-label={preset.name}
            aria-pressed={value.toLowerCase() === preset.value.toLowerCase()}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { theme, toggleTheme, headerColorDark, headerColorLight, headerTitle, updateHeaderColorDark, updateHeaderColorLight, updateHeaderTitle } = useTheme();
  const [colorDarkInput, setColorDarkInput] = useState(headerColorDark);
  const [colorLightInput, setColorLightInput] = useState(headerColorLight);
  const [titleInput, setTitleInput] = useState(headerTitle);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setColorDarkInput(headerColorDark);
      setColorLightInput(headerColorLight);
      setTitleInput(headerTitle);
    }
  }, [isOpen, headerColorDark, headerColorLight, headerTitle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateHeaderColorDark(colorDarkInput);
      await updateHeaderColorLight(colorLightInput);
      await updateHeaderTitle(titleInput);
      onClose();
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mi Perfil" subtitle={user?.email || 'No disponible'}>
      <div className="space-y-6">
        <ColorField
          label="Color primario (Oscuro)"
          value={colorDarkInput}
          placeholder="#A80000"
          onChange={setColorDarkInput}
        />

        <ColorField
          label="Color primario (Claro)"
          value={colorLightInput}
          placeholder="#1E3A8A"
          onChange={setColorLightInput}
        />

        <div className="form-group">
          <label>Tema</label>
          <button type="button" onClick={toggleTheme} className="ui-btn ui-btn-secondary w-full">
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
          </button>
          <p className="ui-caption mt-1.5">Cambia entre modo oscuro y modo claro.</p>
        </div>

        <div className="form-group">
          <label htmlFor="profile-header-title">Título del Header</label>
          <input
            id="profile-header-title"
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="ui-input"
            placeholder="Gym11"
            maxLength={50}
          />
          <p className="ui-caption mt-1.5 text-right">{titleInput.length}/50</p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary w-full">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-loading={saving}
            className="ui-btn ui-btn-primary w-full"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
