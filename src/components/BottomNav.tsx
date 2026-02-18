import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BookText, Settings } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/plan', icon: BookOpen, label: '통독' },
  { to: '/bible', icon: BookText, label: '성경' },
  { to: '/settings', icon: Settings, label: '설정' },
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'text-primary-600 font-semibold'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
