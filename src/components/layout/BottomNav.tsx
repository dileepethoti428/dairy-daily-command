import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/farmers', icon: Users, label: 'Farmers' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors tap-target',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className={cn('text-xs font-medium', isActive && 'text-primary')}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
