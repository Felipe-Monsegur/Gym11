/** Zona horaria de la app (fecha "de negocio"). */
export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Hoy en YYYY-MM-DD según Argentina (no UTC). */
export function getTodayDateString(timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Mes actual en YYYY-MM según Argentina. */
export function getTodayMonthString(timeZone: string = APP_TIMEZONE): string {
  return getTodayDateString(timeZone).slice(0, 7);
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSUA || iPadOS;
}
