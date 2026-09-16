import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Check, Phone, User, Send, Download, Sparkles, Box, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

export const ModalsContainer: React.FC = () => {
  const {
    callbackModalOpen,
    closeCallbackModal,
    bookingModalOpen,
    closeBookingModal,
    bookingFlat,
    mortgageModalOpen,
    closeMortgageModal,
    mortgageCalcData,
    bookletModalOpen,
    closeBookletModal,
    planoplanModalOpen,
    closePlanoplanModal,
    planoplanUid,
    lightboxModalOpen,
    closeLightbox,
    lightboxImage,
    promoModalOpen,
    closePromoModal,
    selectedPromo,
    benefitModalOpen,
    closeBenefitModal,
    selectedBenefit,
    successModalOpen,
    closeSuccessModal,
    successMessage,
    showSuccessModal
  } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    agree: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent, formType: string) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 10) {
      alert('Пожалуйста, укажите корректный номер телефона.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      // Close all modals
      closeCallbackModal();
      closeBookingModal();
      closeMortgageModal();
      closeBookletModal();
      setFormData({ name: '', phone: '', agree: true });
      showSuccessModal(
        'Заявка успешно отправлена!',
        'Наш менеджер свяжется с вами в течение 10 минут в рабочее время для уточнения деталей.'
      );
    }, 600);
  };

  return (
    <>
      {/* 1. Callback Modal */}
      <div className={`modal-overlay ${callbackModalOpen ? 'is-open' : ''}`} onClick={closeCallbackModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeCallbackModal}><X size={20} /></button>
          
          <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Заказать обратный звонок</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', marginBottom: '24px' }}>
            Оставьте ваши контакты, и менеджер отдела продаж ЖК STAVNI Обводный перезвонит вам.
          </p>

          <form onSubmit={e => handleSubmit(e, 'callback')}>
            <div className="form-group">
              <label className="form-label">Ваше имя</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Иван" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Номер телефона</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+7 (999) 000-00-00" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.agree} 
                  onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                  required
                />
                <span>Согласен на обработку персональных данных в соответствии с 152-ФЗ</span>
              </label>
            </div>

            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Перезвоните мне'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Booking Modal */}
      <div className={`modal-overlay ${bookingModalOpen ? 'is-open' : ''}`} onClick={closeBookingModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeBookingModal}><X size={20} /></button>

          <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Бронирование квартиры
          </h3>

          {bookingFlat && (
            <div style={{
              background: 'var(--color-additional-bg)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ width: '80px', height: '80px', background: '#ffffff', borderRadius: '8px', padding: '4px', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                <img src={bookingFlat.planUrl} alt="Планировка" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-brand-base)' }}>
                  {bookingFlat.roomTypeName} №{bookingFlat.number} • {bookingFlat.area} м²
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginTop: '2px' }}>
                  Секция {bookingFlat.section}, Этаж {bookingFlat.floor} из {bookingFlat.totalFloors}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
                  {bookingFlat.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', marginBottom: '20px' }}>
            Бесплатное бронирование фиксирует стоимость квартиры на 5 рабочих дней.
          </p>

          <form onSubmit={e => handleSubmit(e, 'booking')}>
            <div className="form-group">
              <label className="form-label">Ваше имя</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Константин" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Номер телефона</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+7 (999) 000-00-00" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.agree} 
                  onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                  required
                />
                <span>Согласен на обработку персональных данных</span>
              </label>
            </div>

            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Фиксация брони...' : 'Забронировать квартиру'}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Mortgage Request Modal */}
      <div className={`modal-overlay ${mortgageModalOpen ? 'is-open' : ''}`} onClick={closeMortgageModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeMortgageModal}><X size={20} /></button>

          <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
            Заявка на одобрение ипотеки
          </h3>

          {mortgageCalcData && (
            <div style={{
              background: 'var(--color-additional-bg)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '13px'
            }}>
              <div>Стоимость: <strong>{mortgageCalcData.propertyPrice?.toLocaleString('ru-RU')} ₽</strong></div>
              <div>Платёж: <strong style={{ color: 'var(--color-brand-base)' }}>{mortgageCalcData.monthlyPayment?.toLocaleString('ru-RU')} ₽/мес</strong></div>
              <div>Взнос: <strong>{mortgageCalcData.downPaymentRubles?.toLocaleString('ru-RU')} ₽ ({mortgageCalcData.downPaymentPercent}%)</strong></div>
              <div>Ставка: <strong>{mortgageCalcData.selectedRate}%</strong></div>
            </div>
          )}

          <p style={{ fontSize: '14px', color: 'var(--color-additional-1)', marginBottom: '20px' }}>
            Ипотечный брокер бесплатно подберет минимальную ставку и подаст заявку сразу во все банки.
          </p>

          <form onSubmit={e => handleSubmit(e, 'mortgage')}>
            <div className="form-group">
              <label className="form-label">Ваше имя</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Алексей" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Номер телефона</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+7 (999) 000-00-00" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.agree} 
                  onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                  required
                />
                <span>Согласен на обработку персональных данных</span>
              </label>
            </div>

            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Получить одобрение ипотеки'}
            </button>
          </form>
        </div>
      </div>

      {/* 4. Booklet Download Modal */}
      <div className={`modal-overlay ${bookletModalOpen ? 'is-open' : ''}`} onClick={closeBookletModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
          <button className="modal-close" onClick={closeBookletModal}><X size={20} /></button>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              aspectRatio: '3 / 4'
            }}>
              <img 
                src="/images/booklet_cover.jpg" 
                alt="Презентационный буклет STAVNI" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-brand-base)',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                <FileText size={14} /> PDF Презентация • 48 стр.
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.3 }}>
                Скачать официальный буклет проекта
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-additional-1)', marginTop: '6px', lineHeight: 1.5 }}>
                Полный каталог с рендерами, детальными планировками, благоустройством двора-сада и актуальным прайс-листом.
              </p>
            </div>
          </div>

          <form onSubmit={e => handleSubmit(e, 'booklet')}>
            <div className="form-group">
              <label className="form-label">Номер телефона для получения PDF</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+7 (999) 000-00-00" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.agree} 
                  onChange={e => setFormData({ ...formData, agree: e.target.checked })}
                  required
                />
                <span>Согласен на получение материалов по проекту STAVNI</span>
              </label>
            </div>

            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Формирование ссылки...' : 'Скачать буклет проекта'}
            </button>
          </form>
        </div>
      </div>

      {/* 5. Planoplan 3D Tour Modal */}
      <div 
        className={`modal-overlay ${planoplanModalOpen ? 'is-open' : ''}`}
        onClick={closePlanoplanModal}
        style={{ padding: '10px' }}
      >
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '1200px', width: '95vw', height: '85vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#1b1416',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Box size={18} color="var(--color-brand-light)" /> 3D-Тур Planoplan: ЖК STAVNI Обводный
            </div>
            <button 
              onClick={closePlanoplanModal}
              style={{ color: '#ffffff', opacity: 0.8 }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative', background: '#000000' }}>
            <iframe
              src={`https://widget.planoplan.com/${planoplanUid}?lang=ru`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Planoplan 3D Tour"
            />
          </div>
        </div>
      </div>

      {/* 6. Lightbox Zoom Modal */}
      <div 
        className={`modal-overlay ${lightboxModalOpen ? 'is-open' : ''}`}
        onClick={closeLightbox}
        style={{ padding: '20px' }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '-40px',
              right: '0',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Закрыть <X size={20} />
          </button>

          <img 
            src={lightboxImage.src} 
            alt={lightboxImage.title}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              background: '#ffffff'
            }}
          />

          {(lightboxImage.title || lightboxImage.caption) && (
            <div style={{
              color: '#ffffff',
              textAlign: 'center',
              marginTop: '16px',
              maxWidth: '600px'
            }}>
              {lightboxImage.title && <div style={{ fontSize: '18px', fontWeight: 800 }}>{lightboxImage.title}</div>}
              {lightboxImage.caption && <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>{lightboxImage.caption}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 7. Promo Detail Modal */}
      {selectedPromo && (
        <div className={`modal-overlay ${promoModalOpen ? 'is-open' : ''}`} onClick={closePromoModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closePromoModal}><X size={20} /></button>

            <span style={{
              display: 'inline-block',
              background: 'var(--color-brand-base)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '12px'
            }}>
              {selectedPromo.badge}
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>
              {selectedPromo.title}
            </h3>

            <p style={{ fontSize: '15px', color: 'var(--color-additional-1)', lineHeight: 1.6, marginBottom: '20px' }}>
              {selectedPromo.fullTerms}
            </p>

            <div style={{
              background: 'var(--color-additional-bg)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--color-brand-text)',
              fontWeight: 600,
              marginBottom: '24px'
            }}>
              Срок действия: {selectedPromo.validUntil}
            </div>

            <button
              className="btn btn--primary btn--lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                closePromoModal();
                useAppStore().openCallbackModal();
              }}
            >
              Зафиксировать условия
            </button>
          </div>
        </div>
      )}

      {/* 8. Benefit Detail Modal */}
      {selectedBenefit && (
        <div className={`modal-overlay ${benefitModalOpen ? 'is-open' : ''}`} onClick={closeBenefitModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeBenefitModal}><X size={20} /></button>

            <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>
              {selectedBenefit.title}
            </h3>

            <p style={{ fontSize: '15px', color: 'var(--color-brand-text)', marginBottom: '20px', lineHeight: 1.6 }}>
              {selectedBenefit.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {selectedBenefit.details.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="var(--color-brand-base)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '14px', color: 'var(--color-additional-1)', lineHeight: 1.4 }}>{d}</span>
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                closeBenefitModal();
                useAppStore().openCallbackModal();
              }}
            >
              Записаться на экскурсию в комплекс
            </button>
          </div>
        </div>
      )}

      {/* 9. Success Modal Toast */}
      <div className={`modal-overlay ${successModalOpen ? 'is-open' : ''}`} onClick={closeSuccessModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#16a34a',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Check size={32} strokeWidth={3} />
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>
            {successMessage.title || 'Заявка принята!'}
          </h3>

          <p style={{ fontSize: '15px', color: 'var(--color-additional-1)', lineHeight: 1.6, marginBottom: '28px' }}>
            {successMessage.text || 'Мы свяжемся с вами в ближайшее время.'}
          </p>

          <button
            className="btn btn--primary btn--lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={closeSuccessModal}
          >
            Понятно
          </button>
        </div>
      </div>
    </>
  );
};
