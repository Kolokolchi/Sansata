export type RoomType = 'studio' | '1k' | '2k' | '3k' | '4k';

export interface Apartment {
  id: string;
  number: number;
  rooms: number; // 0 for studio, 1, 2, 3, 4
  roomType: RoomType;
  roomTypeName: string; // 'Студия', '1-комнатная', etc.
  area: number; // Total area in m2
  livingArea: number;
  kitchenArea: number;
  floor: number;
  totalFloors: number;
  section: number; // 1 to 5
  price: number; // in Rubles
  pricePerMeter: number;
  basePrice: number; // without discount
  discountPercent?: number;
  planUrl: string; // 2D plan
  planFloorUrl?: string; // on floor plan
  planCompassUrl?: string; // compass orientation
  planoplanUid?: string; // 3D tour
  tags: string[]; // e.g. ['Кухня-гостиная', 'Вид во двор', 'Закрытый балкон', 'Мастер-спальня', '2 санузла']
  windowView: 'courtyard' | 'street' | 'both';
  windowViewName: string;
  balconyType: 'none' | 'balcony' | 'loggia' | 'terrace';
  bathroomsCount: number;
  ceilingHeight: number; // 3.0m
  isPromo?: boolean;
  status: 'available' | 'reserved' | 'sold';
}

export interface InfrastructureItem {
  id: string;
  name: string;
  category: 'metro' | 'restaurants' | 'shops' | 'parks' | 'schools' | 'sport' | 'sightseeing';
  categoryName: string;
  coords: [number, number]; // [lat, lon]
  walkTimeMinutes?: number;
  driveTimeMinutes?: number;
  description: string;
  address: string;
  image?: string;
}

export interface GallerySlide {
  id: string;
  title: string;
  subtitle?: string;
  caption: string;
  imageUrl: string;
  planoplanUid?: string;
  has3dTour?: boolean;
}

export interface ProgressAlbum {
  id: string;
  month: string;
  year: number;
  date: string;
  title: string;
  photosCount: number;
  coverUrl: string;
  description: string;
  photos: {
    url: string;
    caption: string;
  }[];
}

export interface DocumentItem {
  id: string;
  category: string;
  title: string;
  fileSize: string;
  fileFormat: string;
  date: string;
  author: string;
  downloadUrl: string;
}

export interface PromoOffer {
  id: string;
  badge: string;
  title: string;
  description: string;
  fullTerms: string;
  validUntil: string;
  discountValue?: string;
  imageUrl?: string;
  actionText: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  details: string[];
  imageUrl: string;
}

// Interactive Kiosk & Upside Case Models
export type AppMode = 'web' | 'kiosk';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export type KioskStep = 'start' | 'welcome' | 'hud' | 'farewell';
export type KioskSection = 
  | 'genplan' 
  | 'search' 
  | 'favorites' 
  | 'infrastructure' 
  | 'about-project' 
  | 'developer'
  | 'mop'
  | 'parking'
  | 'commercial'
  | 'other';

export type KioskPointType = 'building' | 'mop' | 'parking' | 'commercial' | 'other';

export interface ParkingSpot {
  id: string;
  number: number;
  level: -1 | -2;
  type: 'standard' | 'ev' | 'family' | 'moto';
  typeName: string;
  area: number;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  hasCharger?: boolean;
  x: number;
  y: number;
}

export interface CommercialSpace {
  id: string;
  number: number;
  name: string;
  area: number;
  floor: 1;
  section: number;
  price: number;
  pricePerMeter: number;
  purpose: string; // 'Кафе / Ресторан', 'Супермаркет', 'Аптека', 'Свободное назначение'
  ceilingHeight: number;
  powerKw: number;
  status: 'available' | 'reserved' | 'rented';
  entrance: 'street' | 'courtyard' | 'both';
  image: string;
  planUrl: string;
}

export interface MopSpace {
  id: string;
  title: string;
  category: 'lobby' | 'lounge' | 'elevators' | 'stroller' | 'concierge';
  categoryName: string;
  description: string;
  features: string[];
  imageUrl: string;
  panoramaUrl?: string;
  planoplanUid?: string;
}

export interface OtherAmenity {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'cellar' | 'courtyard' | 'terrace' | 'sport';
  specs: { label: string; value: string }[];
  imageUrl: string;
}
