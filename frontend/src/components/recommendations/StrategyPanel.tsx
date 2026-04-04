import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { PortfolioStrategy } from '@/types/recommendations';
import { Shield, Scale, Flame } from 'lucide-react';

interface StrategyPanelProps {
  strategies: PortfolioStrategy[];
  disclaimer: string;
}

const profileMeta = {
  conservative: { icon: Shield, label: 'Conservative', color: '#166534' },
  moderate: { icon: Scale, label: 'Moderate', color: '#1e3a5f' },
  aggressive: { icon: Flame, label: 'Aggressive', color: '#92400e' },
};

const CHART_COLORS = ['#1e3a5f', '#2d5a8e', '#4a7dba', '#7ba3d1', '#b0c8e4', '#d4d4d4'];

export function StrategyPanel({ strategies, disclaimer }: StrategyPanelProps) {
  const [active, setActive] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const strategy = strategies.find((s) => s.profile === active) || strategies[0];

  if (!strategy) return null;

  const chartData = [
    ...strategy.allocations.map((a) => ({
      name: a.sector,
      value: a.weight_pct,
      instrument: a.instrument,
    })),
    ...(strategy.cash_pct > 0 ? [{ name: 'Cash', value: strategy.cash_pct, instrument: '—' }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface"
    >
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Portfolio Strategy</h3>
        <p className="text-xs text-text-tertiary mt-0.5">Suggested allocation by risk profile</p>
      </div>

      {/* Profile tabs */}
      <div className="flex border-b border-border">
        {(['conservative', 'moderate', 'aggressive'] as const).map((profile) => {
          const meta = profileMeta[profile];
          const Icon = meta.icon;
          return (
            <button
              key={profile}
              onClick={() => setActive(profile)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all',
                active === profile
                  ? 'text-text-primary border-b-2 border-accent bg-accent/[0.02]'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-5">
        {/* Chart */}
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-1.5">
            {chartData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-text-secondary">{item.name}</span>
                  {item.instrument !== '—' && (
                    <span className="font-mono text-[10px] text-text-tertiary">{item.instrument}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-text-primary">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-text-secondary leading-relaxed">{strategy.summary}</p>

        {/* Allocations detail */}
        <div className="space-y-2">
          {strategy.allocations.map((alloc, i) => (
            <div key={`${alloc.instrument}-${alloc.sector}-${i}`} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
              <div>
                <span className="font-mono text-xs font-semibold text-text-primary">{alloc.instrument}</span>
                <span className="text-[11px] text-text-tertiary ml-2">{alloc.sector}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-text-primary">{alloc.weight_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-[10px] text-text-tertiary leading-relaxed">{disclaimer}</p>
      </div>
    </motion.div>
  );
}
