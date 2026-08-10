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
  deleteField,
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
import {
  INITIAL_EXERCISES,
  INITIAL_MUSCLE_GROUPS,
  INITIAL_PACK_VERSION,
} from '../data/initialPack';

export { INITIAL_PACK_VERSION };

const normalizePackName = (name: string) => name.trim().toLowerCase();

const packGroupDocId = (userId: string, key: string) => `${userId}__mg__${key}`;
const packExerciseDocId = (userId: string, groupKey: string, sortOrder: number) =>
  `${userId}__ex__${groupKey}__${sortOrder}`;

export type EnsureInitialPackResult = {
  groupsAdded: number;
  exercisesAdded: number;
  groupsUpdated: number;
  groupsRemoved: number;
  exercisesRemoved: number;
};

const ensurePackInflight = new Map<string, Promise<EnsureInitialPackResult>>();

const commitBatches = async (ops: Array<(batch: ReturnType<typeof writeBatch>) => void>) => {
  const CHUNK = 400;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + CHUNK)) op(batch);
    await batch.commit();
  }
};

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

/**
 * Completa el pack, evita carreras (ids fijos + mutex) y elimina duplicados por nombre.
 */
export const ensureInitialPack = async (userId: string): Promise<EnsureInitialPackResult> => {
  const inflight = ensurePackInflight.get(userId);
  if (inflight) return inflight;

  const promise = ensureInitialPackInner(userId).finally(() => {
    ensurePackInflight.delete(userId);
  });
  ensurePackInflight.set(userId, promise);
  return promise;
};

const ensureInitialPackInner = async (userId: string): Promise<EnsureInitialPackResult> => {
  let existingGroups = await getMuscleGroups(userId);
  let existingExercises = await getExercises(userId);
  const workouts = await getWorkouts(userId);

  let groupsRemoved = 0;
  let exercisesRemoved = 0;
  const dedupeOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  // --- Dedupe grupos por nombre ---
  const groupsByName = new Map<string, MuscleGroup[]>();
  for (const g of existingGroups) {
    const key = normalizePackName(g.name);
    const list = groupsByName.get(key) || [];
    list.push(g);
    groupsByName.set(key, list);
  }

  const groupIdRemap = new Map<string, string>();
  for (const list of groupsByName.values()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const keep = list[0];
    for (const dup of list.slice(1)) {
      groupIdRemap.set(dup.id, keep.id);
      for (const ex of existingExercises.filter((e) => e.muscleGroupId === dup.id)) {
        dedupeOps.push((batch) =>
          batch.update(doc(db, 'exercises', ex.id), {
            muscleGroupId: keep.id,
            color: keep.color,
          })
        );
        ex.muscleGroupId = keep.id;
        ex.color = keep.color;
      }
      dedupeOps.push((batch) => batch.delete(doc(db, 'muscleGroups', dup.id)));
      groupsRemoved++;
    }
  }

  if (groupIdRemap.size > 0) {
    existingGroups = existingGroups.filter((g) => !groupIdRemap.has(g.id));
  }

  // --- Dedupe ejercicios por nombre ---
  const exercisesByName = new Map<string, Exercise[]>();
  for (const e of existingExercises) {
    const key = normalizePackName(e.name);
    const list = exercisesByName.get(key) || [];
    list.push(e);
    exercisesByName.set(key, list);
  }

  const usedExerciseIds = new Set(
    workouts.flatMap((w) => w.exercises.map((we) => we.exerciseId))
  );
  const exerciseIdRemap = new Map<string, string>();

  for (const list of exercisesByName.values()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => {
      const aUsed = usedExerciseIds.has(a.id) ? 0 : 1;
      const bUsed = usedExerciseIds.has(b.id) ? 0 : 1;
      if (aUsed !== bUsed) return aUsed - bUsed;
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });
    const keep = list[0];
    for (const dup of list.slice(1)) {
      exerciseIdRemap.set(dup.id, keep.id);
      dedupeOps.push((batch) => batch.delete(doc(db, 'exercises', dup.id)));
      exercisesRemoved++;
    }
  }

  if (exerciseIdRemap.size > 0) {
    for (const workout of workouts) {
      let changed = false;
      const nextExercises = workout.exercises.map((we) => {
        const mapped = exerciseIdRemap.get(we.exerciseId);
        if (!mapped) return we;
        changed = true;
        return { ...we, exerciseId: mapped };
      });
      if (changed) {
        dedupeOps.push((batch) =>
          batch.update(doc(db, 'workouts', workout.id), { exercises: nextExercises })
        );
      }
    }
    existingExercises = existingExercises.filter((e) => !exerciseIdRemap.has(e.id));
  }

  if (dedupeOps.length > 0) {
    await commitBatches(dedupeOps);
  }

  // --- Completar pack con IDs determinísticos ---
  const groupByName = new Map(
    existingGroups.map((g) => [normalizePackName(g.name), g] as const)
  );
  const exerciseNames = new Set(existingExercises.map((e) => normalizePackName(e.name)));

  const now = Timestamp.now();
  const groupIdByKey = new Map<string, string>();
  const colorByKey = new Map<string, string>();
  let groupsAdded = 0;
  let exercisesAdded = 0;
  let groupsUpdated = 0;
  const seedOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const group of INITIAL_MUSCLE_GROUPS) {
    const existing = groupByName.get(normalizePackName(group.name));
    if (existing) {
      groupIdByKey.set(group.key, existing.id);
      colorByKey.set(group.key, existing.color);
      if (group.trackingMode === 'cardio' && existing.trackingMode !== 'cardio') {
        seedOps.push((batch) =>
          batch.update(doc(db, 'muscleGroups', existing.id), { trackingMode: 'cardio' })
        );
        groupsUpdated++;
      }
    } else {
      const id = packGroupDocId(userId, group.key);
      groupIdByKey.set(group.key, id);
      colorByKey.set(group.key, group.color);
      seedOps.push((batch) =>
        batch.set(doc(db, 'muscleGroups', id), {
          name: group.name,
          color: group.color,
          userId,
          sortOrder: group.sortOrder,
          trackingMode: group.trackingMode,
          createdAt: now,
        })
      );
      groupsAdded++;
    }
  }

  for (const exercise of INITIAL_EXERCISES) {
    if (exerciseNames.has(normalizePackName(exercise.name))) continue;
    const muscleGroupId = groupIdByKey.get(exercise.groupKey);
    if (!muscleGroupId) continue;
    const id = packExerciseDocId(userId, exercise.groupKey, exercise.sortOrder);
    seedOps.push((batch) =>
      batch.set(doc(db, 'exercises', id), {
        name: exercise.name,
        muscleGroupId,
        color: colorByKey.get(exercise.groupKey) || '#3b82f6',
        userId,
        sortOrder: exercise.sortOrder,
        createdAt: now,
      })
    );
    exerciseNames.add(normalizePackName(exercise.name));
    exercisesAdded++;
  }

  if (seedOps.length > 0) {
    await commitBatches(seedOps);
  }

  return {
    groupsAdded,
    exercisesAdded,
    groupsUpdated,
    groupsRemoved,
    exercisesRemoved,
  };
};

