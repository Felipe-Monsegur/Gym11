import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

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

  return (
    <div
      className={`${style.bg} ${style.border} border-l-4 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in-right`}
    >
      <span className="text-2xl font-bold flex-shrink-0">{style.icon}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 text-xl font-bold flex-shrink-0 ml-2 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

