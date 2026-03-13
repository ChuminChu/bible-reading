import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './Layout';
import HomePage from '@/pages/HomePage';
import PlanPage from '@/pages/PlanPage';
import BiblePage from '@/pages/BiblePage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ReadingFlowPage from '@/pages/ReadingFlowPage';
import LoginPage from '@/pages/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { ReadingProgressProvider } from '@/contexts/ReadingProgressContext';

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        <p className="text-sm text-text-muted animate-pulse">불러오는 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ReadingProgressProvider>
      <Outlet />
    </ReadingProgressProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGate />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="bible" element={<BiblePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="/read/:dayNumber" element={<ReadingFlowPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
