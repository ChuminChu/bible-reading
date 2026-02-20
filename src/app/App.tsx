import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import HomePage from '@/pages/HomePage';
import PlanPage from '@/pages/PlanPage';
import BiblePage from '@/pages/BiblePage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ReadingFlowPage from '@/pages/ReadingFlowPage';
import LoginPage from '@/pages/LoginPage';
import { useAuth } from '@/contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="bible" element={<BiblePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route
        path="/read/:dayNumber"
        element={
          <ProtectedRoute>
            <ReadingFlowPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
