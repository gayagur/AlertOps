import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { Opportunity } from '@/types/analysis';

interface SectorMomentumChartProps {
  opportunities: Opportunity[];
}

export function SectorMomentumChart({ opportunities }: SectorMomentumChartProps) {
  const data = opportunities.map((o) => ({
    name: o.name.length > 14 ? o.name.slice(0, 12) + '…' : o.name,
    fullName: o.name,
    confidence: o.confidence,
    direction: o.direction,
  }));

  const getBarColor = (direction: string) => {
    if (direction === 'bullish') return '#166534';
    if (direction === 'bearish') return '#991b1b';
    return '#92400e';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-1">Sector Confidence</h3>
      <p className="text-xs text-text-tertiary mb-6">
        Confidence score by sector, ranked by conviction
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#57534e' }} width={100} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e7e5e4',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
              formatter={(value) => [`${value}%`, 'Confidence']}
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            />
            <ReferenceLine x={50} stroke="#e7e5e4" strokeDasharray="3 3" />
            <Bar dataKey="confidence" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.direction)} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
