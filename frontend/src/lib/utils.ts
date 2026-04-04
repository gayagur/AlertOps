import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeHorizon(horizon: string): string {
  const map: Record<string, string> = {
    short_term: 'Short Term',
    medium_term: 'Medium Term',
    long_term: 'Long Term',
  };
  return map[horizon] || horizon;
}
