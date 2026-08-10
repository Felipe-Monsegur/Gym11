import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getMuscleGroups,
  getExercises,
  getWorkouts,
  getBodyWeights,
  ensureInitialPack,
  getUserSettings,
  saveUserSettings,
  INITIAL_PACK_VERSION,
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
  const { user, isAllowed, checkingAccess, loading: authLoading } = useAuth();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user || !isAllowed) {
      setMuscleGroups([]);
      setExercises([]);
      setWorkouts([]);
      setBodyWeights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Primero el pack (cuenta nueva / faltantes), después leer todo.
      try {
        const settings = await getUserSettings(user.uid).catch(() => null);
        const packVersion = settings?.initialPackVersion ?? 0;
        if (packVersion < INITIAL_PACK_VERSION) {
          await ensureInitialPack(user.uid);
          await saveUserSettings(user.uid, { initialPackVersion: INITIAL_PACK_VERSION });
        } else {
          // Aun con versión al día, si no hay grupos (borró todo o falló un seed previo) reponer pack.
          const currentGroups = await getMuscleGroups(user.uid);
          if (currentGroups.length === 0) {
            await ensureInitialPack(user.uid);
          }
        }
      } catch (err) {
        console.error('Error ensuring initial pack:', err);
      }

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

      // Último recurso: si sigue vacío, reintentar pack una vez.
      if (groups.length === 0) {
        try {
          await ensureInitialPack(user.uid);
          await saveUserSettings(user.uid, { initialPackVersion: INITIAL_PACK_VERSION });
          const [retryGroups, retryExs] = await Promise.all([
            getMuscleGroups(user.uid),
            getExercises(user.uid),
          ]);
          setMuscleGroups(retryGroups);
          setExercises(retryExs);
          setWorkouts(wks);
          setBodyWeights(bws);
          return;
        } catch (err) {
          console.error('Error retrying initial pack:', err);
        }
      }

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
    if (authLoading || checkingAccess) {
      setLoading(true);
      return;
    }
    void loadData();
  }, [user, isAllowed, authLoading, checkingAccess]);

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
