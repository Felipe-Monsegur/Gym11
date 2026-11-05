import type { CSSProperties } from 'react';

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

/** Bloque de carga con shimmer; el tamaño lo define className (ej. "h-6 w-32"). */
export default function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`ui-skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}
