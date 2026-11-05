import type { MouseEvent, ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';

type HamburgerMenuDropdownProps = {
  title?: string;
  align?: 'left' | 'right';
  className?: string;
  children: ReactNode;
};

export default function HamburgerMenuDropdown({
  title = 'Más opciones (exportar / importar)',
  align = 'right',
  className = '',
  children,
}: HamburgerMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handlePanelClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, label[for]')) {
      close();
    }
  };

  return (
    <div className={`relative shrink-0 inline-flex items-center ${open ? 'z-20' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`ui-menu-btn ui-menu-btn-icon ${open ? 'is-open relative z-40' : ''} ${className}`.trim()}
        title={open ? 'Cerrar' : title}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
      >
        <span className="ui-options-toggle-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div
            id={panelId}
            role="menu"
            onClick={handlePanelClick}
            className={`ui-menu-panel absolute top-full z-30 mt-2 inline-flex flex-col gap-0.5 w-max max-w-[calc(100vw-1rem)] shadow-lg ${
              align === 'right' ? 'right-0 left-auto' : 'left-0'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
