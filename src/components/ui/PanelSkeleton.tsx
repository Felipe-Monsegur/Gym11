import Skeleton from './Skeleton';

/** Esqueleto de carga para paneles de datos: filtros + tabla + gráfico. */
export default function PanelSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-14 !rounded-[var(--radius-panel)]" />
      <Skeleton className="h-72 !rounded-[var(--radius-panel)]" />
      <Skeleton className="h-64 !rounded-[var(--radius-panel)]" />
    </div>
  );
}
