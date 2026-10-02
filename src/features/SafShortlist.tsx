import { useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Check, X } from 'lucide-react';
import { SelectionLink } from './SafVisualFloor';
import { safPlans } from '../lib/safMaterials';
import { safApartmentById, safApartmentPath, safObservedDate } from '../lib/safInventory';
import { parseSafPlanCode, safLevelLabel } from '../lib/safSelection';
import '../styles/saf-shortlist.css';

// Presentation fields only: the source records and their identities remain separate.
type Entry = { id: string; title: string; image?: string; href: string; facts: string[] };
type Props = {
  mode: 'favorites' | 'compare';
  saved: string[]; compared: string[]; favoriteApartments: string[]; comparedApartments: string[];
  onSave: (code: string) => void; onCompare: (code: string) => void;
  onFavoriteApartment: (id: string) => void; onCompareApartment: (id: string) => void;
};
const plansByCode = new Map(safPlans.plans.map(plan => [plan.code, plan]));
const area = (value: number) => `${value.toLocaleString('ru-RU')} м²`;

export function SafShortlist(props: Props) {
  const comparison = props.mode === 'compare';
  const [differences, setDifferences] = useState(false);
  const apartments: Entry[] = (comparison ? props.comparedApartments : props.favoriteApartments).flatMap(id => {
    const unit = safApartmentById.get(id);
    if (!unit) return [];
    return [{ id, title: `${unit.rooms}-комнатная № ${unit.number}`, image: plansByCode.get(unit.planCode || '')?.image,
      href: safApartmentPath(id), facts: [String(unit.rooms), area(unit.area), unit.section, String(unit.floor), String(unit.number), unit.planCode || 'Не опубликован', 'Уточняется', 'Уточняется'] }];
  });
  const plans: Entry[] = (comparison ? props.compared : props.saved).flatMap(id => {
    const plan = plansByCode.get(id);
    if (!plan) return [];
    const place = parseSafPlanCode(id);
    return [{ id, title: `${plan.rooms}-комнатная · ${id}`, image: plan.image, href: `/saf/plan/${encodeURIComponent(id)}`,
      facts: [String(plan.rooms), area(plan.area), place ? `P${place.block}` : 'Не указан', place ? safLevelLabel(place.level) : 'Не указан', 'Уточняется', 'Уточняется'] }];
  });
  const count = apartments.length + plans.length;
  const groups = [
    { title: 'Квартиры', entries: apartments, labels: ['Комнат', 'Площадь', 'Секция', 'Этаж', 'Номер квартиры', 'Код планировки', 'Цена сейчас', 'Наличие сейчас'],
      note: `Параметры квартир из снимка на ${safObservedDate}. Текущие цены и наличие уточняются.`, saved: props.favoriteApartments, compared: props.comparedApartments, save: props.onFavoriteApartment, compare: props.onCompareApartment },
    { title: 'Планировки из каталога', entries: plans, labels: ['Комнат', 'Площадь', 'Блок', 'Уровень', 'Цена сейчас', 'Наличие сейчас'],
      note: 'Опубликованные варианты планировок. Они не подтверждают наличие конкретной квартиры.', saved: props.saved, compared: props.compared, save: props.onSave, compare: props.onCompare },
  ];
  return <main className="saf-shortlist">
    <SelectionLink to="/saf/avenue" className="saf-shortlist-back"><ArrowLeft size={17} /> SAF Avenue</SelectionLink>
    <div className="saf-shortlist-heading"><div><span className="saf-kicker">SAF AVENUE / ВАШ ВЫБОР</span><h1>{comparison ? 'Сравнение' : 'Избранное'} <span>{count}</span></h1></div>
      <SelectionLink to={comparison ? '/saf/favorites' : '/saf/compare'}>{comparison ? 'Открыть избранное' : `Смотреть сравнение (${props.compared.length + props.comparedApartments.length})`} <ArrowRight size={17} /></SelectionLink>
    </div>
    <p className="saf-shortlist-note">Ваш выбор сохраняется в этом браузере. Если сохранение отключено, подборка доступна до перезагрузки страницы.</p>
    <div className="saf-shortlist-tools"><SelectionLink to="/saf/visual">Выбрать на 3D-плане</SelectionLink><SelectionLink to="/saf">Выбрать по параметрам</SelectionLink>
      {comparison && count > 1 && <label><input type="checkbox" checked={differences} onChange={event => setDifferences(event.target.checked)} /> Только различия</label>}
    </div>
    {count === 0 && <div className="saf-shortlist-empty"><Heart size={30} /><h2>{comparison ? 'Пока нечего сравнивать' : 'В избранном пока пусто'}</h2><p>{comparison ? 'Добавьте две или больше квартир кнопкой «Сравнить» в карточке или в избранном.' : 'Нажмите на сердечко в карточке квартиры или планировки — здесь появится ваш выбор.'}</p></div>}
    {groups.filter(group => group.entries.length).map(group => {
      const rows = group.labels.map((label, index) => ({ label, index, different: new Set(group.entries.map(entry => entry.facts[index])).size > 1 }));
      const shownRows = rows.filter(row => !differences || group.entries.length < 2 || row.different);
      return <section className="saf-shortlist-group" key={group.title} aria-label={group.title}>
        <h2>{group.title} <span>{group.entries.length}</span></h2><p className="saf-shortlist-note">{group.note}</p>
        {comparison && group.entries.length === 1 && <p className="saf-shortlist-hint">Добавьте ещё один вариант этой категории для сравнения.</p>}
        {comparison ? <>
          <p className="saf-shortlist-note">Если все варианты не помещаются, прокрутите таблицу вправо.</p>
          <div className="saf-shortlist-scroll" role="region" aria-label={`Сравнение: ${group.title}`} tabIndex={0}>
            <table className="saf-shortlist-table"><caption className="saf-shortlist-caption">{group.title}: сравнение выбранных вариантов</caption><thead><tr><th scope="col">Параметры</th>{group.entries.map(entry => <th scope="col" key={entry.id}>
              <button className="saf-shortlist-remove" type="button" aria-label={`Убрать ${entry.title} из сравнения`} onClick={() => group.compare(entry.id)}><X size={17} /></button>
              <SelectionLink to={entry.href}>{entry.image ? <img src={entry.image} alt={`План: ${entry.title}`} /> : <span className="saf-shortlist-no-image">План не опубликован</span>}<strong>{entry.title}</strong></SelectionLink>
              <button className="saf-shortlist-save" type="button" aria-label={`${group.saved.includes(entry.id) ? 'Убрать из избранного' : 'В избранное'}: ${entry.title}`} aria-pressed={group.saved.includes(entry.id)} onClick={() => group.save(entry.id)}><Heart size={17} fill={group.saved.includes(entry.id) ? 'currentColor' : 'none'} />{group.saved.includes(entry.id) ? 'В избранном' : 'В избранное'}</button>
            </th>)}</tr></thead><tbody>{shownRows.map(row => <tr key={row.label} className={row.different ? 'has-difference' : undefined}><th scope="row">{row.label}</th>{group.entries.map(entry => <td key={entry.id}>{entry.facts[row.index]}</td>)}</tr>)}</tbody></table>
          </div>
          {shownRows.length === 0 && <p>Параметры выбранных вариантов совпадают. Снимите флажок «Только различия», чтобы увидеть все строки.</p>}
        </> : <div className="saf-shortlist-cards">{group.entries.map(entry => <article key={entry.id}>
          <button className="saf-shortlist-remove" type="button" aria-label={`Убрать ${entry.title} из избранного`} onClick={() => group.save(entry.id)}><X size={18} /></button>
          <SelectionLink to={entry.href}>{entry.image ? <img src={entry.image} alt={`План: ${entry.title}`} loading="lazy" /> : <span className="saf-shortlist-no-image">План не опубликован</span>}<h3>{entry.title}</h3></SelectionLink>
          <p>{entry.facts[1]} · {group.title === 'Квартиры' ? `секция ${entry.facts[2]} · этаж ${entry.facts[3]}` : `${entry.facts[2]} · ${entry.facts[3]}`}</p>
          <div className="saf-shortlist-card-actions"><button type="button" aria-pressed={group.compared.includes(entry.id)} onClick={() => group.compare(entry.id)}>{group.compared.includes(entry.id) && <Check size={16} />}{group.compared.includes(entry.id) ? 'Убрать из сравнения' : 'Сравнить'}</button><SelectionLink to={entry.href}>Открыть <ArrowRight size={16} /></SelectionLink></div>
        </article>)}</div>}
      </section>;
    })}
  </main>;
}
