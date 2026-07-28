export interface MuscleGroup {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  sortOrder?: number;
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
  weight: number; // kg
  completed?: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes?: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
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
