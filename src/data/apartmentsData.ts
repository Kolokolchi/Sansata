import { Apartment, RoomType } from '../types';

// Helper to generate crisp, detailed SVG apartment layout plans
export function generatePlanSvg(rooms: number, area: number, variant: number): string {
  const wall = '%2318191b';
  const innerWall = '%23374151';
  const fillRoom = '%23f8f9fa';
  const fillBalcony = '%23fff7ed';
  const fillBath = '%23f0f9ff';
  const brand = '%23e35204';
  const textDark = '%231f2937';
  const textMuted = '%236b7280';
  const compassColor = '%239ca3af';

  if (rooms === 0) {
    // Studio Plan (24-30 m²)
    const living = (area - 8.3).toFixed(1);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="100%" height="100%">
      <rect width="420" height="420" fill="%23ffffff"/>
      <!-- Grid blueprint subtle dots -->
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="%23f3f4f6"/>
      </pattern>
      <rect width="420" height="420" fill="url(%23grid)"/>

      <!-- Compass -->
      <g transform="translate(380, 35)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="${compassColor}" stroke-width="1.5"/>
        <polygon points="0,-12 4,0 -4,0" fill="${brand}"/>
        <polygon points="0,12 4,0 -4,0" fill="${compassColor}"/>
        <text x="0" y="-16" font-family="sans-serif" font-size="10" font-weight="bold" fill="${brand}" text-anchor="middle">С</text>
      </g>

      <!-- Outer Shell -->
      <rect x="35" y="35" width="350" height="350" fill="none" stroke="${wall}" stroke-width="8" rx="2"/>

      <!-- Entryway / Hall -->
      <rect x="35" y="35" width="130" height="110" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="100" y="85" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Прихожая</text>
      <text x="100" y="105" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">4.2 м²</text>

      <!-- Bathroom -->
      <rect x="165" y="35" width="105" height="110" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="217" y="85" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">С/У</text>
      <text x="217" y="105" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">4.1 м²</text>

      <!-- Balcony / Loggia -->
      <rect x="270" y="35" width="115" height="110" fill="${fillBalcony}" stroke="${brand}" stroke-width="3" stroke-dasharray="4,4"/>
      <text x="327" y="85" font-family="sans-serif" font-size="12" font-weight="700" fill="${brand}" text-anchor="middle">Лоджия</text>
      <text x="327" y="105" font-family="sans-serif" font-size="11" fill="${brand}" text-anchor="middle">3.6 м²</text>

      <!-- Main Living + Kitchen -->
      <rect x="35" y="145" width="350" height="240" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      
      <!-- Kitchen Zone -->
      <rect x="50" y="160" width="140" height="30" fill="%23e5e7eb" stroke="%239ca3af" stroke-width="1.5"/>
      <text x="120" y="180" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">Кухонная зона</text>
      
      <!-- Center Title -->
      <text x="210" y="255" font-family="sans-serif" font-size="15" font-weight="800" fill="${brand}" text-anchor="middle">Кухня-гостиная</text>
      <text x="210" y="280" font-family="sans-serif" font-size="14" font-weight="700" fill="${textDark}" text-anchor="middle">${living} м²</text>

      <!-- Panoramic Window -->
      <rect x="90" y="380" width="240" height="8" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <text x="210" y="405" font-family="sans-serif" font-size="10" fill="${textMuted}" text-anchor="middle">Панорамное окно 2.4м</text>

      <!-- Entrance Door -->
      <path d="M 35 70 A 35 35 0 0 1 70 105" fill="none" stroke="${brand}" stroke-width="2"/>
      <line x1="35" y1="70" x2="35" y2="105" stroke="%23ffffff" stroke-width="8"/>
    </svg>`;
  } else if (rooms === 1) {
    // 1-room apartment plan (35-44 m²)
    const living = (area * 0.42).toFixed(1);
    const kitchen = (area * 0.35).toFixed(1);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="100%" height="100%">
      <rect width="420" height="420" fill="%23ffffff"/>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="%23f3f4f6"/>
      </pattern>
      <rect width="420" height="420" fill="url(%23grid)"/>

      <!-- Compass -->
      <g transform="translate(380, 35)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="${compassColor}" stroke-width="1.5"/>
        <polygon points="0,-12 4,0 -4,0" fill="${brand}"/>
        <polygon points="0,12 4,0 -4,0" fill="${compassColor}"/>
        <text x="0" y="-16" font-family="sans-serif" font-size="10" font-weight="bold" fill="${brand}" text-anchor="middle">С</text>
      </g>

      <!-- Outer Wall -->
      <rect x="30" y="30" width="360" height="360" fill="none" stroke="${wall}" stroke-width="8" rx="2"/>

      <!-- Bathroom -->
      <rect x="30" y="30" width="150" height="110" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="105" y="80" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">С/У</text>
      <text x="105" y="100" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">4.6 м²</text>

      <!-- Hallway -->
      <rect x="30" y="140" width="150" height="130" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="105" y="200" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Холл</text>
      <text x="105" y="220" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">5.4 м²</text>

      <!-- Balcony -->
      <rect x="30" y="270" width="150" height="120" fill="${fillBalcony}" stroke="${brand}" stroke-width="3" stroke-dasharray="4,4"/>
      <text x="105" y="325" font-family="sans-serif" font-size="12" font-weight="700" fill="${brand}" text-anchor="middle">Лоджия</text>
      <text x="105" y="345" font-family="sans-serif" font-size="11" fill="${brand}" text-anchor="middle">3.8 м²</text>

      <!-- Bedroom -->
      <rect x="180" y="30" width="210" height="180" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="285" y="115" font-family="sans-serif" font-size="14" font-weight="700" fill="${textDark}" text-anchor="middle">Спальня</text>
      <text x="285" y="138" font-family="sans-serif" font-size="13" font-weight="600" fill="${brand}" text-anchor="middle">${living} м²</text>

      <!-- Kitchen Living -->
      <rect x="180" y="210" width="210" height="180" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="285" y="290" font-family="sans-serif" font-size="14" font-weight="800" fill="${brand}" text-anchor="middle">Кухня-гостиная</text>
      <text x="285" y="315" font-family="sans-serif" font-size="13" font-weight="700" fill="${textDark}" text-anchor="middle">${kitchen} м²</text>

      <!-- Windows -->
      <rect x="385" y="70" width="8" height="100" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <rect x="385" y="250" width="8" height="100" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>

      <!-- Door -->
      <path d="M 30 180 A 35 35 0 0 1 65 215" fill="none" stroke="${brand}" stroke-width="2"/>
      <line x1="30" y1="180" x2="30" y2="215" stroke="%23ffffff" stroke-width="8"/>
    </svg>`;
  } else if (rooms === 2) {
    // 2-room Euro plan (52-68 m²)
    const living = (area * 0.38).toFixed(1);
    const bed1 = (area * 0.26).toFixed(1);
    const bed2 = (area * 0.20).toFixed(1);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="100%" height="100%">
      <rect width="420" height="420" fill="%23ffffff"/>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="%23f3f4f6"/>
      </pattern>
      <rect width="420" height="420" fill="url(%23grid)"/>

      <!-- Compass -->
      <g transform="translate(380, 35)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="${compassColor}" stroke-width="1.5"/>
        <polygon points="0,-12 4,0 -4,0" fill="${brand}"/>
        <polygon points="0,12 4,0 -4,0" fill="${compassColor}"/>
        <text x="0" y="-16" font-family="sans-serif" font-size="10" font-weight="bold" fill="${brand}" text-anchor="middle">С</text>
      </g>

      <!-- Outer Wall -->
      <rect x="25" y="25" width="370" height="370" fill="none" stroke="${wall}" stroke-width="8" rx="2"/>

      <!-- Master Bedroom -->
      <rect x="25" y="25" width="130" height="230" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="90" y="130" font-family="sans-serif" font-size="13" font-weight="700" fill="${textDark}" text-anchor="middle">Мастер-спальня</text>
      <text x="90" y="152" font-family="sans-serif" font-size="12" font-weight="600" fill="${brand}" text-anchor="middle">${bed1} м²</text>

      <!-- Bedroom 2 / Nursery -->
      <rect x="25" y="255" width="130" height="140" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="90" y="315" font-family="sans-serif" font-size="13" font-weight="700" fill="${textDark}" text-anchor="middle">Детская / Спальня</text>
      <text x="90" y="337" font-family="sans-serif" font-size="12" font-weight="600" fill="${brand}" text-anchor="middle">${bed2} м²</text>

      <!-- Middle corridor + bathrooms -->
      <rect x="155" y="25" width="120" height="120" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="215" y="80" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Мастер С/У</text>
      <text x="215" y="100" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">4.8 м²</text>

      <rect x="155" y="145" width="120" height="130" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="215" y="205" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Холл</text>
      <text x="215" y="225" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">7.2 м²</text>

      <rect x="155" y="275" width="120" height="120" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="215" y="330" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Гостевой С/У</text>
      <text x="215" y="350" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">3.2 м²</text>

      <!-- Big Kitchen Living -->
      <rect x="275" y="25" width="120" height="370" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="335" y="195" font-family="sans-serif" font-size="14" font-weight="800" fill="${brand}" text-anchor="middle">Кухня-гостиная</text>
      <text x="335" y="220" font-family="sans-serif" font-size="14" font-weight="700" fill="${textDark}" text-anchor="middle">${living} м²</text>

      <!-- Windows -->
      <rect x="20" y="80" width="8" height="110" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <rect x="20" y="290" width="8" height="70" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <rect x="390" y="90" width="8" height="240" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
    </svg>`;
  } else {
    // 3-room Euro plan (70-95 m²)
    const living = (area * 0.34).toFixed(1);
    const bed1 = (area * 0.22).toFixed(1);
    const bed2 = (area * 0.18).toFixed(1);
    const bed3 = (area * 0.14).toFixed(1);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="100%" height="100%">
      <rect width="420" height="420" fill="%23ffffff"/>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="%23f3f4f6"/>
      </pattern>
      <rect width="420" height="420" fill="url(%23grid)"/>

      <!-- Compass -->
      <g transform="translate(380, 35)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="${compassColor}" stroke-width="1.5"/>
        <polygon points="0,-12 4,0 -4,0" fill="${brand}"/>
        <polygon points="0,12 4,0 -4,0" fill="${compassColor}"/>
        <text x="0" y="-16" font-family="sans-serif" font-size="10" font-weight="bold" fill="${brand}" text-anchor="middle">С</text>
      </g>

      <!-- Outer Wall -->
      <rect x="20" y="20" width="380" height="380" fill="none" stroke="${wall}" stroke-width="8" rx="2"/>

      <!-- Room 1 Master -->
      <rect x="20" y="20" width="120" height="190" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="80" y="105" font-family="sans-serif" font-size="12" font-weight="700" fill="${textDark}" text-anchor="middle">Мастер-спальня</text>
      <text x="80" y="125" font-family="sans-serif" font-size="12" font-weight="600" fill="${brand}" text-anchor="middle">${bed1} м²</text>

      <!-- Room 2 -->
      <rect x="20" y="210" width="120" height="190" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="80" y="295" font-family="sans-serif" font-size="12" font-weight="700" fill="${textDark}" text-anchor="middle">Спальня 2</text>
      <text x="80" y="315" font-family="sans-serif" font-size="12" font-weight="600" fill="${brand}" text-anchor="middle">${bed2} м²</text>

      <!-- Room 3 / Cabinet -->
      <rect x="140" y="20" width="140" height="120" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="210" y="70" font-family="sans-serif" font-size="12" font-weight="700" fill="${textDark}" text-anchor="middle">Кабинет / Детская</text>
      <text x="210" y="90" font-family="sans-serif" font-size="12" font-weight="600" fill="${brand}" text-anchor="middle">${bed3} м²</text>

      <!-- Central Hall -->
      <rect x="140" y="140" width="140" height="130" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="210" y="200" font-family="sans-serif" font-size="12" font-weight="600" fill="${textDark}" text-anchor="middle">Холл-коридор</text>
      <text x="210" y="220" font-family="sans-serif" font-size="11" fill="${textMuted}" text-anchor="middle">9.8 м²</text>

      <!-- Bathrooms -->
      <rect x="140" y="270" width="70" height="130" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="175" y="330" font-family="sans-serif" font-size="11" font-weight="600" fill="${textDark}" text-anchor="middle">С/У 1</text>
      <text x="175" y="350" font-family="sans-serif" font-size="10" fill="${textMuted}" text-anchor="middle">4.5 м²</text>

      <rect x="210" y="270" width="70" height="130" fill="${fillBath}" stroke="${innerWall}" stroke-width="4"/>
      <text x="245" y="330" font-family="sans-serif" font-size="11" font-weight="600" fill="${textDark}" text-anchor="middle">С/У 2</text>
      <text x="245" y="350" font-family="sans-serif" font-size="10" fill="${textMuted}" text-anchor="middle">3.8 м²</text>

      <!-- Huge Kitchen Living -->
      <rect x="280" y="20" width="120" height="380" fill="${fillRoom}" stroke="${innerWall}" stroke-width="4"/>
      <text x="340" y="200" font-family="sans-serif" font-size="14" font-weight="800" fill="${brand}" text-anchor="middle">Кухня-гостиная</text>
      <text x="340" y="225" font-family="sans-serif" font-size="14" font-weight="700" fill="${textDark}" text-anchor="middle">${living} м²</text>

      <!-- Windows -->
      <rect x="15" y="60" width="8" height="100" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <rect x="15" y="250" width="8" height="100" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
      <rect x="395" y="60" width="8" height="300" fill="%2393c5fd" stroke="${brand}" stroke-width="2"/>
    </svg>`;
  }
}

