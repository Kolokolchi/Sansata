import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { KioskHeader } from './KioskHeader';
import { KioskStartScreen } from './KioskStartScreen';
import { KioskWelcomeModal } from './KioskWelcomeModal';
import { KioskFarewellScreen } from './KioskFarewellScreen';
import { KioskMasterplanView } from './KioskMasterplanView';
import { KioskMopView } from './KioskMopView';
import { KioskParkingView } from './KioskParkingView';
import { KioskCommercialView } from './KioskCommercialView';
import { KioskOtherView } from './KioskOtherView';
import { KioskSearchModal } from './KioskSearchModal';
import { KioskFavoritesModal } from './KioskFavoritesModal';
import { KioskInfrastructureView } from './KioskInfrastructureView';
import { KioskAboutProjectView } from './KioskAboutProjectView';
import { KioskAboutDeveloperView } from './KioskAboutDeveloperView';
import { KioskFlatDetailModal } from './KioskFlatDetailModal';
import { KioskVideoTourModal } from './KioskVideoTourModal';
import { KioskSettingsModal } from './KioskSettingsModal';
import { KioskScreenshotToast } from './KioskScreenshotToast';
import { ModalsContainer } from '../Modals';
import { 
  Layers, 
  Search, 
  Star, 
  MapPin, 
  Info, 
  Building2, 
  Film, 
  Settings, 
  Sparkles,
  Car,
  Store,
  Trees
} from 'lucide-react';

export const KioskContainer: React.FC = () => {
  const { 
    kioskStep, 
    kioskSection, 
    setKioskSection, 
    setKioskPointType,
    timeOfDay,
    kioskFlatDetailOpen,
    kioskSettings,
    finishFarewell,
    favorites
  } = useAppStore();

  // Inactivity screensaver timer
  const inactivityTimerRef = useRef<any>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (kioskSettings.autoInactivityMinutes > 0 && kioskStep !== 'start') {
        inactivityTimerRef.current = setTimeout(() => {
          finishFarewell();
        }, kioskSettings.autoInactivityMinutes * 60 * 1000);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [kioskSettings.autoInactivityMinutes, kioskStep, finishFarewell]);

  return (
    <div className="kiosk-root" data-tod={timeOfDay}>
      {/* 1. Start Screen */}
      {kioskStep === 'start' && (
        <KioskStartScreen />
      )}

      {/* 2. Welcome Modal */}
      {kioskStep === 'welcome' && (
        <KioskWelcomeModal />
      )}

      {/* 3. Farewell Screen */}
      {kioskStep === 'farewell' && (
        <KioskFarewellScreen />
      )}

      {/* 4. Main HUD Interface */}
      {kioskStep === 'hud' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden'
        }}>
          {/* Top HUD Header */}
          <KioskHeader />

          {/* Center Workspace */}
          <main style={{
            flex: 1,
            padding: '16px 28px 12px 28px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {kioskSection === 'genplan' && <KioskMasterplanView />}
            {kioskSection === 'mop' && <KioskMopView />}
            {kioskSection === 'parking' && <KioskParkingView />}
            {kioskSection === 'commercial' && <KioskCommercialView />}
            {kioskSection === 'other' && <KioskOtherView />}
            {kioskSection === 'search' && <KioskSearchModal />}
            {kioskSection === 'favorites' && <KioskFavoritesModal />}
            {kioskSection === 'infrastructure' && <KioskInfrastructureView />}
            {kioskSection === 'about-project' && <KioskAboutProjectView />}
            {kioskSection === 'developer' && <KioskAboutDeveloperView />}
          </main>

          {/* Bottom HUD Main Menu Navigation Bar according to Mindmap */}
          <footer style={{
            padding: '8px 28px 16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <div className="kiosk-hud-tabs">
              {/* Генплан (B2) */}
              <button
                onClick={() => setKioskSection('genplan')}
                className={`kiosk-hud-tab ${['genplan', 'mop', 'parking', 'commercial', 'other'].includes(kioskSection) ? 'is-active' : ''}`}
              >
                <Layers size={17} />
                <span>Генплан</span>
                <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  B2
                </span>
              </button>

              {/* Поиск (B3) */}
              <button
                onClick={() => setKioskSection('search')}
                className={`kiosk-hud-tab ${kioskSection === 'search' ? 'is-active' : ''}`}
              >
                <Search size={17} />
                <span>Поиск</span>
                <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  B3
                </span>
              </button>

              {/* Избранное (B5) */}
              <button
                onClick={() => setKioskSection('favorites')}
                className={`kiosk-hud-tab ${kioskSection === 'favorites' ? 'is-active' : ''}`}
              >
                <Star size={17} fill={favorites.length > 0 ? 'currentColor' : 'none'} />
                <span>Избранное</span>
                {favorites.length > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: '#22c55e',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900
                  }}>
                    {favorites.length}
                  </span>
                )}
                <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  B5
                </span>
              </button>

              {/* Инфраструктура (B6) */}
              <button
                onClick={() => setKioskSection('infrastructure')}
                className={`kiosk-hud-tab ${kioskSection === 'infrastructure' ? 'is-active' : ''}`}
              >
                <MapPin size={17} />
                <span>Инфраструктура</span>
                <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  B6
                </span>
              </button>

              {/* О проекте (B7) */}
              <button
                onClick={() => setKioskSection('about-project')}
                className={`kiosk-hud-tab ${kioskSection === 'about-project' ? 'is-active' : ''}`}
              >
                <Info size={17} />
                <span>О проекте</span>
                <span className="kiosk-code-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  B7
                </span>
              </button>

              {/* О разработчике */}
              <button
                onClick={() => setKioskSection('developer')}
                className={`kiosk-hud-tab ${kioskSection === 'developer' ? 'is-active' : ''}`}
              >
                <Building2 size={17} />
                <span>О разработчике</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Global Modals & Toasts */}
      {kioskFlatDetailOpen && <KioskFlatDetailModal />}
      <KioskVideoTourModal />
      <KioskSettingsModal />
      <KioskScreenshotToast />
      <ModalsContainer />
    </div>
  );
};
