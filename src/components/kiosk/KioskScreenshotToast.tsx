import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, Download, QrCode, X, Camera, Share2 } from 'lucide-react';

export const KioskScreenshotToast: React.FC = () => {
  const { screenshotToastOpen, closeScreenshotToast, screenshotPreviewUrl, showSuccessModal } = useAppStore();

  useEffect(() => {
    if (screenshotToastOpen) {
      const timer = setTimeout(() => {
        closeScreenshotToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [screenshotToastOpen, closeScreenshotToast]);

  if (!screenshotToastOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = screenshotPreviewUrl || '/images/hero_facade.jpg';
    link.download = `stavni_screenshot_${Date.now()}.jpg`;
    link.click();
    closeScreenshotToast();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      right: '28px',
      zIndex: 9990,
      width: '380px',
      animation: 'kiosk-toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes kiosk-toast-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div 
        className="kiosk-glass-heavy"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          border: '1.5px solid rgba(34, 197, 94, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(34, 197, 94, 0.25)'
        }}
      >
        {/* Top title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80'
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
                Снимок сохранен!
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Снимок экрана успешно сформирован
              </div>
            </div>
          </div>

          <button
            onClick={closeScreenshotToast}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div style={{
          width: '100%',
          height: '140px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <img 
            src={screenshotPreviewUrl || '/images/hero_facade.jpg'} 
            alt="Снимок экрана" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.7)',
            fontSize: '10px',
            color: '#ffffff',
            fontWeight: 700
          }}>
            STAVNI HD
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownload}
            className="kiosk-btn kiosk-btn--primary"
            style={{ flex: 1, padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
          >
            <Download size={14} />
            <span>Скачать файл</span>
          </button>

          <button
            onClick={() => {
              showSuccessModal(
                'QR-код для загрузки на телефон',
                'Отсканируйте код камерой смартфона, чтобы открыть снимок экрана и сохранить его в галерею устройства.'
              );
              closeScreenshotToast();
            }}
            className="kiosk-btn"
            style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}
            title="Получить по QR-коду"
          >
            <QrCode size={14} />
            <span>QR-код</span>
          </button>
        </div>
      </div>
    </div>
  );
};
