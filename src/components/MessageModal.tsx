import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import StatusIcon from './ui/StatusIcon';
import {
  useBodyScrollLock,
  useDialogFocus,
  useEscapeToClose,
  useFrozenWhileClosed,
  usePresence,
} from './ui/dialogHooks';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export default function MessageModal({ isOpen, onClose, title, message, type = 'info' }: MessageModalProps) {
  const { mounted, closing } = usePresence(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(isOpen);
  useEscapeToClose(isOpen, onClose);
  useDialogFocus(isOpen, dialogRef);

  const frozen = useFrozenWhileClosed(isOpen, { title, message, type });

  if (!mounted) return null;

  return createPortal(
    <div className={`ui-overlay is-centered ${closing ? 'is-closing' : ''}`} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`ui-panel ui-alert sm:!max-w-lg flex flex-col ${closing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center px-5 pt-6 pb-4 min-h-0">
          <StatusIcon type={frozen.type} size={3} />
          <h2 id={titleId} className="ui-section-title mt-4">
            {frozen.title}
          </h2>
          <div className="mt-2 w-full text-left text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap overflow-y-auto">
            {frozen.message}
          </div>
        </div>
        <div className="px-4 pb-4">
          <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary w-full">
            Aceptar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
