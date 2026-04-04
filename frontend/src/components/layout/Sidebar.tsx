import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  ShieldAlert,
  BarChart3,
  Crosshair,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: TrendingUp, label: 'Opportunities' },
  { to: '/recommendations', icon: Crosshair, label: 'Recommendations' },
  { to: '/macro', icon: Activity, label: 'Macro Drivers' },
  { to: '/risks', icon: ShieldAlert, label: 'Risk Monitor' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-surface h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight">
              Market Intel
            </h1>
            <p className="text-[11px] text-text-tertiary tracking-wide uppercase">
              Opportunity Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent/[0.06] text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-[11px] text-text-tertiary">
          Not financial advice. For research purposes only.
        </p>
      </div>
    </aside>
  );
}
