import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(auth, email);
};

export const logout = async () => {
  return await signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'Este email ya está registrado. Iniciá sesión o usá “Olvidé mi contraseña” si nunca definiste una.',
  'auth/invalid-credential':
    'Email o contraseña incorrectos. Si antes entrabas con Google, usá “Olvidé mi contraseña” para crear una.',
  'auth/user-not-found': 'No hay cuenta con ese email. Creá una cuenta primero.',
  'auth/wrong-password':
    'Contraseña incorrecta. Si antes entrabas con Google, usá “Olvidé mi contraseña”.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'auth/missing-email': 'Ingresá tu email para recuperar la contraseña.',
};

export const getAuthErrorMessage = (err: unknown): string => {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  if (err instanceof Error && err.message) return err.message;
  return 'Error al autenticar';
};
