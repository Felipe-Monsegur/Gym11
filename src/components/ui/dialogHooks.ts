import { useEffect, useRef, useState, type RefObject } from 'react';

/** Duración de salida de diálogos; coincide con --dur-base en index.css */
export const DIALOG_EXIT_MS = 220;

/**
 * Mantiene montado un elemento mientras corre su animación de salida.
 * `closing` es true durante ese intervalo.
 */
export function usePresence(isOpen: boolean, exitMs = DIALOG_EXIT_MS) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, exitMs]);

  // `isOpen ||`: montar en el mismo render que abre, así los efectos (ej. foco) ya tienen el nodo
  return { mounted: isOpen || mounted, closing };
}

/**
 * Durante la salida, el padre suele limpiar el estado que alimenta el contenido
 * (ej. la transacción en edición). Se congela el último contenido abierto.
 */
export function useFrozenWhileClosed<T>(isOpen: boolean, value: T): T {
  const ref = useRef(value);
  if (isOpen) ref.current = value;
  return isOpen ? value : ref.current;
}

let scrollLocks = 0;

/** Bloquea el scroll del body; soporta diálogos apilados. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    scrollLocks += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = '';
    };
  }, [active]);
}

const escapeStack: Array<{ current: () => void }> = [];

/** Escape cierra solo el diálogo de más arriba. */
export function useEscapeToClose(active: boolean, onClose: () => void) {
  const handlerRef = useRef(onClose);
  handlerRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const entry = { current: () => handlerRef.current() };
    escapeStack.push(entry);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || escapeStack[escapeStack.length - 1] !== entry) return;
      event.stopPropagation();
      entry.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = escapeStack.indexOf(entry);
      if (index >= 0) escapeStack.splice(index, 1);
    };
  }, [active]);
}

/** Lleva el foco al diálogo al abrir y lo devuelve al disparador al cerrar. */
export function useDialogFocus(active: boolean, dialogRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus({ preventScroll: true });
    }
    return () => {
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, dialogRef]);
}
