import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface InsightPanelProps {
  title: string;
  content: string;
}

export function InsightPanel({ title, content }: InsightPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-accent/10 bg-accent/[0.02] p-6"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
          <Lightbulb className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
        </div>
      </div>
    </motion.div>
  );
}
