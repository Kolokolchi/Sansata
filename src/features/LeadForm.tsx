import React, { useRef, useState } from 'react';
import { ArrowUpRight, Check, Phone } from 'lucide-react';
import { siteUrl, staticHosting } from '../lib/site';

interface LeadFormProps {
  topic: string;
  endpoint?: string;
}

export function LeadForm({ topic, endpoint = '/api/leads' }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot field
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const requestId = useRef(crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;

    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) {
      setError('Введите имя (не менее 2 символов).');
      setStatus('error');
      return;
    }

    if (!/^[78]\d{10}$/.test(digits)) {
      setError('Укажите номер в формате +7 и 10 цифр.');
      setStatus('error');
      return;
    }

    if (!consent) {
      setError('Подтвердите согласие на обработку данных.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setError('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          consent,
          topic,
          website,
          requestId: requestId.current
        }),
        signal: controller.signal
      });

      let body: any = null;
      try {
        body = await response.json();
      } catch {
        // Non-JSON response (e.g. HTML 502/504 from reverse proxy or server crash)
      }

      if (!response.ok) {
        throw new Error(body?.error || 'Не удалось отправить заявку.');
      }

      setReceipt(body?.message || 'Заявка принята.');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Сервер не ответил вовремя. Попробуйте ещё раз.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Сервер недоступен. Позвоните по номеру 700.');
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  if (staticHosting && endpoint.startsWith('/')) {
    return (
      <div className="lead-form">
        <img src={siteUrl('/sensata/logo.png')} alt="Sensata Group" />
        <span className="eyebrow">КОНСУЛЬТАЦИЯ</span>
        <h2>
          Обсудим ваш
          <br />
          будущий дом.
        </h2>
        <p className="lead-topic">{topic}</p>
        <p>Для консультации и записи на просмотр свяжитесь с отделом продаж.</p>
        <a className="button blue" href="tel:700">
          <Phone size={17} /> Позвонить: 700
        </a>
      </div>
    );
  }

  return (
    <div className="lead-form">
      <img src={siteUrl('/sensata/logo.png')} alt="Sensata Group" />
      {status === 'success' ? (
        <div className="lead-success" role="status">
          <Check size={40} />
          <h2>Заявка сохранена</h2>
          <p>{receipt}</p>
          <a className="button blue" href={siteUrl('tel:700')}>
            <Phone size={17} /> Позвонить в отдел продаж
          </a>
        </div>
      ) : (
        <>
          <span className="eyebrow">КОНСУЛЬТАЦИЯ / ДЕМОНСТРАЦИОННЫЙ РЕЖИМ</span>
          <h2>
            Обсудим ваш
            <br />
            будущий дом.
          </h2>
          <p className="lead-topic">{topic}</p>

          <form onSubmit={handleSubmit}>
            <label>
              Ваше имя
              <input
                type="text"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
                placeholder="Как к вам обращаться"
              />
            </label>

            <label>
              Телефон
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+7 (___) ___-__-__"
                maxLength={24}
              />
            </label>

            {/* Honeypot от ботов */}
            <label className="honeypot" aria-hidden="true" style={{ display: 'none' }}>
              Сайт
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>

            <label className="consent">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Согласен на локальное сохранение имени и телефона.{' '}
                <a href={siteUrl('/privacy')} target="_blank" rel="noreferrer">
                  О данных
                </a>
              </span>
            </label>

            <p className="muted-note">
              Сейчас заявка сохраняется на локальном сервере. CRM и отправка менеджеру будут подключены позднее.
            </p>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button className="button blue" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Сохраняем…' : 'Оставить заявку'}
              <ArrowUpRight size={17} />
            </button>
          </form>

          <a className="text-link" href={siteUrl('tel:700')}>
            <Phone size={16} /> Связаться с отделом продаж: 700
          </a>
        </>
      )}
    </div>
  );
}
