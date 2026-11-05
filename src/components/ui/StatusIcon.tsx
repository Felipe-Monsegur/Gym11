import type { CSSProperties } from 'react';

export type StatusType = 'success' | 'error' | 'info' | 'warning' | 'danger';

export const STATUS_COLORS: Record<StatusType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  danger: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
};

const PATHS: Record<StatusType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  danger: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  info: 'M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

type StatusIconProps = {
  type: StatusType;
  /** Diámetro del círculo en rem */
  size?: number;
};

export default function StatusIcon({ type, size = 2.5 }: StatusIconProps) {
  const style = {
    '--status-color': STATUS_COLORS[type],
    width: `${size}rem`,
    height: `${size}rem`,
  } as CSSProperties;

  return (
    <span className="ui-status-icon" style={style} aria-hidden="true">
      <svg
        style={{ width: `${size * 0.5}rem`, height: `${size * 0.5}rem` }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d={PATHS[type]} />
      </svg>
    </span>
  );
}
