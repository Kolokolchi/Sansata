import { ParkingSpot, CommercialSpace, MopSpace, OtherAmenity } from '../types';

export const parkingSpotsData: ParkingSpot[] = [
  { id: 'p-101', number: 101, level: -1, type: 'standard', typeName: 'Стандартное', area: 14.5, price: 1850000, status: 'available', x: 80, y: 120 },
  { id: 'p-102', number: 102, level: -1, type: 'standard', typeName: 'Стандартное', area: 14.5, price: 1850000, status: 'reserved', x: 130, y: 120 },
  { id: 'p-103', number: 103, level: -1, type: 'ev', typeName: 'С электрозарядкой (EV)', area: 16.0, price: 2150000, status: 'available', hasCharger: true, x: 180, y: 120 },
  { id: 'p-104', number: 104, level: -1, type: 'ev', typeName: 'С электрозарядкой (EV)', area: 16.0, price: 2150000, status: 'available', hasCharger: true, x: 230, y: 120 },
  { id: 'p-105', number: 105, level: -1, type: 'family', typeName: 'Семейное (на 2 авто)', area: 28.0, price: 3200000, status: 'available', x: 280, y: 120 },
  { id: 'p-106', number: 106, level: -1, type: 'standard', typeName: 'Стандартное', area: 14.5, price: 1850000, status: 'sold', x: 330, y: 120 },
  { id: 'p-107', number: 107, level: -1, type: 'moto', typeName: 'Мото-место', area: 6.5, price: 850000, status: 'available', x: 380, y: 120 },
  
  { id: 'p-108', number: 108, level: -1, type: 'standard', typeName: 'Стандартное', area: 15.0, price: 1900000, status: 'available', x: 80, y: 220 },
  { id: 'p-109', number: 109, level: -1, type: 'standard', typeName: 'Стандартное', area: 15.0, price: 1900000, status: 'available', x: 130, y: 220 },
  { id: 'p-110', number: 110, level: -1, type: 'ev', typeName: 'С электрозарядкой (EV)', area: 16.5, price: 2200000, status: 'reserved', hasCharger: true, x: 180, y: 220 },
  { id: 'p-111', number: 111, level: -1, type: 'family', typeName: 'Семейное (на 2 авто)', area: 29.0, price: 3300000, status: 'available', x: 230, y: 220 },
  { id: 'p-112', number: 112, level: -1, type: 'standard', typeName: 'Стандартное', area: 14.5, price: 1850000, status: 'available', x: 280, y: 220 },
  { id: 'p-113', number: 113, level: -1, type: 'moto', typeName: 'Мото-место', area: 7.0, price: 890000, status: 'available', x: 330, y: 220 },

  { id: 'p-201', number: 201, level: -2, type: 'standard', typeName: 'Стандартное', area: 14.0, price: 1650000, status: 'available', x: 80, y: 120 },
  { id: 'p-202', number: 202, level: -2, type: 'standard', typeName: 'Стандартное', area: 14.0, price: 1650000, status: 'available', x: 130, y: 120 },
  { id: 'p-203', number: 203, level: -2, type: 'ev', typeName: 'С электрозарядкой (EV)', area: 15.5, price: 1950000, status: 'available', hasCharger: true, x: 180, y: 120 },
  { id: 'p-204', number: 204, level: -2, type: 'family', typeName: 'Семейное (на 2 авто)', area: 27.5, price: 2950000, status: 'available', x: 230, y: 120 },
  { id: 'p-205', number: 205, level: -2, type: 'standard', typeName: 'Стандартное', area: 14.0, price: 1650000, status: 'reserved', x: 280, y: 120 },
  { id: 'p-206', number: 206, level: -2, type: 'standard', typeName: 'Стандартное', area: 14.0, price: 1650000, status: 'available', x: 330, y: 120 }
];

