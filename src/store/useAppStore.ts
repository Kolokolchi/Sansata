import { useState, useEffect } from 'react';
import { 
  Apartment, 
  RoomType, 
  PromoOffer, 
  BenefitItem, 
  AppMode, 
  TimeOfDay, 
  KioskStep, 
  KioskSection, 
  KioskPointType 
} from '../types';
import { apartments } from '../data/apartmentsData';

export interface FilterState {
  roomTypes: RoomType[];
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  minFloor: number;
  maxFloor: number;
  sections: number[];
  windowViews: string[];
  features: string[];
  sortField: 'price' | 'area' | 'floor';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'table';
}

export const initialFilterState: FilterState = {
  roomTypes: [],
  minPrice: 11000000,
  maxPrice: 45000000,
  minArea: 21.0,
  maxArea: 93.0,
  minFloor: 2,
  maxFloor: 11,
  sections: [],
  windowViews: [],
  features: [],
  sortField: 'price',
  sortOrder: 'asc',
  viewMode: 'grid'
};

// Web Audio API Sound Synthesizer for tactile feedback
class KioskAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type: 'click' | 'switch' | 'success' | 'open' | 'close' | 'shutter') {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'switch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'open') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'close') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'shutter') {
        // Camera click
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // AudioContext may be restricted by browser autoplay policy
    }
  }
}

export const audioEngine = new KioskAudioEngine();

// Global State
class StoreEmitter extends EventTarget {}
const storeEmitter = new StoreEmitter();

// Read initial mode from URL or localStorage
let initialAppMode: AppMode = 'web';
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  if (modeParam === 'kiosk' || modeParam === 'web') {
    initialAppMode = modeParam;
  } else {
    const savedMode = localStorage.getItem('stavni_app_mode');
    if (savedMode === 'kiosk' || savedMode === 'web') {
      initialAppMode = savedMode;
    }
  }
}

let globalState = {
  // Application Mode: 'web' | 'kiosk'
  appMode: initialAppMode as AppMode,

  // Web Portal Page
  activePage: 'home', // 'home' | 'parametric-search' | 'visual' | 'favorite' | 'audiogid'
  selectedFlatId: null as string | null,
  favorites: [] as string[],
  filters: { ...initialFilterState },
  
  // Interactive Kiosk Mode State (Mindmap & Upside Towers UX)
  kioskStep: 'start' as KioskStep, // 'start' | 'welcome' | 'hud' | 'farewell'
  kioskSection: 'genplan' as KioskSection, // 'genplan' | 'search' | 'favorites' | 'infrastructure' | 'about-project' | 'developer' | 'mop' | 'parking' | 'commercial' | 'other'
  kioskPointType: 'building' as KioskPointType, // 'building' | 'mop' | 'parking' | 'commercial' | 'other'
  kioskBuildingId: 1, // Section 1 to 5
  kioskFloorId: 5, // Floor 1 to 11
  kioskSelectedFlatId: null as string | null,
  kioskFlatDetailOpen: false,
  timeOfDay: 'day' as TimeOfDay, // 'day' | 'sunset' | 'night'
  insolationHour: 12, // 8 to 20
  kioskSettings: {
    soundEnabled: true,
    autoInactivityMinutes: 3,
    presentationQuality: 'ultra' as 'ultra' | 'high' | 'eco'
  },
  screenshotToastOpen: false,
  screenshotPreviewUrl: null as string | null,
  videoTourModalOpen: false,
  kioskSettingsModalOpen: false,

  // Modals for Web Portal
  callbackModalOpen: false,
  bookingModalOpen: false,
  bookingFlat: null as Apartment | null,
  mortgageModalOpen: false,
  mortgageCalcData: null as any,
  bookletModalOpen: false,
  planoplanModalOpen: false,
  planoplanUid: '2ee1019ddb3e8f756ad9aa354403604c_3d',
  lightboxModalOpen: false,
  lightboxImage: { src: '', title: '', caption: '' },
  promoModalOpen: false,
  selectedPromo: null as PromoOffer | null,
  benefitModalOpen: false,
  selectedBenefit: null as BenefitItem | null,
  successModalOpen: false,
  successMessage: { title: '', text: '' }
};

// Initialize favorites from localStorage
try {
  const saved = localStorage.getItem('stavni_favorites');
  if (saved) {
    globalState.favorites = JSON.parse(saved);
  }
} catch (e) {}

