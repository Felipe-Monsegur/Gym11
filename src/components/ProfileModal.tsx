import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Modal from './Modal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  const presetColors = [
    { name: 'Rojo', value: '#A80000' },
    { name: 'Azul', value: '#1e3a8a' },
    { name: 'Verde', value: '#059669' },
    { name: 'Morado', value: '#7c3aed' },
    { name: 'Naranja', value: '#ea580c' },
    { name: 'Rosa', value: '#db2777' },
    { name: 'Cian', value: '#0891b2' },
    { name: 'Amarillo', value: '#ca8a04' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mi Perfil">
      <div className="space-y-3 sm:space-y-6">
        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <div className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            {user?.email || 'No disponible'}
          </div>
        </div>

        {/* Color del Header - Modo Oscuro */}
        <div className="form-group">
          <label>Color Header (Oscuro)</label>
          <div className="space-y-2">
            {/* Input de color */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorDarkInput}
                onChange={(e) => setColorDarkInput(e.target.value)}
                className="w-10 h-8 sm:w-16 sm:h-10 rounded cursor-pointer border-2 border-gray-300 flex-shrink-0"
              />
              <input
                type="text"
                value={colorDarkInput}
                onChange={(e) => setColorDarkInput(e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs sm:text-sm ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="#A80000"
              />
            </div>
            
            {/* Colores predefinidos */}
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Predefinidos:
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setColorDarkInput(preset.value)}
                    className={`h-7 sm:h-10 rounded-lg border-2 transition-all ${
                      colorDarkInput === preset.value
                        ? 'border-white ring-2 ring-blue-500 scale-105'
                        : theme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Color del Header - Modo Claro */}
        <div className="form-group">
          <label>Color Header (Claro)</label>
          <div className="space-y-2">
            {/* Input de color */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorLightInput}
                onChange={(e) => setColorLightInput(e.target.value)}
                className="w-10 h-8 sm:w-16 sm:h-10 rounded cursor-pointer border-2 border-gray-300 flex-shrink-0"
              />
              <input
                type="text"
                value={colorLightInput}
                onChange={(e) => setColorLightInput(e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs sm:text-sm ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="#1e3a8a"
              />
            </div>
            
            {/* Colores predefinidos */}
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Predefinidos:
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setColorLightInput(preset.value)}
                    className={`h-7 sm:h-10 rounded-lg border-2 transition-all ${
                      colorLightInput === preset.value
                        ? 'border-white ring-2 ring-blue-500 scale-105'
                        : theme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="form-group">
          <label>Tema</label>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="hidden sm:inline">Modo Oscuro</span>
                  <span className="sm:hidden">Oscuro</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="hidden sm:inline">Modo Claro</span>
                  <span className="sm:hidden">Claro</span>
                </>
              )}
            </button>
          </div>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Cambia entre modo oscuro y modo claro.
          </p>
        </div>

        {/* Título del Header */}
        <div className="form-group">
          <label>Título del Header</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className={`w-full px-2 py-1.5 rounded-lg text-xs sm:text-sm ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Gym11"
            maxLength={50}
          />
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {titleInput.length}/50 caracteres
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

