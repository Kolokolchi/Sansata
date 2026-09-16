import React, { useState } from 'react';
import { documentItems } from '../data/commonData';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DocsSection: React.FC = () => {
  const { openBookletModal } = useAppStore();

  // Group documents by category
  const categories = Array.from(new Set(documentItems.map(d => d.category)));
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [categories[0]]: true,
    [categories[1]]: true
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  return (
    <section className="section" id="docs">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Официальная информация</span>
          <h2 className="section-title">Документы проекта</h2>
          <p className="section-subtitle">
            Проектные декларации, разрешения на строительство и градостроительные планы в соответствии с 214-ФЗ.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map((cat, idx) => {
            const isOpen = !!openCategories[cat];
            const docs = documentItems.filter(d => d.category === cat);

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: isOpen ? 'var(--color-additional-bg)' : '#ffffff',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={20} color="var(--color-brand-base)" />
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>{cat}</span>
                    <span style={{
                      background: 'rgba(227, 82, 4, 0.1)',
                      color: 'var(--color-brand-base)',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {docs.length}
                    </span>
                  </div>

                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {/* Documents List */}
                {isOpen && (
                  <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {docs.map(doc => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-additional-bg)',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800
                          }}>
                            PDF
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-additional-1)' }}>
                              {doc.fileSize} • {doc.date}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={openBookletModal}
                        >
                          <Download size={14} /> Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
