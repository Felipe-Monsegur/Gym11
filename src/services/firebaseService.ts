import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { compareByDisplayOrder } from '../utils/displayOrder';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';
import {
  MuscleGroup,
  Exercise,
  Workout,
  BodyWeight,
  AccessRequest,
  AccessRequestStatus,
  AllowedUser,
} from '../types';

const mapAllowedUser = (id: string, data: Record<string, unknown>): AllowedUser => ({
  id,
  email: String(data.email || ''),
  userId: data.userId ? String(data.userId) : undefined,
  isAdmin: Boolean(data.isAdmin),
  addedAt: data.addedAt && typeof (data.addedAt as { toDate?: () => Date }).toDate === 'function'
    ? (data.addedAt as { toDate: () => Date }).toDate().toISOString()
    : undefined,
});

export const allowedUserEmailDocId = (email: string) => email.toLowerCase().trim();

const buildAllowedUserPayload = (
  email: string,
  userId: string,
  options?: { isAdmin?: boolean }
) => ({
  email: allowedUserEmailDocId(email),
  userId,
  addedAt: Timestamp.now(),
  ...(options?.isAdmin ? { isAdmin: true } : {}),
});

// ============ USUARIOS PERMITIDOS (LISTA BLANCA) ============
export const getAllowedUserRecord = async (
  userId: string,
  email: string
): Promise<AllowedUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'allowedUsers', userId));
    if (userDoc.exists()) {
      return mapAllowedUser(userDoc.id, userDoc.data() as Record<string, unknown>);
    }

    const emailLower = allowedUserEmailDocId(email || '');
    if (!emailLower) return null;

    const emailDoc = await getDoc(doc(db, 'allowedUsers', emailLower));
    if (emailDoc.exists()) {
      return mapAllowedUser(emailDoc.id, emailDoc.data() as Record<string, unknown>);
    }

    const emailQuery = query(collection(db, 'allowedUsers'), where('email', '==', emailLower));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      const d = emailSnapshot.docs[0];
      return mapAllowedUser(d.id, d.data() as Record<string, unknown>);
    }
    return null;
  } catch (error) {
    console.error('Error al verificar usuario permitido:', error);
    return null;
  }
};

export const ensureAllowedUserEmailIndex = async (
  userId: string,
  email: string,
  record: AllowedUser
): Promise<void> => {
  const emailId = allowedUserEmailDocId(email);
  if (!emailId) return;
  const emailDoc = await getDoc(doc(db, 'allowedUsers', emailId));
  if (emailDoc.exists()) return;
  await setDoc(doc(db, 'allowedUsers', emailId), buildAllowedUserPayload(email, userId, {
    isAdmin: record.isAdmin,
  }));
};

export const mirrorAllowedUserUidDoc = async (
  userId: string,
  email: string,
  record: AllowedUser
): Promise<void> => {
  const uidDoc = await getDoc(doc(db, 'allowedUsers', userId));
  if (uidDoc.exists()) return;
  await setDoc(doc(db, 'allowedUsers', userId), buildAllowedUserPayload(email, userId, {
    isAdmin: record.isAdmin,
  }));
};

export const isUserAllowed = async (userId: string, email: string): Promise<boolean> => {
  const record = await getAllowedUserRecord(userId, email);
  return record !== null;
};

export const addAllowedUser = async (
  email: string,
  userId: string,
  options?: { isAdmin?: boolean }
): Promise<void> => {
  const payload = buildAllowedUserPayload(email, userId, options);
  await setDoc(doc(db, 'allowedUsers', userId), payload);
  await setDoc(doc(db, 'allowedUsers', allowedUserEmailDocId(email)), payload);
};

