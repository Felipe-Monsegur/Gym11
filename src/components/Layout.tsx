import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getInProgressWorkout } from '../utils/gymStats';
import { logout } from '../services/authService';
import ProfileModal from './ProfileModal';

interface LayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' as const },
  { path: '/entrenamientos', label: 'Historial', icon: 'history' as const },
  { path: '/progreso', label: 'Progreso', icon: 'progress' as const },
  { path: '/peso', label: 'Peso', icon: 'scale' as const },
  { path: '/gestion', label: 'Gestión', icon: 'settings' as const },
];

type NavIconName = (typeof navItems)[number]['icon'];

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    className: 'w-[18px] h-[18px] shrink-0',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </svg>
      );
    case 'history':
      return (
        <svg {...common}>
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'progress':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 5-6" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...common}>
          {/* Balanza de baño: cuerpo, dial y aguja */}
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
          <path d="M8 10a4 4 0 0 1 8 0" />
          <path d="M12 10l1.6-2.2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.2M12 18.8V21M4.9 6.3l1.6 1.5M17.5 16.2l1.6 1.5M3 12h2.2M18.8 12H21M4.9 17.7l1.6-1.5M17.5 7.8l1.6-1.5" />
        </svg>
      );
  }
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

const NEW_WORKOUT_PATH = '/entrenamientos/nuevo';

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, headerColor, headerTitle } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { workouts } = useData();
  // Si hay un entrenamiento abierto, la acción rápida lo retoma en vez de crear otro.
  const inProgress = getInProgressWorkout(workouts);
  const workoutPath = inProgress ? `/entrenamientos/${inProgress.id}` : NEW_WORKOUT_PATH;
  const workoutLabel = inProgress ? 'Continuar' : 'Entrenamiento';
  const workoutTitle = inProgress ? 'Continuar entrenamiento en curso' : 'Nuevo entrenamiento';

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Las transiciones del sidebar se activan recién después del primer frame para que no anime al cargar.
    const id = window.requestAnimationFrame(() => {
      document.documentElement.classList.add('sidebar-ready');
    });
    return () => {
      window.cancelAnimationFrame(id);
      document.documentElement.classList.remove('sidebar-ready');
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path ||
        (location.pathname.startsWith(`${path}/`) && location.pathname !== NEW_WORKOUT_PATH);

  const brandName = headerTitle.trim() || 'Gym11';
  const actionStyle = { backgroundColor: headerColor, color: '#fff' };

  return (
    <div className={`app-shell${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <div
        className={`app-sidebar-overlay${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`app-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Navegación principal">
        <div className="app-sidebar-head">
          <Link to="/" className="app-sidebar-brand" title="Ir al inicio">
            <img
              src="/logo.svg?v=8"
              alt=""
              className="w-9 h-9 rounded-xl shadow-soft ring-1 ring-[var(--border)] shrink-0"
            />
            <span className="app-sidebar-label truncate">{brandName}</span>
          </Link>

          <button
            type="button"
            className="app-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú'}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú'}
            aria-pressed={sidebarCollapsed}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`app-sidebar-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                aria-label={item.label}
              >
                <NavIcon name={item.icon} />
                <span className="app-sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-actions">
          <Link
            to={workoutPath}
            className="nav-action-btn flex items-center justify-center"
            style={actionStyle}
            title={workoutTitle}
            aria-label={workoutTitle}
          >
            <PlusIcon className="w-4 h-4 shrink-0" />
            <span className="app-sidebar-label">{workoutLabel}</span>
          </Link>
        </div>

        <div className="app-sidebar-footer">
          <button
            type="button"
            onClick={toggleTheme}
            className="app-sidebar-link w-full text-left"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C15.53 21 18.59 18.96 20.06 16C20.06 16 14 17.5 11 13C8 8.5 12 3 12 3Z"
                />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
            <span className="app-sidebar-label">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="app-sidebar-link w-full text-left"
            title="Perfil"
            aria-label="Perfil"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="app-sidebar-label truncate">Perfil</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="app-sidebar-link w-full text-left"
            title="Salir"
            aria-label="Salir"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18.75 15l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span className="app-sidebar-label">Salir</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <main className="app-content animate-fade-up">{children}</main>
      </div>

      <nav className="app-mobile-tabs" aria-label="Secciones">
        {navItems.slice(0, 4).map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-mobile-tab${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className="app-mobile-tab" onClick={() => setSidebarOpen(true)} aria-label="Más opciones">
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span>Más</span>
        </button>
      </nav>

      <nav className="app-mobile-actions" aria-label="Acciones rápidas">
        <Link
          to={workoutPath}
          className="nav-action-btn flex"
          style={actionStyle}
          title={workoutTitle}
          aria-label={workoutTitle}
        >
          <PlusIcon />
          <span>{workoutLabel}</span>
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-6 sm:right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-soft transition-opacity hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
          showBackToTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Volver arriba"
        title="Volver arriba"
        tabIndex={showBackToTop ? 0 : -1}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}