// Generate the 382 apartments database for STAVNI Obvodny
export const apartments: Apartment[] = [];

const sectionsConfig = [
  { section: 1, floors: 9, flatsPerFloor: 8 },
  { section: 2, floors: 11, flatsPerFloor: 9 },
  { section: 3, floors: 11, flatsPerFloor: 10 },
  { section: 4, floors: 9, flatsPerFloor: 8 },
  { section: 5, floors: 8, flatsPerFloor: 7 },
];

let globalFlatNumber = 1;

sectionsConfig.forEach(({ section, floors, flatsPerFloor }) => {
  for (let floor = 2; floor <= floors; floor++) {
    for (let flatIndex = 1; flatIndex <= flatsPerFloor; flatIndex++) {
      if (globalFlatNumber > 382) break;
      
      const flatNum = globalFlatNumber;
      
      // Determine room distribution
      let rooms = 1;
      let roomType: RoomType = '1k';
      let roomTypeName = 'Однокомнатная';
      let area = 35.4;
      let livingArea = 14.2;
      let kitchenArea = 12.5;
      let basePricePerM = 360000 + (floor * 4500) + ((flatIndex % 3) * 3500);
      let tags: string[] = ['Кухня-гостиная', 'Закрытый балкон'];
      let windowView: 'courtyard' | 'street' | 'both' = (flatIndex % 2 === 0) ? 'courtyard' : 'street';
      let windowViewName = (windowView === 'courtyard') ? 'Вид во двор' : 'Вид на улицу';
      let bathroomsCount = 1;
      let balconyType: 'none' | 'balcony' | 'loggia' | 'terrace' = 'loggia';
      
      const pattern = flatIndex % 5;
      if (pattern === 1 || pattern === 4 && flatIndex % 2 === 0) {
        // Studio
        rooms = 0;
        roomType = 'studio';
        roomTypeName = 'Студия';
        area = parseFloat((22.4 + (flatIndex * 1.8) + (floor * 0.3)).toFixed(2));
        if (area > 31.5) area = 29.8;
        livingArea = parseFloat((area * 0.65).toFixed(1));
        kitchenArea = parseFloat((area * 0.22).toFixed(1));
        basePricePerM = 410000 + (floor * 3500);
        tags = ['Кухня-гостиная', windowViewName, 'Санузлов: 1', 'Лоджия'];
        bathroomsCount = 1;
      } else if (pattern === 2) {
        // 1-room
        rooms = 1;
        roomType = '1k';
        roomTypeName = 'Однокомнатная';
        area = parseFloat((34.5 + (flatIndex * 1.5) + (floor * 0.4)).toFixed(2));
        if (area > 44.0) area = 38.6;
        livingArea = parseFloat((area * 0.42).toFixed(1));
        kitchenArea = parseFloat((area * 0.35).toFixed(1));
        basePricePerM = 370000 + (floor * 3800);
        tags = ['Кухня-гостиная', windowViewName, 'Санузлов: 1', 'Закрытый балкон'];
        bathroomsCount = 1;
      } else if (pattern === 3) {
        // 2-room
        rooms = 2;
        roomType = '2k';
        roomTypeName = 'Двухкомнатная';
        area = parseFloat((52.0 + (flatIndex * 2.2) + (floor * 0.5)).toFixed(2));
        if (area > 68.0) area = 58.4;
        livingArea = parseFloat((area * 0.48).toFixed(1));
        kitchenArea = parseFloat((area * 0.28).toFixed(1));
        basePricePerM = 350000 + (floor * 4000);
        tags = ['Мастер-спальня', 'Кухня-гостиная', 'Санузлов: 2', windowViewName, 'Закрытый балкон'];
        bathroomsCount = 2;
      } else {
        // 3-room
        rooms = 3;
        roomType = '3k';
        roomTypeName = 'Трёхкомнатная';
        area = parseFloat((68.5 + (flatIndex * 2.5) + (floor * 0.6)).toFixed(2));
        if (area > 92.5) area = 79.2;
        livingArea = parseFloat((area * 0.52).toFixed(1));
        kitchenArea = parseFloat((area * 0.26).toFixed(1));
        basePricePerM = 340000 + (floor * 4200);
        windowView = 'both';
        windowViewName = 'Двусторонняя';
        tags = ['Мастер-спальня', 'Кухня-гостиная', 'Санузлов: 2', 'Вид во двор и на улицу', 'Терраса / Лоджия'];
        bathroomsCount = 2;
        balconyType = floor >= 8 ? 'terrace' : 'loggia';
      }
      
      const rawPrice = Math.round(area * basePricePerM);
      const discountPercent = flatNum % 7 === 0 ? 5 : flatNum % 13 === 0 ? 8 : 0;
      const price = discountPercent > 0 ? Math.round(rawPrice * (1 - discountPercent / 100)) : rawPrice;
      const pricePerMeter = Math.round(price / area);
      
      const planUrl = generatePlanSvg(rooms, area, flatIndex);
      
      apartments.push({
        id: `stavni-${flatNum}`,
        number: flatNum,
        rooms,
        roomType,
        roomTypeName,
        area,
        livingArea,
        kitchenArea,
        floor,
        totalFloors: floors,
        section,
        price,
        pricePerMeter,
        basePrice: rawPrice,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
        planUrl,
        tags,
        windowView,
        windowViewName,
        balconyType,
        bathroomsCount,
        ceilingHeight: 3.0,
        isPromo: discountPercent > 0,
        planoplanUid: '2ee1019ddb3e8f756ad9aa354403604c_3d',
        status: flatNum % 29 === 0 ? 'reserved' : 'available'
      });
      
      globalFlatNumber++;
    }
  }
});

export const sampleHighlightedFlats = [
  apartments.find(a => a.rooms === 0 && a.floor === 2) || apartments[0],
  apartments.find(a => a.rooms === 1 && a.floor === 2) || apartments[1],
  apartments.find(a => a.rooms === 2 && a.floor === 2) || apartments[2],
  apartments.find(a => a.rooms === 3 && a.floor === 3) || apartments[3],
];
