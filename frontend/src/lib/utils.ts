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

/**
 * Relative time display ("3m ago", "2h ago", etc.)
 * Calculation is timezone-agnostic since both Date.now() and new Date(iso)
 * work in UTC milliseconds internally — the diff is the same regardless of TZ.
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

/**
 * Get the Israel-local hour (0-23) from a UTC timestamp.
 * Used for hourly bucketing in charts that should reflect Israel time.
 */
export function getIsraelHour(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IL_TZ,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(iso));
  const hourPart = parts.find(p => p.type === 'hour');
  return hourPart ? parseInt(hourPart.value, 10) : 0;
}

export function formatTimeHorizon(horizon: string): string {
  const map: Record<string, string> = {
    short_term: 'Short Term',
    medium_term: 'Medium Term',
    long_term: 'Long Term',
  };
  return map[horizon] || horizon;
}