export function useAppStore() {
  const [state, setState] = useState(globalState);

  useEffect(() => {
    const handleUpdate = () => {
      setState({ ...globalState });
    };
    storeEmitter.addEventListener('update', handleUpdate);
    return () => storeEmitter.removeEventListener('update', handleUpdate);
  }, []);

  const updateStore = (updater: (prev: typeof globalState) => void) => {
    updater(globalState);
    storeEmitter.dispatchEvent(new Event('update'));
  };

  const playSound = (type: 'click' | 'switch' | 'success' | 'open' | 'close' | 'shutter') => {
    if (globalState.kioskSettings.soundEnabled) {
      audioEngine.play(type);
    }
  };

  // Switch between Version 1 (Web) and Version 2 (Kiosk)
  const setAppMode = (mode: AppMode) => {
    playSound('switch');
    updateStore(s => {
      s.appMode = mode;
      try {
        localStorage.setItem('stavni_app_mode', mode);
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    });
  };

  // Web Portal Navigation
  const navigateTo = (page: string, flatId?: string) => {
    playSound('click');
    updateStore(s => {
      s.activePage = page;
      if (flatId) s.selectedFlatId = flatId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Kiosk Navigation & Actions
  const setKioskStep = (step: KioskStep) => {
    playSound('click');
    updateStore(s => {
      s.kioskStep = step;
    });
  };

  const setKioskSection = (section: KioskSection) => {
    playSound('click');
    updateStore(s => {
      s.kioskSection = section;
      if (section === 'mop') s.kioskPointType = 'mop';
      else if (section === 'parking') s.kioskPointType = 'parking';
      else if (section === 'commercial') s.kioskPointType = 'commercial';
      else if (section === 'other') s.kioskPointType = 'other';
      else if (section === 'genplan') s.kioskPointType = 'building';
    });
  };

  const setKioskPointType = (pointType: KioskPointType) => {
    playSound('click');
    updateStore(s => {
      s.kioskPointType = pointType;
      if (pointType === 'building') s.kioskSection = 'genplan';
      else if (pointType === 'mop') s.kioskSection = 'mop';
      else if (pointType === 'parking') s.kioskSection = 'parking';
      else if (pointType === 'commercial') s.kioskSection = 'commercial';
      else if (pointType === 'other') s.kioskSection = 'other';
    });
  };

  const setKioskBuildingId = (buildingId: number) => {
    playSound('switch');
    updateStore(s => {
      s.kioskBuildingId = buildingId;
    });
  };

  const setKioskFloorId = (floorId: number) => {
    playSound('click');
    updateStore(s => {
      s.kioskFloorId = floorId;
    });
  };

  const openKioskFlatDetail = (flatId: string) => {
    playSound('open');
    updateStore(s => {
      s.kioskSelectedFlatId = flatId;
      s.kioskFlatDetailOpen = true;
    });
  };

  const closeKioskFlatDetail = () => {
    playSound('close');
    updateStore(s => {
      s.kioskFlatDetailOpen = false;
      s.kioskSelectedFlatId = null;
    });
  };

  const setTimeOfDay = (time: TimeOfDay) => {
    playSound('switch');
    updateStore(s => {
      s.timeOfDay = time;
    });
  };

  const toggleTimeOfDay = () => {
    playSound('switch');
    updateStore(s => {
      if (s.timeOfDay === 'day') s.timeOfDay = 'sunset';
      else if (s.timeOfDay === 'sunset') s.timeOfDay = 'night';
      else s.timeOfDay = 'day';
    });
  };

  const setInsolationHour = (hour: number) => {
    updateStore(s => {
      s.insolationHour = hour;
    });
  };

  const triggerScreenshot = () => {
    playSound('shutter');
    updateStore(s => {
      s.screenshotToastOpen = true;
      s.screenshotPreviewUrl = '/images/facade_3d.jpg';
    });
  };

  const closeScreenshotToast = () => {
    updateStore(s => {
      s.screenshotToastOpen = false;
    });
  };

  const openVideoTourModal = () => {
    playSound('open');
    updateStore(s => {
      s.videoTourModalOpen = true;
    });
  };

  const closeVideoTourModal = () => {
    playSound('close');
    updateStore(s => {
      s.videoTourModalOpen = false;
    });
  };

  const openKioskSettingsModal = () => {
    playSound('open');
    updateStore(s => {
      s.kioskSettingsModalOpen = true;
    });
  };

  const closeKioskSettingsModal = () => {
    playSound('close');
    updateStore(s => {
      s.kioskSettingsModalOpen = false;
    });
  };

  const updateKioskSettings = (partial: Partial<typeof globalState.kioskSettings>) => {
    playSound('click');
    updateStore(s => {
      s.kioskSettings = { ...s.kioskSettings, ...partial };
    });
  };

  const startKioskSession = (directSection?: KioskSection) => {
    playSound('switch');
    updateStore(s => {
      if (directSection) {
        s.kioskSection = directSection;
        s.kioskStep = 'hud';
      } else {
        s.kioskStep = 'welcome';
      }
    });
  };

  const endKioskSession = () => {
    playSound('close');
    updateStore(s => {
      s.kioskStep = 'farewell';
    });
  };

  const finishFarewell = () => {
    updateStore(s => {
      s.kioskStep = 'start';
      s.kioskSection = 'genplan';
      s.kioskPointType = 'building';
      s.kioskFlatDetailOpen = false;
      s.kioskSelectedFlatId = null;
    });
  };

  // Favorites
  const toggleFavorite = (id: string) => {
    playSound('click');
    updateStore(s => {
      if (s.favorites.includes(id)) {
        s.favorites = s.favorites.filter(favId => favId !== id);
      } else {
        s.favorites = [...s.favorites, id];
        audioEngine.play('success');
      }
      try {
        localStorage.setItem('stavni_favorites', JSON.stringify(s.favorites));
      } catch (e) {}
    });
  };

  const isFavorite = (id: string) => {
    return state.favorites.includes(id);
  };

  const setFilters = (newFilters: Partial<FilterState> | ((prev: FilterState) => FilterState)) => {
    updateStore(s => {
      if (typeof newFilters === 'function') {
        s.filters = newFilters(s.filters);
      } else {
        s.filters = { ...s.filters, ...newFilters };
      }
    });
  };

  const resetFilters = () => {
    playSound('click');
    updateStore(s => {
      s.filters = { ...initialFilterState };
    });
  };

  // Modals openers
  const openCallbackModal = () => {
    playSound('open');
    updateStore(s => { s.callbackModalOpen = true; });
  };
  const closeCallbackModal = () => {
    playSound('close');
    updateStore(s => { s.callbackModalOpen = false; });
  };

  const openBookingModal = (flat: Apartment) => {
    playSound('open');
    updateStore(s => {
      s.bookingFlat = flat;
      s.bookingModalOpen = true;
    });
  };
  const closeBookingModal = () => {
    playSound('close');
    updateStore(s => {
      s.bookingModalOpen = false;
      s.bookingFlat = null;
    });
  };

  const openMortgageModal = (calcData?: any) => {
    playSound('open');
    updateStore(s => {
      s.mortgageCalcData = calcData || null;
      s.mortgageModalOpen = true;
    });
  };
  const closeMortgageModal = () => {
    playSound('close');
    updateStore(s => { s.mortgageModalOpen = false; });
  };

  const openBookletModal = () => {
    playSound('open');
    updateStore(s => { s.bookletModalOpen = true; });
  };
  const closeBookletModal = () => {
    playSound('close');
    updateStore(s => { s.bookletModalOpen = false; });
  };

  const openPlanoplanModal = (uid: string = '2ee1019ddb3e8f756ad9aa354403604c_3d') => {
    playSound('open');
    updateStore(s => {
      s.planoplanUid = uid;
      s.planoplanModalOpen = true;
    });
  };
  const closePlanoplanModal = () => {
    playSound('close');
    updateStore(s => { s.planoplanModalOpen = false; });
  };

  const openLightbox = (src: string, title: string = '', caption: string = '') => {
    playSound('open');
    updateStore(s => {
      s.lightboxImage = { src, title, caption };
      s.lightboxModalOpen = true;
    });
  };
  const closeLightbox = () => {
    playSound('close');
    updateStore(s => { s.lightboxModalOpen = false; });
  };

  const openPromoModal = (promo: PromoOffer) => {
    playSound('open');
    updateStore(s => {
      s.selectedPromo = promo;
      s.promoModalOpen = true;
    });
  };
  const closePromoModal = () => {
    playSound('close');
    updateStore(s => {
      s.promoModalOpen = false;
      s.selectedPromo = null;
    });
  };

  const openBenefitModal = (benefit: BenefitItem) => {
    playSound('open');
    updateStore(s => {
      s.selectedBenefit = benefit;
      s.benefitModalOpen = true;
    });
  };
  const closeBenefitModal = () => {
    playSound('close');
    updateStore(s => {
      s.benefitModalOpen = false;
      s.selectedBenefit = null;
    });
  };

  const showSuccessModal = (title: string, text: string) => {
    playSound('success');
    updateStore(s => {
      s.successMessage = { title, text };
      s.successModalOpen = true;
    });
  };
  const closeSuccessModal = () => {
    playSound('close');
    updateStore(s => { s.successModalOpen = false; });
  };

  return {
    ...state,
    playSound,
    setAppMode,
    navigateTo,
    setKioskStep,
    setKioskSection,
    setKioskPointType,
    setKioskBuildingId,
    setKioskFloorId,
    openKioskFlatDetail,
    closeKioskFlatDetail,
    setTimeOfDay,
    toggleTimeOfDay,
    setInsolationHour,
    triggerScreenshot,
    closeScreenshotToast,
    openVideoTourModal,
    closeVideoTourModal,
    openKioskSettingsModal,
    closeKioskSettingsModal,
    updateKioskSettings,
    startKioskSession,
    endKioskSession,
    finishFarewell,
    toggleFavorite,
    isFavorite,
    setFilters,
    resetFilters,
    openCallbackModal,
    closeCallbackModal,
    openBookingModal,
    closeBookingModal,
    openMortgageModal,
    closeMortgageModal,
    openBookletModal,
    closeBookletModal,
    openPlanoplanModal,
    closePlanoplanModal,
    openLightbox,
    closeLightbox,
    openPromoModal,
    closePromoModal,
    openBenefitModal,
    closeBenefitModal,
    showSuccessModal,
    closeSuccessModal
  };
}
