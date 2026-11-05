import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveUserTheme, getUserSettings, saveUserSettings } from '../services/firebaseService';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  headerColor: string;
  headerTitle: string;
  loginBgColor: string;
  headerColorDark: string;
  headerColorLight: string;
  updateHeaderColorDark: (color: string) => Promise<void>;
  updateHeaderColorLight: (color: string) => Promise<void>;
  updateHeaderTitle: (title: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  headerColor: '#A80000',
  headerTitle: 'Gym11',
  loginBgColor: '#A80000',
  headerColorDark: '#A80000',
  headerColorLight: '#1e3a8a',
  updateHeaderColorDark: async () => {},
  updateHeaderColorLight: async () => {},
  updateHeaderTitle: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // Cargar tema inicial de localStorage inmediatamente
  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return 'dark'; // Tema por defecto
  };
  
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [loading, setLoading] = useState(!!user); // Solo loading si hay usuario
  const [headerColorDark, setHeaderColorDark] = useState<string>('#A80000');
  const [headerColorLight, setHeaderColorLight] = useState<string>('#1e3a8a');
  const [headerTitle, setHeaderTitle] = useState<string>('Gym11');

  // Color del header según el tema actual (calculado dinámicamente)
  const headerColor = theme === 'dark' ? headerColorDark : headerColorLight;
  
  // Colores según el tema
  const loginBgColor = theme === 'dark' ? headerColorDark : headerColorLight;

  // Cargar tema y preferencias del usuario al iniciar sesión
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          // Cargar todas las configuraciones del usuario
          const settings = await getUserSettings(user.uid);
          
          if (settings) {
            // Cargar tema
            if (settings.theme) {
              setTheme(settings.theme);
              localStorage.setItem('theme', settings.theme);
            } else {
              // Si no hay tema en Firestore, usar localStorage como fallback
              const localTheme = localStorage.getItem('theme') as Theme | null;
              if (localTheme === 'dark' || localTheme === 'light') {
                setTheme(localTheme);
                await saveUserTheme(user.uid, localTheme);
              }
            }
            
            // Cargar colores del header personalizados
            if (settings.headerColorDark) {
              setHeaderColorDark(settings.headerColorDark);
            }
            if (settings.headerColorLight) {
              setHeaderColorLight(settings.headerColorLight);
            }
            
            // Cargar título del header personalizado
            if (settings.headerTitle) {
              setHeaderTitle(settings.headerTitle);
            }
          }
        } catch (error) {
          console.error('Error al cargar configuraciones:', error);
          // En caso de error, usar localStorage como fallback
          const localTheme = localStorage.getItem('theme') as Theme | null;
          if (localTheme === 'dark' || localTheme === 'light') {
            setTheme(localTheme);
          }
        }
        setLoading(false);
      } else {
        // Si no hay usuario, cargar de localStorage
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
        setLoading(false);
      }
    };

    loadTheme();
  }, [user]);
  
  // Guardar tema cuando cambia
  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Guardar siempre en localStorage inmediatamente
    localStorage.setItem('theme', newTheme);

    if (user) {
      try {
        await saveUserTheme(user.uid, newTheme);
        // También actualizar en userSettings
        await saveUserSettings(user.uid, { theme: newTheme });
      } catch (error) {
        console.error('Error al guardar tema:', error);
      }
    }
  };

  // Funciones para actualizar preferencias
  const updateHeaderColorDark = async (color: string) => {
    // Validar color antes de actualizar
    if (!color || !color.startsWith('#')) {
      console.error('Color inválido:', color);
      return;
    }
    
    setHeaderColorDark(color);
    
    // Guardar el color del header oscuro
    if (user) {
      try {
        await saveUserSettings(user.uid, { headerColorDark: color });
      } catch (error) {
        console.error('Error al guardar color del header oscuro:', error);
      }
    }
  };

  const updateHeaderColorLight = async (color: string) => {
    // Validar color antes de actualizar
    if (!color || !color.startsWith('#')) {
      console.error('Color inválido:', color);
      return;
    }
    
    setHeaderColorLight(color);
    
    // Guardar el color del header claro
    if (user) {
      try {
        await saveUserSettings(user.uid, { headerColorLight: color });
      } catch (error) {
        console.error('Error al guardar color del header claro:', error);
      }
    }
  };

  const updateHeaderTitle = async (title: string) => {
    setHeaderTitle(title);
    if (user) {
      try {
        await saveUserSettings(user.uid, { headerTitle: title });
      } catch (error) {
        console.error('Error al guardar título del header:', error);
      }
    }
  };

  // Aplicar tema y color de header al body (tokens CSS globales)
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    document.documentElement.style.setProperty('--header-color', headerColor);
  }, [theme, headerColor]);

  if (loading) {
    return null; // O un loader si prefieres
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      headerColor, 
      headerTitle,
      loginBgColor,
      headerColorDark,
      headerColorLight,
      updateHeaderColorDark,
      updateHeaderColorLight,
      updateHeaderTitle,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

