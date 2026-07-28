import { createPortal } from 'react-dom';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export default function MessageModal({ isOpen, onClose, title, message, type = 'info' }: MessageModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-500',
      icon: '✕',
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-500',
      icon: 'ℹ',
    },
    warning: {
      bg: 'bg-yellow-600',
      border: 'border-yellow-500',
      icon: '⚠',
    },
  };

  const style = typeStyles[type];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-xl max-w-2xl w-full mx-2 sm:mx-4 max-h-[80vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <span className="text-2xl sm:text-3xl font-bold flex-shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{title}</h2>
              <div className="text-white whitespace-pre-wrap text-xs sm:text-sm">{message}</div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl sm:text-2xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
          <div className="mt-3 sm:mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

