import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  Radio,
  Map,
  Clock,
  List,
  Shield,
} from 'lucide-react';
import { SourceBadge } from '@/components/common/SourceBadge';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/live', icon: Radio, label: 'Live Alerts' },
  { to: '/regional', icon: Map, label: 'Regional' },
  { to: '/time', icon: Clock, label: 'Time Analysis' },
  { to: '/timeline', icon: List, label: 'Timeline' },
  { to: '/alerts', icon: Shield, label: 'Official Alerts' },
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
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Conflict Monitor</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search regions, incidents..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-background text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary bg-background border border-border rounded px-1.5 py-0.5 font-mono">
                /
              </kbd>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <SourceBadge sourceName="Official Sources" confidence="official" compact />
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
