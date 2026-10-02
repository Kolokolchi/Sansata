import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { navigateTo, siteUrl } from '../lib/site';

const groups = [
  { id: 'apartments', label: 'Квартиры', links: [{ label: 'На 3D-плане', to: '/saf/visual' }, { label: 'По параметрам', to: '/saf' }] },
];

export function SafNavigation({ path, favoriteCount = 0, compareCount = 0 }: { path: string; favoriteCount?: number; compareCount?: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => { setOpen(null); }, [path]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  const link = (to: string, label: string) => <a key={to} href={siteUrl(to)} aria-current={path === to ? 'page' : undefined} onClick={event => {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); setOpen(null); navigateTo(to); }
  }}>{label}</a>;
  return <nav ref={root} className="saf-project-nav" aria-label="Основная навигация">
    {groups.map(group => <div className="saf-nav-group" key={group.id}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(group.id); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) setOpen(null); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(null); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(null); event.currentTarget.querySelector('button')?.focus(); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(group.id); const groupElement = event.currentTarget; requestAnimationFrame(() => groupElement.querySelector('a')?.focus()); }
      }}>
      <button type="button" aria-expanded={open === group.id} aria-controls={`saf-nav-${group.id}`} onClick={() => setOpen(current => matchMedia('(hover: hover)').matches ? group.id : current === group.id ? null : group.id)}>{group.label}<ChevronDown size={15} /></button>
      <div id={`saf-nav-${group.id}`} className="saf-nav-dropdown" hidden={open !== group.id}>{group.links.map(item => link(item.to, item.label))}{link('/saf/favorites', `Избранное (${favoriteCount})`)}{link('/saf/compare', `Сравнение (${compareCount})`)}</div>
    </div>)}
    {link('/projects', 'Объекты')}
  </nav>;
}
