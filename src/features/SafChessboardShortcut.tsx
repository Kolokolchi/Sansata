import { Building2 } from 'lucide-react';
import { navigateTo, siteUrl } from '../lib/site';
import '../styles/saf-chessboard-shortcut.css';

export function SafChessboardShortcut({ standalone = false }: { standalone?: boolean }) {
  return <a href={siteUrl('/saf/chessboard')} className={`saf-chessboard-fab${standalone ? ' saf-chessboard-fab--sandbox' : ''}`} aria-label="Шахматка, выбрать квартиру или нежилое помещение" onClick={event => {
    if (!standalone && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); navigateTo('/saf/chessboard');
    }
  }}><Building2 size={26} aria-hidden="true" /><span>Шахматка, выбрать квартиру/НП</span></a>;
}
