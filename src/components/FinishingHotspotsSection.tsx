import React, { useState } from 'react';
import { Sparkles, Check, Layers, Palette } from 'lucide-react';

interface Hotspot {
  id: string;
  x: number; // in percent
  y: number; // in percent
  title: string;
  desc: string;
}

export const FinishingHotspotsSection: React.FC = () => {
  const [finishingType, setFinishingType] = useState<'whitebox' | 'turnkey'>('whitebox');
  const [activeHotspot, setActiveHotspot] = useState<string | null>('wb-1');

  const whiteboxHotspots: Hotspot[] = [
    {
      id: 'wb-1',
      x: 18,
      y: 45,
      title: 'Алюминиевые стеклопакеты 2.4м',
      desc: 'Увеличенная высота остекления, мультифункциональные энергоэффективные стекла и звукоизолирующий профиль.'
    },
    {
      id: 'wb-2',
      x: 52,
      y: 78,
      title: 'Отопление водяным теплым полом',
      desc: 'Никаких настенных радиаторов — равномерное распределение тепла и возможность терморегуляции в каждой комнате.'
    },
    {
      id: 'wb-3',
      x: 8,
      y: 62,
      title: 'Скрытая электроразводка',
      desc: 'Выводы под розетки, выключатели, освещение и кондиционирование строго по продуманному дизайн-проекту.'
    },
    {
      id: 'wb-4',
      x: 75,
      y: 65,
      title: 'Стяжка пола с шумоизоляцией',
      desc: 'Многослойная полусухая стяжка с демпферной звукоизоляционной мембраной, готовая к укладке любого покрытия.'
    },
    {
      id: 'wb-5',
      x: 78,
      y: 35,
      title: 'Штукатурка стен под покраску Q3',
      desc: 'Идеально оштукатуренные и выровненные гипсовой смесью по маякам стены.'
    },
    {
      id: 'wb-6',
      x: 52,
      y: 18,
      title: 'Высокие потолки 3.0 метра',
      desc: 'Ощущение простора и воздуха, монолитные перекрытия со звукоизоляцией.'
    }
  ];

  const turnkeyHotspots: Hotspot[] = [
    {
      id: 'tk-1',
      x: 20,
      y: 65,
      title: 'Кухонный остров из мрамора',
      desc: 'Встроенная премиальная бытовая техника, каменная столешница и акцентная подсветка.'
    },
    {
      id: 'tk-2',
      x: 58,
      y: 72,
      title: 'Натуральный дубовый паркет',
      desc: 'Инженерная доска с защитным матовым лаком, уложенная на теплый пол.'
    },
    {
      id: 'tk-3',
      x: 62,
      y: 28,
      title: 'Дизайнерский многоуровневый свет',
      desc: 'Трековые споты, подвесные светильники из латуни и светодиодные теневые плинтусы.'
    },
    {
      id: 'tk-4',
      x: 35,
      y: 42,
      title: 'Панорамные шторы с электроприводом',
      desc: 'Управление приватностью и освещением с пульта или через приложение «Умный дом».'
    },
    {
      id: 'tk-5',
      x: 82,
      y: 52,
      title: 'Шумоизоляция премиум-класса',
      desc: 'Акустические панели и перегородки, гарантирующие абсолютную тишину.'
    }
  ];

  const isWb = finishingType === 'whitebox';
  const hotspots = isWb ? whiteboxHotspots : turnkeyHotspots;
  const bgImg = isWb ? '/images/whitebox.jpg' : '/images/turnkey_living.jpg';

  const whiteboxPoints = [
    'Стены выровнены и подготовлены под финишное покрытие (Q3)',
    'Стяжка пола с шумоизолирующим слоем',
    'Разводка электрики с установкой подрозетников',
    'Разводка водоснабжения и канализации',
    'Водяной теплый пол с терморегуляторами',
    'Стальная взломостойкая дверь с электронным замком'
  ];

  const turnkeyPoints = [
    'Финишная покраска стен влагостойкой экологичной краской',
    'Укладка натуральной паркетной доски и керамогранита',
    'Полная установка сантехники европейских брендов',
    'Межкомнатные скрытые двери Invisible высотой 2.4м',
    'Интеграция датчиков системы «Умный дом»',
    'Готовая меблировка кухни с техникой (по запросу)'
  ];

  const currentPoints = isWb ? whiteboxPoints : turnkeyPoints;

  return (
    <section className="section" id="finishing">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="section-tag">Качество исполнения</span>
            <h2 className="section-title">Варианты отделки в ЖК STAVNI</h2>
            <p className="section-subtitle">
              Выберите безупречную базу Whitebox для воплощения собственных идей или закажите готовую дизайнерскую отделку под ключ.
            </p>
          </div>

          {/* Finishing Type Switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`flats-tab ${finishingType === 'whitebox' ? 'is-active' : ''}`}
              onClick={() => {
                setFinishingType('whitebox');
                setActiveHotspot('wb-1');
              }}
            >
              <Layers size={16} /> Whitebox (Предчистовая)
            </button>
            <button
              className={`flats-tab ${finishingType === 'turnkey' ? 'is-active' : ''}`}
              onClick={() => {
                setFinishingType('turnkey');
                setActiveHotspot('tk-1');
              }}
            >
              <Palette size={16} /> Под ключ (Дизайнерская)
            </button>
          </div>
        </div>

        {/* Interactive Hotspots Area */}
        <div className="hotspots-container">
          <img 
            src={bgImg} 
            alt={isWb ? 'Отделка Whitebox STAVNI' : 'Дизайнерская отделка под ключ STAVNI'}
            className="hotspots-bg"
          />

          {hotspots.map(hs => {
            const isActive = activeHotspot === hs.id;
            return (
              <div
                key={hs.id}
                className="hotspot-pin"
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                onClick={() => setActiveHotspot(isActive ? null : hs.id)}
              >
                <div className="hotspot-dot">
                  +
                </div>

                <div 
                  className="hotspot-tooltip"
                  style={{ opacity: isActive ? 1 : undefined, pointerEvents: isActive ? 'auto' : undefined }}
                >
                  <div style={{ color: 'var(--color-brand-light)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 800 }}>
                    {isWb ? 'Whitebox стандарт' : 'Дизайн стандарт'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{hs.title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', maxWidth: '240px', whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {hs.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom checklist */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '36px'
        }}>
          {currentPoints.map((item, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--color-additional-bg)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--color-brand-base)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={14} strokeWidth={3} />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
