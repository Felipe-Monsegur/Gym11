import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  type = 'danger',
}: ConfirmModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const typeStyles = {
    danger: {
      confirmBg: theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600',
      icon: '⚠️',
      iconColor: 'text-red-500',
    },
    warning: {
      confirmBg: theme === 'dark' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600',
      icon: '⚠️',
      iconColor: 'text-yellow-500',
    },
    info: {
      confirmBg: theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
      icon: 'ℹ️',
      iconColor: 'text-blue-500',
    },
  };

  const styles = typeStyles[type];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="ui-panel max-w-md w-full mx-1 sm:mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className={`text-4xl flex-shrink-0 ${styles.iconColor}`}>
              {styles.icon}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {title}
              </h3>
              <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-[var(--radius-control)] transition-colors font-medium ${
                theme === 'dark'
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-[var(--radius-control)] transition-colors font-medium text-white ${styles.confirmBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
