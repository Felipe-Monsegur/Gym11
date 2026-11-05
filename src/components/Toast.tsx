import { useEffect, useRef, useState } from 'react';
import StatusIcon from './ui/StatusIcon';
import { DIALOG_EXIT_MS } from './ui/dialogHooks';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [closing, setClosing] = useState(false);
  // onClose cambia en cada render del provider; un ref evita reiniciar el timer
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => setClosing(true), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => onCloseRef.current(), DIALOG_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`ui-toast ${closing ? 'is-closing' : ''}`}
    >
      <StatusIcon type={type} size={2} />
      <p className="flex-1 min-w-0 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => setClosing(true)}
        className="ui-icon-btn ui-icon-btn-ghost !w-9 !h-9 !min-w-0 !min-h-0"
        aria-label="Cerrar notificación"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
