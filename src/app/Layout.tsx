import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <main className="flex-1 pb-20 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