export const getAllowedUsers = async (): Promise<AllowedUser[]> => {
  const snapshot = await getDocs(collection(db, 'allowedUsers'));
  const all = snapshot.docs.map((d) => mapAllowedUser(d.id, d.data() as Record<string, unknown>));

  const isEmailDocId = (id: string) => id.includes('@');
  const docPriority = (row: AllowedUser) => {
    if (row.userId && row.id === row.userId) return 3;
    if (!isEmailDocId(row.id)) return 2;
    return 1;
  };

  const bestByUser = new Map<string, AllowedUser>();
  for (const row of all) {
    const userId = row.userId || (isEmailDocId(row.id) ? undefined : row.id);
    const key = userId || allowedUserEmailDocId(row.email || row.id);
    if (!key) continue;

    const candidate: AllowedUser = {
      ...row,
      id: userId || row.id,
      userId: userId || row.id,
      email: row.email || row.id,
    };

    const existing = bestByUser.get(key);
    if (!existing || docPriority(row) > docPriority(existing)) {
      bestByUser.set(key, candidate);
    }
  }

  return Array.from(bestByUser.values()).sort((a, b) => a.email.localeCompare(b.email, 'es'));
};

export const removeAllowedUser = async (userIdOrEmail: string): Promise<void> => {
  const byId = doc(db, 'allowedUsers', userIdOrEmail);
  const snap = await getDoc(byId);
  if (snap.exists()) {
    const data = snap.data() as Record<string, unknown>;
    const uid = data.userId ? String(data.userId) : userIdOrEmail;
    const email = data.email ? String(data.email) : '';
    await deleteDoc(byId);
    if (email) {
      await deleteDoc(doc(db, 'allowedUsers', allowedUserEmailDocId(email)));
    }
    if (uid !== byId.id) {
      await deleteDoc(doc(db, 'allowedUsers', uid));
    }
    return;
  }
  const emailQuery = query(
    collection(db, 'allowedUsers'),
    where('email', '==', allowedUserEmailDocId(userIdOrEmail))
  );
  const snapshot = await getDocs(emailQuery);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
};

// ============ PEDIDOS DE ACCESO ============
const mapAccessRequest = (id: string, data: Record<string, unknown>): AccessRequest => {
  const toIso = (v: unknown) =>
    v && typeof (v as { toDate?: () => Date }).toDate === 'function'
      ? (v as { toDate: () => Date }).toDate().toISOString()
      : typeof v === 'string'
        ? v
        : '';
  return {
    id,
    email: String(data.email || ''),
    displayName: String(data.displayName || ''),
    photoURL: String(data.photoURL || ''),
    status: (data.status as AccessRequestStatus) || 'pending',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export const getMyAccessRequest = async (uid: string): Promise<AccessRequest | null> => {
  const snap = await getDoc(doc(db, 'accessRequests', uid));
  if (!snap.exists()) return null;
  return mapAccessRequest(snap.id, snap.data() as Record<string, unknown>);
};

export const requestAccess = async (user: User): Promise<AccessRequest> => {
  const ref = doc(db, 'accessRequests', user.uid);
  const existing = await getDoc(ref);
  const now = Timestamp.now();
  const payload = {
    email: (user.email || '').toLowerCase(),
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    status: 'pending' as const,
    updatedAt: now,
  };
  if (existing.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, createdAt: now });
  }
  const snap = await getDoc(ref);
  return mapAccessRequest(snap.id, snap.data() as Record<string, unknown>);
};

export const listAccessRequests = async (): Promise<AccessRequest[]> => {
  const snapshot = await getDocs(collection(db, 'accessRequests'));
  return snapshot.docs
    .map((d) => mapAccessRequest(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const approveAccessRequest = async (request: AccessRequest): Promise<void> => {
  await addAllowedUser(request.email, request.id);
  await updateDoc(doc(db, 'accessRequests', request.id), {
    status: 'approved',
    updatedAt: Timestamp.now(),
  });
};

export const denyAccessRequest = async (requestId: string): Promise<void> => {
  await updateDoc(doc(db, 'accessRequests', requestId), {
    status: 'denied',
    updatedAt: Timestamp.now(),
  });
};

// ============ GRUPOS MUSCULARES ============
export const getMuscleGroups = async (userId: string): Promise<MuscleGroup[]> => {
  const q = query(collection(db, 'muscleGroups'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate?.().toISOString() || docSnap.data().createdAt,
  })) as MuscleGroup[];
  list.sort(compareByDisplayOrder);
  return list;
};

export const addMuscleGroup = async (muscleGroup: Omit<MuscleGroup, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'muscleGroups'), {
    ...muscleGroup,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateMuscleGroup = async (id: string, updates: Partial<MuscleGroup>): Promise<void> => {
  await updateDoc(doc(db, 'muscleGroups', id), updates);
};

export const deleteMuscleGroup = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'muscleGroups', id));
};

