import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Color de acento del título (ej. tipo de transacción) */
  accentColor?: string;
  subtitle?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  accentColor,
  subtitle,
}: ModalProps) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="ui-panel w-[calc(100%-0.5rem)] sm:w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={
          accentColor
            ? { boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 35%, transparent), var(--shadow-panel)` }
            : undefined
        }
      >
        <div
          className={`sticky top-0 z-10 flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b ${
            theme === 'dark' ? 'border-white/10 bg-[var(--surface)]' : 'border-black/10 bg-[var(--surface)]'
          }`}
        >
          <div className="min-w-0">
            <div
              className="h-1 w-10 rounded-full mb-2.5"
              style={{ backgroundColor: accentColor || 'var(--header-color)' }}
            />
            <h2
              className={`text-lg sm:text-xl font-bold tracking-tight truncate ${
                accentColor ? '' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              style={accentColor ? { color: accentColor } : undefined}
            >
              {title}
            </h2>
            {subtitle && (
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
            }`}
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
