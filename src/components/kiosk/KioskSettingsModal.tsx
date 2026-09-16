import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Settings, Volume2, Clock, Monitor, Sparkles, Check } from 'lucide-react';

export const KioskSettingsModal: React.FC = () => {
  const { 
    kioskSettingsModalOpen, 
    closeKioskSettingsModal, 
    kioskSettings, 
    updateKioskSettings 
  } = useAppStore();

  if (!kioskSettingsModalOpen) return null;

  return (
    <div className="kiosk-modal-backdrop">
      <div 
        className="kiosk-glass-heavy"
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: '32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(227, 82, 4, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff8e52'
            }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                Настройки терминала
              </h2>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Параметры работы сенсорного киоска
              </div>
            </div>
          </div>

          <button
            onClick={closeKioskSettingsModal}
            className="kiosk-btn kiosk-btn--icon"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Sound FX Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Volume2 size={20} color="#ff8e52" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Тактильный звук кнопок</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Звуковой отклик на нажатия и переключения</div>
              </div>
            </div>

            <button
              onClick={() => updateKioskSettings({ soundEnabled: !kioskSettings.soundEnabled })}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                background: kioskSettings.soundEnabled ? '#22c55e' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {kioskSettings.soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>

          {/* Inactivity timeout */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} color="#ff8e52" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Скринсейвер при бездействии</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Таймаут возврата на заставку терминала</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {[1, 3, 5, 10].map(mins => (
                <button
                  key={mins}
                  onClick={() => updateKioskSettings({ autoInactivityMinutes: mins })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: kioskSettings.autoInactivityMinutes === mins ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                    background: kioskSettings.autoInactivityMinutes === mins ? '#e35204' : 'rgba(255, 255, 255, 0.03)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {mins} мин
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Monitor size={20} color="#ff8e52" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Качество 3D-графики</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Уровень детализации визуализации</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {[
                { id: 'ultra', label: 'Ultra (4K)' },
                { id: 'high', label: 'High (FHD)' },
                { id: 'eco', label: 'Eco' }
              ].map(q => (
                <button
                  key={q.id}
                  onClick={() => updateKioskSettings({ presentationQuality: q.id as any })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: kioskSettings.presentationQuality === q.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                    background: kioskSettings.presentationQuality === q.id ? '#e35204' : 'rgba(255, 255, 255, 0.03)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={closeKioskSettingsModal}
            className="kiosk-btn kiosk-btn--primary"
            style={{ padding: '10px 24px', borderRadius: '10px' }}
          >
            <Check size={16} />
            <span>Сохранить настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
