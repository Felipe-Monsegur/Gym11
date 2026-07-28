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
      setLoading(false);
      return;
    }

    try {
      const [groups, exs, wks, bws] = await Promise.all([
        getMuscleGroups(user.uid),
        getExercises(user.uid),
        getWorkouts(user.uid),
        getBodyWeights(user.uid),
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
