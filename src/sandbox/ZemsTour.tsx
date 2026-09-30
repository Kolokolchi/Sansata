import { useEffect, useState } from 'react';
import { siteUrl } from '../lib/site';
import './zems-tour.css';

const tourUrl = 'https://ep.matterport.host/index/?m=RQ6XPTgW9Du&title=0';

export default function ZemsTour() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    document.title = 'Тестовый 3D-тур Земсдизайн';
  }, []);

  return <main className="zems-sandbox">
    {isOpen ? <div className="zems-tour" role="dialog" aria-label="3D-тур Земсдизайн">
      <iframe
        className="zems-tour__frame"
        src={tourUrl}
        title="Земсдизайн — экскурсия по квартире"
        allow="xr-spatial-tracking"
        allowFullScreen
        loading="eager"
      />
      <button className="zems-tour__close" type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть 3D-тур">
        <span aria-hidden="true" />
      </button>
    </div> : <section className="zems-sandbox__closed">
      <span>ПЕСОЧНИЦА / 3D-ТУР</span>
      <h1>Экскурсия по квартире Земсдизайн</h1>
      <p>Откройте тур, чтобы проверить перемещение между точками, обзор 360° и управление на вашем устройстве.</p>
      <button type="button" onClick={() => setIsOpen(true)}>Открыть экскурсию</button>
      <a href={siteUrl('/')}>Вернуться на сайт</a>
    </section>}
  </main>;
}
