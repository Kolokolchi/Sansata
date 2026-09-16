/// <reference types="vite/client" />

const base = import.meta.env.BASE_URL;

export function siteUrl(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || base === '/') return value;
  if (value.startsWith(base)) return value;
  return base + value.slice(1);
}

export function sitePath(): string {
  const path = location.pathname;
  return base !== '/' && path.startsWith(base) ? '/' + path.slice(base.length) : path;
}

export const staticHosting = import.meta.env.VITE_STATIC_HOSTING === 'true';