export const commercialSpacesData: CommercialSpace[] = [
  {
    id: 'comm-1',
    number: 1,
    name: 'Помещение под ресторан / авторскую кофейню',
    area: 148.5,
    floor: 1,
    section: 1,
    price: 49500000,
    pricePerMeter: 333333,
    purpose: 'Ресторан / Кафе',
    ceilingHeight: 4.8,
    powerKw: 45,
    status: 'available',
    entrance: 'both',
    image: '/images/vokzal_1853.jpg',
    planUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'comm-2',
    number: 2,
    name: 'Флагманский супермаркет деликатесов',
    area: 285.0,
    floor: 1,
    section: 2,
    price: 85500000,
    pricePerMeter: 300000,
    purpose: 'Супермаркет / Гастроном',
    ceilingHeight: 4.8,
    powerKw: 80,
    status: 'available',
    entrance: 'street',
    image: '/images/facade_3d.jpg',
    planUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'comm-3',
    number: 3,
    name: 'Студия красоты & SPA салон',
    area: 92.4,
    floor: 1,
    section: 3,
    price: 32340000,
    pricePerMeter: 350000,
    purpose: 'Салон красоты / SPA',
    ceilingHeight: 4.5,
    powerKw: 25,
    status: 'available',
    entrance: 'courtyard',
    image: '/images/grand_lobby.jpg',
    planUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'comm-4',
    number: 4,
    name: 'Аптека и медицинская лаборатория',
    area: 68.0,
    floor: 1,
    section: 4,
    price: 24480000,
    pricePerMeter: 360000,
    purpose: 'Аптека / Медицина',
    ceilingHeight: 4.5,
    powerKw: 20,
    status: 'reserved',
    entrance: 'street',
    image: '/images/turnkey_living.jpg',
    planUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'comm-5',
    number: 5,
    name: 'Пункт выдачи / Бутик подарков',
    area: 54.2,
    floor: 1,
    section: 5,
    price: 19512000,
    pricePerMeter: 360000,
    purpose: 'Свободное назначение',
    ceilingHeight: 4.5,
    powerKw: 15,
    status: 'available',
    entrance: 'street',
    image: '/images/whitebox.jpg',
    planUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  }
];

export const mopSpacesData: MopSpace[] = [
  {
    id: 'mop-1',
    title: 'Центральное гранд-лобби',
    category: 'lobby',
    categoryName: 'Гранд-лобби',
    description: 'Впечатляющее двусветное пространство с высотой потолков 4.8 метра, авторской световой инсталляцией и натуральным мрамором в отделке.',
    features: ['Потолки 4.8м', 'Натуральный мрамор', 'Зона ожидания', 'Каминная зона'],
    imageUrl: '/images/grand_lobby.jpg',
    planoplanUid: '2ee1019ddb3e8f756ad9aa354403604c_3d'
  },
  {
    id: 'mop-2',
    title: 'Консьерж-сервис 24/7',
    category: 'concierge',
    categoryName: 'Консьерж',
    description: 'Стойка консьержа отельного уровня для решения любых бытовых задач: от приема курьерских посылок до заказа клининга и бронирования трансфера.',
    features: ['Круглосуточная служба', 'Почтовая комната', 'Холодильник для доставок', 'Услуги валет-паркинга'],
    imageUrl: '/images/grand_lobby.jpg'
  },
  {
    id: 'mop-3',
    title: 'Дизайнерские лифтовые холлы',
    category: 'elevators',
    categoryName: 'Лифтовые холлы',
    description: 'Бесшумные скоростные лифты премиум-класса с индивидуальным дизайном кабин и прямым спуском в подземный паркинг.',
    features: ['Скорость 2.0 м/с', 'Спуск в паркинг', 'Акустическая изоляция', 'Интеллектуальное распределение'],
    imageUrl: '/images/facade_3d.jpg'
  },
  {
    id: 'mop-4',
    title: 'Колясочные и лапомойки',
    category: 'stroller',
    categoryName: 'Сервисные зоны',
    description: 'Оборудованные запираемые помещения для хранения детских колясок, самокатов и велосипедов с теплыми полами и мойками для лап питомцев.',
    features: ['Face ID доступ', 'Теплые полы', 'Лапомойка с душем', 'Зарядка электросамокатов'],
    imageUrl: '/images/whitebox.jpg'
  },
  {
    id: 'mop-5',
    title: 'Лаунж для встреч и коворкинг',
    category: 'lounge',
    categoryName: 'Лаунж-зона',
    description: 'Камерное пространство для жителей с высокоскоростным Wi-Fi, кофе-пойнтом и звукоизолированными кабинками для звонков.',
    features: ['Высокоскоростной Wi-Fi', 'Кофе-пойнт', 'Кабинки для Zoom', 'Мягкие кресла'],
    imageUrl: '/images/turnkey_living.jpg'
  }
];

