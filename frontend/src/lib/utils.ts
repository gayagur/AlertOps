import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IL_TZ = 'Asia/Jerusalem';

export function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('en-IL', {
    timeZone: IL_TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatIsraelTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString('en-IL', {
    timeZone: IL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}

export function formatIsraelTimeShort(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleTimeString('en-IL', {
    timeZone: IL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatIsraelDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-IL', {
    timeZone: IL_TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatIsraelDayShort(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-IL', {
    timeZone: IL_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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