export const reorderMuscleGroups = async (orderedIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'muscleGroups', id), { sortOrder: index });
  });
  await batch.commit();
};

// ============ EJERCICIOS ============
export const getExercises = async (userId: string): Promise<Exercise[]> => {
  const q = query(collection(db, 'exercises'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate?.().toISOString() || docSnap.data().createdAt,
  })) as Exercise[];
  list.sort(compareByDisplayOrder);
  return list;
};

export const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'exercises'), {
    ...exercise,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateExercise = async (id: string, updates: Partial<Exercise>): Promise<void> => {
  await updateDoc(doc(db, 'exercises', id), updates);
};

export const deleteExercise = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'exercises', id));
};

export const reorderExercises = async (orderedIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'exercises', id), { sortOrder: index });
  });
  await batch.commit();
};

// ============ ENTRENAMIENTOS ============
export const getWorkouts = async (userId: string): Promise<Workout[]> => {
  const q = query(collection(db, 'workouts'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate?.().toISOString().split('T')[0] || data.date,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      exercises: data.exercises || [],
    };
  }) as Workout[];
  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return list;
};

export const addWorkout = async (workout: Omit<Workout, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'workouts'), {
    ...workout,
    date: Timestamp.fromDate(new Date(workout.date)),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateWorkout = async (id: string, updates: Partial<Workout>): Promise<void> => {
  const updateData: Record<string, unknown> = { ...updates };
  if (updates.date) {
    updateData.date = Timestamp.fromDate(new Date(updates.date));
  }
  await updateDoc(doc(db, 'workouts', id), updateData);
};

export const deleteWorkout = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'workouts', id));
};

// ============ PESO CORPORAL ============
export const getBodyWeights = async (userId: string): Promise<BodyWeight[]> => {
  const q = query(collection(db, 'bodyWeights'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate?.().toISOString().split('T')[0] || data.date,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
    };
  }) as BodyWeight[];
  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return list;
};

export const addBodyWeight = async (bodyWeight: Omit<BodyWeight, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'bodyWeights'), {
    ...bodyWeight,
    date: Timestamp.fromDate(new Date(bodyWeight.date)),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBodyWeight = async (id: string, updates: Partial<BodyWeight>): Promise<void> => {
  const updateData: Record<string, unknown> = { ...updates };
  if (updates.date) {
    updateData.date = Timestamp.fromDate(new Date(updates.date));
  }
  await updateDoc(doc(db, 'bodyWeights', id), updateData);
};

export const deleteBodyWeight = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'bodyWeights', id));
};

// ============ CONFIGURACIÓN DE USUARIO (TEMA Y PREFERENCIAS) ============
export interface UserSettings {
  theme?: 'dark' | 'light';
  headerColorDark?: string;
  headerColorLight?: string;
  headerTitle?: string;
}

export const getUserTheme = async (userId: string): Promise<'dark' | 'light' | null> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    if (userSettingsSnap.exists()) {
      const data = userSettingsSnap.data();
      return data.theme || null;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener tema del usuario:', error);
    return null;
  }
};

export const saveUserTheme = async (userId: string, theme: 'dark' | 'light'): Promise<void> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    await setDoc(userSettingsRef, {
      userId,
      theme,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error al guardar tema del usuario:', error);
    throw error;
  }
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    if (userSettingsSnap.exists()) {
      const data = userSettingsSnap.data();
      return {
        theme: data.theme || null,
        headerColorDark: data.headerColorDark || null,
        headerColorLight: data.headerColorLight || null,
        headerTitle: data.headerTitle || null,
      };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener configuraciones del usuario:', error);
    return null;
  }
};

export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    await setDoc(userSettingsRef, {
      userId,
      ...settings,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuraciones del usuario:', error);
    throw error;
  }
};
