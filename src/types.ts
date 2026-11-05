export type TrackingMode = 'strength' | 'cardio';

export interface MuscleGroup {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  sortOrder?: number;
  /** strength = reps × kg; cardio = reps × minutos */
  trackingMode?: TrackingMode;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroupId: string;
  notes?: string;
  color: string;
  userId: string;
  createdAt: string;
  sortOrder?: number;
}

export interface WorkoutSet {
  reps: number;
  weight: number; // kg (fuerza)
  /** Minutos por serie (cardio) */
  durationMinutes?: number;
  completed?: boolean;
}

/** total = barra/máquina (peso total); dumbbell = mancuernas (peso de cada una, "kg c/u"). */
export type Equipment = 'total' | 'dumbbell';

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
  /** Sin valor = 'total' (datos viejos). */
  equipment?: Equipment;
}

/** Sin valor = 'done' (datos viejos). */
export type WorkoutStatus = 'in_progress' | 'done';

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes?: string;
  /** Solo en entrenamientos viejos; ya no se edita. */
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  status?: WorkoutStatus;
  userId: string;
  createdAt: string;
}

export interface BodyWeight {
  id: string;
  date: string;
  weight: number; // kg
  notes?: string;
  userId: string;
  createdAt: string;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequest {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  status: AccessRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AllowedUser {
  id: string;
  email: string;
  userId?: string;
  isAdmin?: boolean;
  addedAt?: string;
}

export interface GymData {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  workouts: Workout[];
  bodyWeights: BodyWeight[];
}
