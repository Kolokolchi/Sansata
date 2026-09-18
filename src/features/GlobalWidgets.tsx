import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';

/**
 * Плавающая кнопка «Наверх» (Up Button) со скроллом в начало страницы.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setVisible(window.scrollY > 320);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="up-button"
      onClick={scrollToTop}
      aria-label="Прокрутить в начало страницы"
      title="Наверх"
    >
      <ArrowUp size={20} />
    </button>
  );
}

/**
 * Плашка согласия на обработку файлов Cookie (Cookie Notice).
 */
export function CookieNotice() {
  const [accepted, setAccepted] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    try {
      return !!localStorage.getItem('sensata-cookie-consent');
    } catch {
      return true;
    }
  });

  const handleAccept = () => {
    try {
      localStorage.setItem('sensata-cookie-consent', 'accepted');
    } catch {}
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="cookies-notice" role="dialog" aria-live="polite" aria-label="Уведомление о файлах cookie">
      <div className="cookies-notice__text">
        <p>
          Мы используем файлы cookie. Продолжая пользоваться сайтом, вы соглашаетесь с условиями{' '}
          <a
            href={siteUrl('/policy')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/policy');
            }}
          >
            политики обработки персональных данных
          </a>{' '}
          и использованием файлов cookie.
        </p>
      </div>
      <div className="cookies-notice__button">
        <button
          type="button"
          className="button blue cookies-notice-btn"
          onClick={handleAccept}
          aria-label="Принимаю использование cookie"
        >
          Принимаю
        </button>
      </div>
    </div>
  );
}
