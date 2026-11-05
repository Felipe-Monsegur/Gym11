import { useId, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import StatusIcon, { STATUS_COLORS } from './ui/StatusIcon';
import {
  useBodyScrollLock,
  useDialogFocus,
  useEscapeToClose,
  useFrozenWhileClosed,
  usePresence,
} from './ui/dialogHooks';

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
  const { mounted, closing } = usePresence(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();

  useBodyScrollLock(isOpen);
  useEscapeToClose(isOpen, onClose);
  useDialogFocus(isOpen, dialogRef);

  const frozen = useFrozenWhileClosed(isOpen, { title, message, confirmText, cancelText, type });

  if (!mounted) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className={`ui-overlay is-centered ${closing ? 'is-closing' : ''}`} onClick={onClose}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className={`ui-panel ui-alert ${closing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center px-5 pt-6 pb-5">
          <StatusIcon type={frozen.type} size={3} />
          <h3 id={titleId} className="ui-section-title mt-4">
            {frozen.title}
          </h3>
          <p id={messageId} className="mt-2 text-[0.9375rem] leading-snug text-[var(--text-muted)] whitespace-pre-wrap">
            {frozen.message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary w-full">
            {frozen.cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="ui-btn ui-btn-primary w-full"
            style={{ '--btn-color': STATUS_COLORS[frozen.type] } as CSSProperties}
          >
            {frozen.confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
