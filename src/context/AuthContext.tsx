import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../services/authService';
import {
  addAllowedUser,
  ensureAllowedUserEmailIndex,
  getAllowedUserRecord,
  mirrorAllowedUserUidDoc,
} from '../services/firebaseService';
import { isAdminEmail } from '../config/admins';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAllowed: boolean;
  isAdmin: boolean;
  checkingAccess: boolean;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAllowed: false,
  isAdmin: false,
  checkingAccess: true,
  refreshAccess: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const checkAccess = async (current: User | null) => {
    if (!current) {
      setIsAllowed(false);
      setIsAdmin(false);
      setCheckingAccess(false);
      return;
    }
    setCheckingAccess(true);
    try {
      const email = current.email || '';
      const adminByConfig = isAdminEmail(email);
      let record = await getAllowedUserRecord(current.uid, email);

      if (adminByConfig && !record) {
        try {
          await addAllowedUser(email, current.uid, { isAdmin: true });
          record = await getAllowedUserRecord(current.uid, email);
        } catch (bootstrapError) {
          console.warn('No se pudo crear allowedUsers de admin:', bootstrapError);
        }
      }

      if (record && email) {
        try {
          if (record.id === current.uid) {
            await ensureAllowedUserEmailIndex(current.uid, email, {
              ...record,
              isAdmin: record.isAdmin || adminByConfig,
            });
          } else {
            await mirrorAllowedUserUidDoc(current.uid, email, {
              ...record,
              isAdmin: record.isAdmin || adminByConfig,
            });
            record = await getAllowedUserRecord(current.uid, email);
          }
        } catch (syncError) {
          console.warn('No se pudo sincronizar allowedUsers:', syncError);
        }
      }

      const allowed = record !== null || adminByConfig;
      setIsAllowed(allowed);
      setIsAdmin(Boolean(record?.isAdmin) || adminByConfig);
    } catch (error) {
      console.error('Error al verificar acceso:', error);
      const adminByConfig = isAdminEmail(current.email);
      setIsAllowed(adminByConfig);
      setIsAdmin(adminByConfig);
    } finally {
      setCheckingAccess(false);
    }
  };

  const refreshAccess = async () => {
    await checkAccess(user);
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      await checkAccess(nextUser);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAllowed, isAdmin, checkingAccess, refreshAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
