import { TrackingMode } from '../types';

/** Subir este número cuando cambie el pack para reaplicar ítems faltantes / dedupe a usuarios existentes. */
export const INITIAL_PACK_VERSION = 2;

export interface InitialMuscleGroup {
  key: string;
  name: string;
  color: string;
  sortOrder: number;
  trackingMode: TrackingMode;
}

export interface InitialExercise {
  groupKey: string;
  name: string;
  sortOrder: number;
}

export const INITIAL_MUSCLE_GROUPS: InitialMuscleGroup[] = [
  { key: 'pecho', name: 'Pecho', color: '#EF4444', sortOrder: 0, trackingMode: 'strength' },
  { key: 'espalda', name: 'Espalda', color: '#3B82F6', sortOrder: 1, trackingMode: 'strength' },
  { key: 'hombros', name: 'Hombros', color: '#F59E0B', sortOrder: 2, trackingMode: 'strength' },
  { key: 'biceps', name: 'Bíceps', color: '#8B5CF6', sortOrder: 3, trackingMode: 'strength' },
  { key: 'triceps', name: 'Tríceps', color: '#EC4899', sortOrder: 4, trackingMode: 'strength' },
  { key: 'piernas', name: 'Piernas', color: '#14B8A6', sortOrder: 5, trackingMode: 'strength' },
  { key: 'core', name: 'Core', color: '#F97316', sortOrder: 6, trackingMode: 'strength' },
  { key: 'cardio', name: 'Cardio', color: '#10B981', sortOrder: 7, trackingMode: 'cardio' },
];

export const INITIAL_EXERCISES: InitialExercise[] = [
  // Pecho
  { groupKey: 'pecho', name: 'Press banca', sortOrder: 0 },
  { groupKey: 'pecho', name: 'Press inclinado', sortOrder: 1 },
  { groupKey: 'pecho', name: 'Aperturas', sortOrder: 2 },
  { groupKey: 'pecho', name: 'Fondos', sortOrder: 3 },
  // Espalda
  { groupKey: 'espalda', name: 'Dominadas', sortOrder: 0 },
  { groupKey: 'espalda', name: 'Remo con barra', sortOrder: 1 },
  { groupKey: 'espalda', name: 'Jalón al pecho', sortOrder: 2 },
  { groupKey: 'espalda', name: 'Remo mancuerna', sortOrder: 3 },
  // Hombros
  { groupKey: 'hombros', name: 'Press militar', sortOrder: 0 },
  { groupKey: 'hombros', name: 'Elevaciones laterales', sortOrder: 1 },
  { groupKey: 'hombros', name: 'Pájaros', sortOrder: 2 },
  // Bíceps
  { groupKey: 'biceps', name: 'Curl barra', sortOrder: 0 },
  { groupKey: 'biceps', name: 'Curl mancuernas', sortOrder: 1 },
  { groupKey: 'biceps', name: 'Curl martillo', sortOrder: 2 },
  // Tríceps
  { groupKey: 'triceps', name: 'Extensión polea', sortOrder: 0 },
  { groupKey: 'triceps', name: 'Press francés', sortOrder: 1 },
  { groupKey: 'triceps', name: 'Fondos tríceps', sortOrder: 2 },
  // Piernas
  { groupKey: 'piernas', name: 'Sentadilla', sortOrder: 0 },
  { groupKey: 'piernas', name: 'Prensa', sortOrder: 1 },
  { groupKey: 'piernas', name: 'Peso muerto rumano', sortOrder: 2 },
  { groupKey: 'piernas', name: 'Curl femoral', sortOrder: 3 },
  { groupKey: 'piernas', name: 'Extensión cuádriceps', sortOrder: 4 },
  { groupKey: 'piernas', name: 'Elevación de gemelos', sortOrder: 5 },
  // Core
  { groupKey: 'core', name: 'Crunch', sortOrder: 0 },
  { groupKey: 'core', name: 'Plancha', sortOrder: 1 },
  { groupKey: 'core', name: 'Elevación de piernas', sortOrder: 2 },
  // Cardio
  { groupKey: 'cardio', name: 'Cinta', sortOrder: 0 },
  { groupKey: 'cardio', name: 'Bici', sortOrder: 1 },
  { groupKey: 'cardio', name: 'Elíptico', sortOrder: 2 },
  { groupKey: 'cardio', name: 'Remo cardio', sortOrder: 3 },
];
