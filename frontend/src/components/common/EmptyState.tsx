import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-border-subtle p-4 mb-4">
        <AlertCircle className="h-6 w-6 text-text-tertiary" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-sm">{description}</p>
    </div>
  );
}