export const otherAmenitiesData: OtherAmenity[] = [
  {
    id: 'amenity-1',
    title: 'Индивидуальные кладовые (Келлеры)',
    subtitle: '161 кладовое помещение на -1 и -2 этажах',
    description: 'Освободите балкон и квартиру от сезонных вещей, спортивного инвентаря, шин и чемоданов. Кладовые оборудованы вентиляцией, датчиками дыма и системой контроля доступа.',
    category: 'cellar',
    specs: [
      { label: 'Площадь', value: 'от 3.2 до 9.8 м²' },
      { label: 'Высота потолков', value: '3.0 м' },
      { label: 'Стоимость', value: 'от 480 000 ₽' },
      { label: 'Безопасность', value: 'Видеонаблюдение и Face ID' }
    ],
    imageUrl: '/images/parking.jpg'
  },
  {
    id: 'amenity-2',
    title: 'Закрытый приватный двор-парк',
    subtitle: '0.8 га благоустроенной территории без машин',
    description: 'Ландшафтный дизайн от ведущего бюро с геопластикой холмов, взрослыми кленами и соснами, зонами сенсорного сада и фонтаном с подсветкой.',
    category: 'courtyard',
    specs: [
      { label: 'Концепция', value: 'Двор без машин' },
      { label: 'Озеленение', value: '45 видов многолетников и деревьев' },
      { label: 'Детские зоны', value: 'Эко-площадки Richter Spielgeräte' },
      { label: 'Освещение', value: 'Многоуровневый вечерний светодизайн' }
    ],
    imageUrl: '/images/courtyard.jpg'
  },
  {
    id: 'amenity-3',
    title: 'Смотровые лаунж-террасы на кровле',
    subtitle: 'Эксклюзивное общественное пространство для резидентов',
    description: 'Панорамные виды на исторический центр Санкт-Петербурга, Обводный канал и закатное небо. Оборудованы шезлонгами, навесами от дождя и розетками.',
    category: 'terrace',
    specs: [
      { label: 'Локация', value: 'Кровли секций 2 и 3' },
      { label: 'Вид', value: '360° на город и набережную' },
      { label: 'Зонирование', value: 'Йога, релакс, барбекю-лаунж' },
      { label: 'Доступ', value: 'Только для жильцов' }
    ],
    imageUrl: '/images/hero_facade.jpg'
  },
  {
    id: 'amenity-4',
    title: 'Спортивный кластер и воркаут',
    subtitle: 'Современные тренажеры на открытом воздухе',
    description: 'Полноценная спортивная зона с травмобезопасным каучуковым покрытием, столами для настольного тенниса и зоной для растяжки.',
    category: 'sport',
    specs: [
      { label: 'Оснащение', value: 'Воркаут-комплекс Foreman' },
      { label: 'Покрытие', value: 'Бесшовный эко-каучук' },
      { label: 'Теннис', value: 'Всепогодные столы Cornilleau' },
      { label: 'Зона бега', value: 'Кольцевая беговая дорожка 450м' }
    ],
    imageUrl: '/images/planetarium_1.jpg'
  }
];

export const developerStats = {
  name: 'Sansata Group',
  founded: '2012 год',
  builtSqMeters: '1 450 000+ м²',
  happyFamilies: '18 500+',
  completedProjects: '24 жилых комплекса',
  inProgressProjects: '8 проектов в стадии строительства',
  rating: 'Высший рейтинг надежности ААА',
  awards: [
    'Urban Awards 2024 — Девелопер года в сегменте Бизнес-класс',
    'European Property Awards — Лучшая архитектура жилого комплекса',
    'Green Zoom Platinum — Экологический стандарт строительства',
    'Dprofile Awards 2024 — Лучший интерактивный цифровой опыт'
  ],
  description: 'Sansata Group — девелоперская компания, создающая знаковые архитектурные объекты с фокусом на эмоциональный комфорт резидентов, инновационные инженерные решения и безупречную эстетику.'
};
