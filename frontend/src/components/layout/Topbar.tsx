import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Search,
  BarChart3,
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ShieldAlert,
} from 'lucide-react';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: TrendingUp, label: 'Opportunities' },
  { to: '/macro', icon: Activity, label: 'Macro Drivers' },
  { to: '/risks', icon: ShieldAlert, label: 'Risk Monitor' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
];

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Market Intel</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search sectors, themes, signals..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary bg-background border border-border rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-text-tertiary">
              <div className="h-2 w-2 rounded-full bg-bullish animate-pulse" />
              Live
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-14 left-0 right-0 bg-surface border-b border-border shadow-elevated p-4 space-y-1">
            {mobileNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent/[0.06] text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
