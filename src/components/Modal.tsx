import { ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  useBodyScrollLock,
  useDialogFocus,
  useEscapeToClose,
  useFrozenWhileClosed,
  usePresence,
} from './ui/dialogHooks';

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
  const { mounted, closing } = usePresence(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(isOpen);
  useEscapeToClose(isOpen, onClose);
  useDialogFocus(isOpen, dialogRef);

  const content = useFrozenWhileClosed(isOpen, children);
  const frozenTitle = useFrozenWhileClosed(isOpen, title);
  const frozenSubtitle = useFrozenWhileClosed(isOpen, subtitle);

  if (!mounted) return null;

  return createPortal(
    <div className={`ui-overlay ${closing ? 'is-closing' : ''}`} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`ui-panel ui-dialog ${closing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={
          accentColor
            ? { boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 35%, transparent), var(--shadow-lg)` }
            : undefined
        }
      >
        <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="ui-sheet-grabber" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-3 sm:pt-5 pb-3">
            <div className="min-w-0 pt-1">
              <div
                className="h-1 w-10 rounded-full mb-2.5"
                style={{ backgroundColor: accentColor || 'var(--header-color)' }}
              />
              <h2
                id={titleId}
                className="ui-section-title truncate"
                style={accentColor ? { color: accentColor } : undefined}
              >
                {frozenTitle}
              </h2>
              {frozenSubtitle && <p className="ui-caption mt-1">{frozenSubtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="ui-icon-btn" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">{content}</div>
      </div>
    </div>,
    document.body
  );
}