/** @deprecated Usar ensureInitialPack */
export const seedInitialPack = async (userId: string): Promise<boolean> => {
  const result = await ensureInitialPack(userId);
  return (
    result.groupsAdded > 0 ||
    result.exercisesAdded > 0 ||
    result.groupsUpdated > 0 ||
    result.groupsRemoved > 0 ||
    result.exercisesRemoved > 0
  );
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
  const payload: Record<string, unknown> = {
    date: workout.date,
    title: workout.title,
    exercises: workout.exercises.map((ex) => {
      const item: Record<string, unknown> = {
        exerciseId: ex.exerciseId,
        sets: ex.sets,
      };
      if (ex.notes?.trim()) item.notes = ex.notes.trim();
      return item;
    }),
    userId: workout.userId,
    createdAt: Timestamp.now(),
  };
  if (workout.notes?.trim()) payload.notes = workout.notes.trim();
  if (workout.durationMinutes != null && workout.durationMinutes > 0) {
    payload.durationMinutes = workout.durationMinutes;
  }
  const docRef = await addDoc(collection(db, 'workouts'), payload);
  return docRef.id;
};

export const updateWorkout = async (id: string, updates: Partial<Workout>): Promise<void> => {
  const updateData: Record<string, unknown> = {};
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.exercises !== undefined) {
    updateData.exercises = updates.exercises.map((ex) => {
      const item: Record<string, unknown> = {
        exerciseId: ex.exerciseId,
        sets: ex.sets,
      };
      if (ex.notes?.trim()) item.notes = ex.notes.trim();
      return item;
    });
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes.trim() ? updates.notes.trim() : deleteField();
  }
  if (updates.durationMinutes !== undefined) {
    updateData.durationMinutes =
      updates.durationMinutes != null && updates.durationMinutes > 0
        ? updates.durationMinutes
        : deleteField();
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
  const payload: Record<string, unknown> = {
    date: bodyWeight.date,
    weight: bodyWeight.weight,
    userId: bodyWeight.userId,
    createdAt: Timestamp.now(),
  };
  if (bodyWeight.notes?.trim()) {
    payload.notes = bodyWeight.notes.trim();
  }
  const docRef = await addDoc(collection(db, 'bodyWeights'), payload);
  return docRef.id;
};

export const updateBodyWeight = async (id: string, updates: Partial<BodyWeight>): Promise<void> => {
  const updateData: Record<string, unknown> = {};
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.weight !== undefined) updateData.weight = updates.weight;
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes.trim() ? updates.notes.trim() : deleteField();
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
  initialPackVersion?: number;
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
        initialPackVersion:
          typeof data.initialPackVersion === 'number' ? data.initialPackVersion : undefined,
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
