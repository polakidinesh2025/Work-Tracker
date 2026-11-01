import { useState } from 'react';

const PALETTE = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
];

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  /** Tappable on phones, compact from the sm breakpoint up. */
  responsive: 'h-9 w-9 text-xs sm:h-6 sm:w-6 sm:text-[10px]'
} as const;

function initials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function colorFor(key: string): string {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name: string;
  email?: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Google avatar when available, otherwise colored initials. */
export function Avatar({ name, email = name, src, size = 'sm', className = '' }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const base = `inline-flex shrink-0 items-center justify-center rounded-full font-medium ${SIZES[size]} ${className}`;

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${base} object-cover`}
      />
    );
  }
  return (
    <span title={name} aria-label={name} className={`${base} ${colorFor(email)}`}>
      {initials(name)}
    </span>
  );
}
