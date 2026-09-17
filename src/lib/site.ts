/// <reference types="vite/client" />

const base = import.meta.env.BASE_URL || '/';

/**
 * Преобразует относительный путь сайта в путь с учетом базового URL (например, для GitHub Pages).
 */
export function siteUrl(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || base === '/') {
    return value;
  }
  if (value.startsWith(base)) {
    return value;
  }
  return base + value.slice(1);
}

/**
 * Возвращает текущий нормализованный путь без учета префикса репозитория.
 */
export function sitePath(): string {
  if (typeof location === 'undefined') return '/';
  const path = location.pathname;
  return base !== '/' && path.startsWith(base) ? '/' + path.slice(base.length) : path;
}

/**
 * Клиентская SPA-навигация без перезагрузки страницы.
 */
export function navigateTo(url: string, replace = false): void {
  if (typeof window === 'undefined') return;

  const targetUrl = siteUrl(url);

  // Если это внешняя ссылка или якорь на той же странице
  if (url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:')) {
    window.location.href = url;
    return;
  }

  if (url.startsWith('#')) {
    const el = document.querySelector(url);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  if (replace) {
    history.replaceState(null, '', targetUrl);
  } else {
    history.pushState(null, '', targetUrl);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export const staticHosting = import.meta.env.VITE_STATIC_HOSTING === 'true';
