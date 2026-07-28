import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getMuscleGroups,
  getExercises,
  getWorkouts,
  getBodyWeights,
} from '../services/firebaseService';
import { MuscleGroup, Exercise, Workout, BodyWeight } from '../types';

interface DataContextType {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  workouts: Workout[];
  bodyWeights: BodyWeight[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  muscleGroups: [],
  exercises: [],
  workouts: [],
  bodyWeights: [],
  loading: true,
  refresh: async () => {},
});

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) {
      setMuscleGroups([]);
      setExercises([]);
      setWorkouts([]);
      setBodyWeights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [groups, exs, wks, bws] = await Promise.all([
        getMuscleGroups(user.uid).catch((err) => {
          console.error('Error loading muscleGroups:', err);
          return [] as MuscleGroup[];
        }),
        getExercises(user.uid).catch((err) => {
          console.error('Error loading exercises:', err);
          return [] as Exercise[];
        }),
        getWorkouts(user.uid).catch((err) => {
          console.error('Error loading workouts:', err);
          return [] as Workout[];
        }),
        getBodyWeights(user.uid).catch((err) => {
          console.error('Error loading bodyWeights:', err);
          return [] as BodyWeight[];
        }),
      ]);

      setMuscleGroups(groups);
      setExercises(exs);
      setWorkouts(wks);
      setBodyWeights(bws);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <DataContext.Provider
      value={{
        muscleGroups,
        exercises,
        workouts,
        bodyWeights,
        loading,
        refresh: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
