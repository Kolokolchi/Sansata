import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Star, ChevronDown, Download, Menu, X, Monitor } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { 
    activePage, 
    navigateTo, 
    favorites, 
    openCallbackModal, 
    openBookletModal,
    setAppMode 
  } = useAppStore();
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = activePage === 'home';
  const headerClass = `header ${!isHome || isScrolled ? 'header--solid' : 'header--transparent'}`;

  const scrollToAnchor = (anchorId: string) => {
    if (activePage !== 'home') {
      navigateTo('home');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={headerClass}>
      <div className="container">
        <div className="header__inner">
          {/* Logo */}
          <a 
            href="#" 
            className="header__logo"
            onClick={(e) => { e.preventDefault(); navigateTo('home'); }}
          >
            <div className="header__logo-icon">S</div>
            <div>
              <div style={{ lineHeight: 1, fontWeight: 900, fontSize: '18px' }}>STAVNI</div>
              <div style={{ fontSize: '10px', letterSpacing: '3px', opacity: 0.85, fontWeight: 600 }}>ОБВОДНЫЙ</div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="header__nav">
            {/* Flats Dropdown */}
            <div className="header__nav-item">
              <span className="header__nav-link">
                Квартиры <ChevronDown size={15} />
              </span>
              <div className="header__dropdown">
                <a 
                  href="#" 
                  className="header__dropdown-link"
                  onClick={(e) => { e.preventDefault(); navigateTo('visual'); }}
                >
                  На 3D-плане
                </a>
                <a 
                  href="#" 
                  className="header__dropdown-link"
                  onClick={(e) => { e.preventDefault(); navigateTo('parametric-search'); }}
                >
                  По параметрам
                </a>
              </div>
            </div>

            {/* About Dropdown */}
            <div className="header__nav-item">
              <span className="header__nav-link">
                О проекте <ChevronDown size={15} />
              </span>
              <div className="header__dropdown">
                <a href="#about" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('about'); }}>О проекте</a>
                <a href="#mesto" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('mesto'); }}>Преимущества</a>
                <a href="#flats" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('flats'); }}>Про квартиры</a>
                <a href="#finishing" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('finishing'); }}>Отделка</a>
                <a href="#location" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('location'); }}>Расположение</a>
                <a href="#akcii" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('akcii'); }}>Акции проекта</a>
                <a href="#mortgage" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('mortgage'); }}>Ипотечные программы</a>
                <a href="#progress" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('progress'); }}>Ход строительства</a>
                <a href="#docs" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('docs'); }}>Документы</a>
                <a href="#contacts" className="header__dropdown-link" onClick={(e) => { e.preventDefault(); scrollToAnchor('contacts'); }}>Контакты</a>
              </div>
            </div>

            {/* Audio excursion */}
            <div className="header__nav-item">
              <a 
                href="#" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); navigateTo('audiogid'); }}
              >
                Аудиоэкскурсия
              </a>
            </div>

            {/* Kiosk Mode Launcher button in Header */}
            <div className="header__nav-item">
              <button 
                onClick={() => setAppMode('kiosk')}
                style={{
                  background: 'rgba(227, 82, 4, 0.15)',
                  border: '1px solid rgba(227, 82, 4, 0.4)',
                  color: '#ff8e52',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
                title="Переключиться в режим Интерактивного терминала (Upside Towers UX)"
              >
                <Monitor size={14} />
                <span>3D-терминал</span>
              </button>
            </div>
          </nav>

          {/* Actions */}
          <div className="header__actions">
            {/* Phone link */}
            <a href="tel:+78125011151" className="header__phone">
              +7 (812) 501-11-51
            </a>

            {/* Callback button */}
            <button 
              className="btn btn--primary btn--sm"
              onClick={openCallbackModal}
            >
              Мы вам перезвоним
            </button>

            {/* Booklet download button */}
            <button 
              className="btn btn--secondary btn--sm"
              style={{ display: 'none' }} /* Visible on wide screens */
              onClick={openBookletModal}
            >
              <Download size={14} /> Скачать буклет
            </button>

            {/* Favorites icon */}
            <button 
              className="header__favorite-btn"
              title="Избранные квартиры"
              onClick={() => navigateTo('favorite')}
            >
              <Star size={18} fill={favorites.length > 0 ? 'currentColor' : 'none'} />
              {favorites.length > 0 && (
                <span className="header__favorite-badge">{favorites.length}</span>
              )}
            </button>

            {/* Mobile burger */}
            <button 
              className="header__burger" 
              onClick={onOpenMobileMenu}
              aria-label="Открыть меню"
            >
              <span className="header__burger-line"></span>
              <span className="header__burger-line"></span>
              <span className="header__burger-line"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
