import { InfrastructureItem } from '../types';

export const infrastructureCategories = [
  { id: 'metro', name: 'Метро' },
  { id: 'restaurants', name: 'Кафе/Рестораны' },
  { id: 'shops', name: 'Магазины' },
  { id: 'parks', name: 'Парки' },
  { id: 'schools', name: 'Школы/Сады' },
  { id: 'sightseeing', name: 'Достопримечательности' }
];

export const infrastructureItems: InfrastructureItem[] = [
  // Metro
  {
    id: 'metro-1',
    name: 'Станция метро «Балтийская»',
    category: 'metro',
    categoryName: 'Метро',
    coords: [59.907248, 30.299692],
    walkTimeMinutes: 10,
    description: 'Красная линия метро (Кировско-Выборгская). Прямая связь с центром и площадью Восстания.',
    address: 'пл. Балтийского Вокзала'
  },
  {
    id: 'metro-2',
    name: 'Станция метро «Фрунзенская»',
    category: 'metro',
    categoryName: 'Метро',
    coords: [59.906169, 30.317548],
    walkTimeMinutes: 14,
    description: 'Синяя линия метро (Московско-Петроградская). Удобный доступ к Невскому проспекту и аэропорту Пулково.',
    address: 'Московский проспект, 71'
  },
  
  // Restaurants & Cafes
  {
    id: 'rest-1',
    name: 'Фуд-молл Vokzal 1853',
    category: 'restaurants',
    categoryName: 'Кафе/Рестораны',
    coords: [59.907952, 30.307998],
    walkTimeMinutes: 5,
    description: 'Крупнейший фуд-молл Европы: более 90 ресторанных концепций, сцена, концерты и гастромаркет.',
    address: 'наб. Обводного канала, 118С'
  },
  {
    id: 'rest-2',
    name: 'Кофейня Baggins Coffee & Bakery',
    category: 'restaurants',
    categoryName: 'Кафе/Рестораны',
    coords: [59.908552, 30.305100],
    walkTimeMinutes: 3,
    description: 'Свежая выпечка, авторский кофе и завтраки целый день.',
    address: 'наб. Обводного канала, 118'
  },
  {
    id: 'rest-3',
    name: 'Ресторан «Балтийский Берег»',
    category: 'restaurants',
    categoryName: 'Кафе/Рестораны',
    coords: [59.906800, 30.298500],
    walkTimeMinutes: 9,
    description: 'Европейская и авторская кухня, винная карта, деловые ланчи.',
    address: 'наб. Обводного канала, 120'
  },

  // Shops & Mall
  {
    id: 'shop-1',
    name: 'ТРК «Варшавский Экспресс»',
    category: 'shops',
    categoryName: 'Магазины',
    coords: [59.907600, 30.308500],
    walkTimeMinutes: 6,
    description: 'Торгово-развлекательный комплекс, фитнес-центр SportLife, кинотеатр и бутики.',
    address: 'наб. Обводного канала, 118'
  },
  {
    id: 'shop-2',
    name: 'Супермаркет «Азбука Вкуса»',
    category: 'shops',
    categoryName: 'Магазины',
    coords: [59.909200, 30.312000],
    walkTimeMinutes: 8,
    description: 'Премиальный супермаркет готовой кулинарии и отборных продуктов 24/7.',
    address: 'Московский пр-т, 65'
  },
  {
    id: 'shop-3',
    name: 'Гипермаркет «Лента»',
    category: 'shops',
    categoryName: 'Магазины',
    coords: [59.905500, 30.302000],
    walkTimeMinutes: 11,
    description: 'Широкий ассортимент товаров для дома и продуктов.',
    address: 'наб. Обводного канала, 118/7'
  },

  // Parks
  {
    id: 'park-1',
    name: 'Парк Екатерингоф',
    category: 'parks',
    categoryName: 'Парки',
    coords: [59.901500, 30.268000],
    walkTimeMinutes: 20,
    driveTimeMinutes: 6,
    description: 'Исторический пейзажный парк с прудами, лодочной станцией, конным клубом и тенистыми аллеями.',
    address: 'Лифляндская ул., 12'
  },
  {
    id: 'park-2',
    name: 'Сквер на набережной Обводного канала',
    category: 'parks',
    categoryName: 'Парки',
    coords: [59.908200, 30.303500],
    walkTimeMinutes: 2,
    description: 'Благоустроенная пешеходная набережная с зонами отдыха и велосипедными дорожками.',
    address: 'наб. Обводного канала'
  },
  {
    id: 'park-3',
    name: 'Балтийский сад',
    category: 'parks',
    categoryName: 'Парки',
    coords: [59.908100, 30.297000],
    walkTimeMinutes: 9,
    description: 'Зеленый сквер у Балтийского вокзала с фонтаном и скамейками.',
    address: 'пл. Балтийского вокзала'
  },

  // Schools & Kindergartens
  {
    id: 'school-1',
    name: 'Гимназия № 272 Адмиралтейского района',
    category: 'schools',
    categoryName: 'Школы',
    coords: [59.909800, 30.301500],
    walkTimeMinutes: 10,
    description: 'Одно из лучших учебных заведений района с углубленным изучением иностранных языков.',
    address: '8-я Красноармейская ул., 3'
  },
  {
    id: 'school-2',
    name: 'Детский сад № 109 комбинированного вида',
    category: 'schools',
    categoryName: 'Школы',
    coords: [59.906900, 30.305000],
    walkTimeMinutes: 5,
    description: 'Современный детский сад с бассейном и развивающими студиями.',
    address: 'наб. Обводного канала, 116'
  },
  {
    id: 'school-3',
    name: 'Школа № 280 им. М.Ю. Лермонтова',
    category: 'schools',
    categoryName: 'Школы',
    coords: [59.911200, 30.308000],
    walkTimeMinutes: 12,
    description: 'Средняя общеобразовательная школа с профильными инженерными и гуманитарными классами.',
    address: 'Лермонтовский пр-т, 52'
  },

  // Sightseeing & Culture
  {
    id: 'sight-1',
    name: 'Планетарий № 1',
    category: 'sightseeing',
    categoryName: 'Достопримечательности',
    coords: [59.910500, 30.320500],
    walkTimeMinutes: 15,
    description: 'Крупнейший в мире купольный планетарий диаметром 37 метров в историческом газгольдере.',
    address: 'наб. Обводного канала, 74Ц'
  },
  {
    id: 'sight-2',
    name: 'Музей железных дорог России',
    category: 'sightseeing',
    categoryName: 'Достопримечательности',
    coords: [59.904800, 30.294500],
    walkTimeMinutes: 12,
    description: 'Один из крупнейших музеев железных дорог в мире с уникальной коллекцией паровозов и интерактивными экспозициями.',
    address: 'Библиотечный пер., 4к2'
  }
];
