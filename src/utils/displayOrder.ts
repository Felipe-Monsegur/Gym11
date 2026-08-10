/** Orden manual (sortOrder) y, si falta, fecha de creación (más reciente primero, como antes). */

export type SortableEntity = {
  sortOrder?: number;
  createdAt?: unknown;
  id: string;
  name?: string;
};

export function createdAtToMs(createdAt: unknown): number {
  if (createdAt == null) return 0;
  if (typeof createdAt === 'string') {
    const t = Date.parse(createdAt);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof createdAt === 'object' && createdAt !== null) {
    const o = createdAt as { toDate?: () => Date; seconds?: number };
    if (typeof o.toDate === 'function') return o.toDate().getTime();
    if (typeof o.seconds === 'number') return o.seconds * 1000;
  }
  return 0;
}

export function compareByDisplayOrder(a: SortableEntity, b: SortableEntity): number {
  const ao = a.sortOrder;
  const bo = b.sortOrder;
  if (ao != null && bo != null && ao !== bo) return ao - bo;
  if (ao != null && bo == null) return -1;
  if (ao == null && bo != null) return 1;
  const ta = createdAtToMs(a.createdAt);
  const tb = createdAtToMs(b.createdAt);
  if (ta !== tb) return tb - ta;
  return (a.name ?? '').localeCompare(b.name ?? '');
}

export function sortByDisplayOrder<T extends SortableEntity>(items: T[]): T[] {
  return [...items].sort(compareByDisplayOrder);
}

/** Ordena ejercicios por orden del grupo muscular y luego por sortOrder del ejercicio. */
export function sortExercisesByMuscleGroup<
  T extends SortableEntity & { muscleGroupId: string },
>(exercises: T[], muscleGroups: SortableEntity[]): T[] {
  const groupOrder = new Map(
    sortByDisplayOrder(muscleGroups).map((g, index) => [g.id, index])
  );
  return [...exercises].sort((a, b) => {
    const ga = groupOrder.get(a.muscleGroupId) ?? Number.MAX_SAFE_INTEGER;
    const gb = groupOrder.get(b.muscleGroupId) ?? Number.MAX_SAFE_INTEGER;
    if (ga !== gb) return ga - gb;
    return compareByDisplayOrder(a, b);
  });
}
