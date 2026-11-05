import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, resetPassword, signIn, signUp } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme, loginBgColor, headerColor } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = headerColor || loginBgColor;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Ingresá tu email arriba y después tocá “Olvidé mi contraseña”.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfo('Te enviamos un mail para crear o restablecer la contraseña. Revisá la bandeja (y spam).');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split min-h-screen flex flex-col lg:grid lg:grid-cols-2">
      {/* Brand panel: solo desktop */}
      <aside
        className="login-split-brand relative hidden lg:flex flex-col justify-between px-12 py-14 min-h-screen"
        style={{
          background: `
            linear-gradient(165deg,
              color-mix(in srgb, ${accent} 88%, #111111) 0%,
              color-mix(in srgb, ${accent} 48%, #0a0a0a) 52%,
              #050505 100%
            )
          `,
        }}
      >
        <div className="login-split-pattern absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative z-[1] flex items-center gap-3">
          <img
            src="/logo.svg?v=8"
            alt=""
            className="w-11 h-11 rounded-xl ring-1 ring-white/20 shadow-lg"
          />
          <span className="text-white/70 text-sm font-medium tracking-wide">Entrenamiento</span>
        </div>

        <div className="relative z-[1] login-brand">
          <h1 className="text-6xl xl:text-7xl font-bold tracking-tight text-white leading-none">
            Gym <span className="text-white/70">11</span>
          </h1>
          <p className="mt-5 max-w-sm text-lg text-white/65 leading-relaxed">
            {isRegister
              ? 'Creá tu cuenta y pedí acceso al administrador.'
              : 'Tu registro de entrenamientos, ejercicios y progreso.'}
          </p>
        </div>

        <p className="relative z-[1] text-xs text-white/35 tracking-wide">
          Acceso privado · Solo usuarios autorizados
        </p>
      </aside>

      <section className="login-split-form relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="ui-menu-btn absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 z-10"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="4" strokeWidth={1.75} />
              <path
                strokeLinecap="round"
                strokeWidth={1.75}
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              />
            </svg>
          )}
        </button>

        <div className="w-full max-w-md mx-auto login-panel">
          {/* Brand compacta: solo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 pr-12">
            <img
              src="/logo.svg?v=8"
              alt=""
              className="w-11 h-11 rounded-xl ring-1 ring-white/10 shadow-md shrink-0"
            />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] leading-none">
              Gym <span style={{ color: accent }}>11</span>
            </h1>
          </div>

          <div className="mb-6 lg:mb-7">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text)]">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isRegister ? 'Registrate con tu email' : 'Ingresá con tu email y contraseña'}
            </p>
          </div>

          {error && (
            <div
              className={`mb-4 px-3.5 py-2.5 rounded-[var(--radius-control)] border text-sm ${
                theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/35 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
              role="alert"
            >
              {error}
            </div>
          )}
          {info && (
            <div
              className={`mb-4 px-3.5 py-2.5 rounded-[var(--radius-control)] border text-sm ${
                theme === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
              role="status"
            >
              {info}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ui-input"
                required
              />
            </div>
            <div className="form-group">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <label htmlFor="login-password" className="!mb-0">
                  Contraseña
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Olvidé mi contraseña
                  </button>
                )}
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input"
                required
                minLength={6}
              />
            </div>

            {isRegister && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Después de crear la cuenta vas a poder solicitar acceso al administrador.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ui-btn-submit w-full text-white py-3 mt-1 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, #0a0a0a) 100%)`,
              }}
            >
              {loading ? 'Cargando…' : isRegister ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 text-sm text-center text-[var(--text-muted)]">
            {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister((v) => !v);
                setError('');
                setInfo('');
              }}
              className="font-semibold transition-opacity hover:opacity-80"
              style={{ color: accent }}
            >
              {isRegister ? 'Iniciá sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
