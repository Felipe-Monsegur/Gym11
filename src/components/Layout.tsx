import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../services/authService';
import ProfileModal from './ProfileModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme, headerColor, headerTitle } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavScrolled(y > 6);
      setShowBackToTop(y > 280);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' as const },
    { path: '/entrenamientos', label: 'Historial', icon: 'history' as const },
    { path: '/progreso', label: 'Progreso', icon: 'progress' as const },
    { path: '/peso', label: 'Peso', icon: 'scale' as const },
    { path: '/gestion', label: 'Gestión', icon: 'settings' as const },
  ];

  const NavIcon = ({ name }: { name: (typeof navItems)[number]['icon'] }) => {
    const common = {
      className: 'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0',
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
            <path d="M12 3v1m0 16v1m-9-9h1m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
            <circle cx="12" cy="12" r="4" />
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
  };

  const headerBtn =
    'h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 text-white border border-white/10';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header relative z-50 text-white">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              title="Ir al inicio"
            >
              <img
                src="/logo.svg?v=8"
                alt="Logo de Gym11"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-md ring-1 ring-white/20"
              />
              {headerTitle.replace(/💰\s*/g, '').trim() || 'Gym11'}
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className={headerBtn}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? (
                  <svg 
                    key={theme}
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path 
                      fill="none" 
                      stroke="currentColor" 
                      strokeDasharray="64" 
                      strokeDashoffset="64" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C15.53 21 18.59 18.96 20.06 16C20.06 16 14 17.5 11 13C8 8.5 12 3 12 3Z"
                    >
                      <animate 
                        fill="freeze" 
                        attributeName="stroke-dashoffset" 
                        dur="0.6s" 
                        values="64;0"
                      />
                    </path>
                  </svg>
                ) : (
                  <svg 
                    key={theme}
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                      <path 
                        strokeDasharray="34" 
                        strokeDashoffset="34" 
                        d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7"
                      >
                        <animate 
                          fill="freeze" 
                          attributeName="stroke-dashoffset" 
                          dur="0.4s" 
                          values="34;0"
                        />
                      </path>
                      <g strokeDasharray="2" strokeDashoffset="2">
                        <path d="M0 0">
                          <animate 
                            fill="freeze" 
                            attributeName="d" 
                            begin="0.5s" 
                            dur="0.2s" 
                            values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"
                          />
                          <animate 
                            fill="freeze" 
                            attributeName="stroke-dashoffset" 
                            begin="0.5s" 
                            dur="0.2s" 
                            values="2;0"
                          />
                        </path>
                        <path d="M0 0">
                          <animate 
                            fill="freeze" 
                            attributeName="d" 
                            begin="0.7s" 
                            dur="0.2s" 
                            values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"
                          />
                          <animate 
                            fill="freeze" 
                            attributeName="stroke-dashoffset" 
                            begin="0.7s" 
                            dur="0.2s" 
                            values="2;0"
                          />
                        </path>
                      </g>
                    </g>
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className={headerBtn}
                title="Mi perfil"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                <span className="text-xs sm:text-sm hidden sm:inline font-medium">{user?.email}</span>
              </button>
              <button
                onClick={handleLogout}
                className={headerBtn}
                title="Salir"
                aria-label="Salir"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18.75 15l3-3m0 0l-3-3m3 3H9" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`app-nav sticky top-0 z-50${navScrolled ? ' app-nav-scrolled' : ''}`}>
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 py-2">
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link inline-flex items-center gap-1.5 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 ${
                      active
                        ? 'nav-link-active'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                          : 'text-slate-700 hover:bg-black/5 hover:text-slate-900'
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-nowrap gap-1 sm:gap-2 items-center w-full sm:w-auto">
              <Link
                to="/entrenamientos/nuevo"
                className="nav-action-btn bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-green-700 transition-colors flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
                title="Nuevo entrenamiento"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Entrenar</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-5 sm:py-7 animate-fade-up">
        {children}
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-[5.25rem] right-4 sm:bottom-[5.75rem] sm:right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] shadow-panel transition-opacity hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
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

      <Link
        to="/informacion"
        className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border shadow-panel transition-all hover:scale-105 ${
          location.pathname === '/informacion'
            ? 'text-white border-transparent'
            : 'text-[var(--text)] border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
        }`}
        style={
          location.pathname === '/informacion'
            ? { backgroundColor: headerColor }
            : undefined
        }
        title="Información y ayuda"
        aria-label="Información y ayuda"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 11v5" />
          <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </Link>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
