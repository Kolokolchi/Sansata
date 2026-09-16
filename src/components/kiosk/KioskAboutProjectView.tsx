import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { benefitsItems } from '../../data/commonData';
import { 
  Building2, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Layers, 
  FileText, 
  Clock, 
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export const KioskAboutProjectView: React.FC = () => {
  const { setKioskSection, openLightbox, openBookletModal } = useAppStore();
  const [activeTab, setActiveTab] = useState<'concept' | 'materials' | 'engineering' | 'timeline'>('concept');

  const engineeringSpecs = [
    { title: 'Многоступенчатая очистка воды', desc: 'Ультрафильтрация и умягчение до стандартов питьевой воды во всех квартирах.' },
    { title: 'Приточно-вытяжная вентиляция', desc: 'Центральная вентиляция с фильтрацией F7 и рекуперацией тепла.' },
    { title: 'Умный дом и телеметрия', desc: 'Автоматический сбор показаний счетчиков и управление доступом через смартфон.' },
    { title: 'Усиленная звукоизоляция', desc: 'Плавающие полы и звукопоглощающие межквартирные перегородки (54 дБ).' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '16px'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderRadius: '16px',
        background: 'rgba(16, 20, 28, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => setKioskSection('genplan')}
          className="kiosk-btn"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} />
          <span>Генплан</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'concept', label: 'Концепция и архитектура' },
            { id: 'materials', label: 'Премиальные материалы' },
            { id: 'engineering', label: 'Инженерия и Smart-дом' },
            { id: 'timeline', label: 'Ход строительства' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === tab.id ? '#e35204' : 'rgba(255, 255, 255, 0.1)',
                background: activeTab === tab.id ? '#e35204' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={openBookletModal}
          className="kiosk-btn kiosk-btn--primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
        >
          <FileText size={15} />
          <span>Скачать презентацию</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="kiosk-glass kiosk-scroll" style={{
        padding: '32px',
        flex: 1,
        overflowY: 'auto'
      }}>
        {activeTab === 'concept' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <span className="kiosk-code-badge" style={{ width: 'fit-content' }}>
                B7 • О ПРОЕКТЕ
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.15 }}>
                Архитектурная эстетика Санкт-Петербурга в современном прочтении
              </h2>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.6, margin: 0 }}>
                Жилой комплекс STAVNI от Sansata Group объединяет исторический контекст Набережной Обводного канала и передовые стандарты бизнес-класса. Ступенчатая этажность от 8 до 11 этажей обеспечивает максимальную инсоляцию квартир и живописные панорамы на центр города.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#ff8e52', fontWeight: 700 }}>Срок сдачи</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>IV квартал 2026</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: '#ff8e52', fontWeight: 700 }}>Класс недвижимости</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>Бизнес-класс</div>
                </div>
              </div>
            </div>

            <div 
              style={{ borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', position: 'relative', minHeight: '320px' }}
              onClick={() => openLightbox('/images/hero_facade.jpg', 'Архитектурный фасад ЖК STAVNI', 'Ступенчатая композиция и натуральный клинкер')}
            >
              <img src="/images/hero_facade.jpg" alt="STAVNI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                <span className="kiosk-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Maximize2 size={14} /> Увеличить
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(227, 82, 4, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8e52', marginBottom: '16px' }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Клинкерный кирпич</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                Натуральный европейский клинкер ручной формовки с благородной текстурой и долговечностью более 100 лет.
              </p>
            </div>

            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '16px' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Дерево-алюминиевые окна</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                Широкоформатные панорамные стеклопакеты с энергосберегающим напылением Guardian ClimaGuard и дубовым профилем.
              </p>
            </div>

            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', marginBottom: '16px' }}>
                <Building2 size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Мрамор и латунь в лобби</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                Индивидуальный дизайн входных групп с крупноформатным натуральным керамогранитом и акцентными латунными элементами.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'engineering' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {engineeringSpecs.map((eng, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  gap: '16px'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(227, 82, 4, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff8e52',
                  flexShrink: 0
                }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {eng.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, marginTop: '8px' }}>
                    {eng.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Текущий прогресс: 72%
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                  Монолитные работы завершены, ведется облицовка фасадов и монтаж лифтов.
                </p>
              </div>
              <div style={{ width: '200px', height: '10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #e35204, #ff6b2b)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', height: '180px' }}>
                <img src="/images/hero_facade.jpg" alt="Ход строительства 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ borderRadius: '14px', overflow: 'hidden', height: '180px' }}>
                <img src="/images/courtyard.jpg" alt="Ход строительства 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ borderRadius: '14px', overflow: 'hidden', height: '180px' }}>
                <img src="/images/grand_lobby.jpg" alt="Ход строительства 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
