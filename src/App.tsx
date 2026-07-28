import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import NotAuthorized from './pages/NotAuthorized';
import Dashboard from './pages/Dashboard';
import WorkoutHistory from './pages/WorkoutHistory';
import WorkoutForm from './pages/WorkoutForm';
import Progress from './pages/Progress';
import BodyWeight from './pages/BodyWeight';
import Management from './pages/Management';
import InfoPage from './pages/InfoPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowed, checkingAccess } = useAuth();

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c111b]">
        <div className="text-lg text-slate-200 tracking-wide animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAllowed) {
    return <Navigate to="/not-authorized" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/entrenamientos"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/entrenamientos/nuevo"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/entrenamientos/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progreso"
        element={
          <ProtectedRoute>
            <Layout>
              <Progress />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/peso"
        element={
          <ProtectedRoute>
            <Layout>
              <BodyWeight />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestion"
        element={
          <ProtectedRoute>
            <Layout>
              <Management />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/informacion"
        element={
          <ProtectedRoute>
            <Layout>
              <InfoPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <DataProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </DataProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
