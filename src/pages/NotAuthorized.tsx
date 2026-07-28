import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyAccessRequest, requestAccess } from '../services/firebaseService';
import { AccessRequest } from '../types';

export default function NotAuthorized() {
  const navigate = useNavigate();
  const { user, isAllowed, refreshAccess } = useAuth();
  const { theme, loginBgColor, headerColor } = useTheme();
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAllowed) {
      navigate('/');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const mine = await getMyAccessRequest(user.uid);
        if (!cancelled) setRequest(mine);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('No se pudo cargar el estado del pedido.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAllowed, navigate]);

  const handleRequest = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await requestAccess(user);
      setRequest(created);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar el pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshAccess();
      if (user) {
        const mine = await getMyAccessRequest(user.uid);
        setRequest(mine);
      }
    } finally {
      setLoading(false);
    }
  };

  const status = request?.status;
  const accent = headerColor || loginBgColor;

  return (
    <div className="login-screen min-h-screen flex flex-col items-center justify-center relative px-4 py-10 sm:py-14">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="login-brand text-center mb-8 sm:mb-10">
          <img
            src="/logo.svg?v=7"
            alt=""
            className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">Gym11</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Acceso pendiente</p>
        </div>

        <div className="ui-panel login-panel w-full p-5 sm:p-7 text-center">
          <div className="h-1 w-12 rounded-full mb-5 mx-auto" style={{ backgroundColor: accent }} />

          <p className="text-sm text-[var(--text-muted)] mb-1">{user?.email}</p>

          {loading ? (
            <p className="text-[var(--text-muted)] py-4">Cargando…</p>
          ) : (
            <>
              {!status && (
                <>
                  <p className="mb-6 mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
                    Tu cuenta todavía no tiene permiso. Podés solicitar acceso al administrador.
                  </p>
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={submitting}
                    className="ui-btn-submit w-full text-white py-3 disabled:opacity-50 mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${loginBgColor} 0%, color-mix(in srgb, ${loginBgColor} 72%, #0f172a) 100%)`,
                    }}
                  >
                    {submitting ? 'Enviando…' : 'Solicitar acceso'}
                  </button>
                </>
              )}

              {status === 'pending' && (
                <>
                  <p className="mb-4 mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
                    Pedido enviado. Cuando el administrador lo apruebe vas a poder entrar.
                  </p>
                  <button type="button" onClick={handleRefresh} className="ui-menu-btn w-full h-11 mb-3 text-sm font-semibold">
                    Ya me aprobaron — actualizar
                  </button>
                </>
              )}

              {status === 'denied' && (
                <>
                  <p className="mb-6 mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
                    Tu pedido fue rechazado. Podés volver a solicitar acceso si hace falta.
                  </p>
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={submitting}
                    className="ui-btn-submit w-full text-white py-3 disabled:opacity-50 mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${loginBgColor} 0%, color-mix(in srgb, ${loginBgColor} 72%, #0f172a) 100%)`,
                    }}
                  >
                    {submitting ? 'Enviando…' : 'Volver a solicitar'}
                  </button>
                </>
              )}

              {status === 'approved' && (
                <>
                  <p className="mb-4 mt-3 text-sm text-[var(--text-muted)]">Tu acceso ya fue aprobado.</p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="ui-btn-submit w-full text-white py-3 mb-3"
                    style={{
                      background:
                        theme === 'dark'
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    Entrar a la app
                  </button>
                </>
              )}
            </>
          )}

          {error && (
            <p
              className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-red-300' : 'text-red-600'
              }`}
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-2"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
