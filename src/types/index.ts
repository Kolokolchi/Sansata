/**
 * Типы данных проекта ЖК «Shattyq» (Sensata Group).
 */
import original from '../data/shattyq.json';

export type PlanData = typeof original.plans[number];

export type FlatStatus = 'unknown' | 'available' | 'reserved' | 'sold';
export type AreaKind = 'calculated' | 'official';

export interface Flat extends PlanData {
  section: number;
  floor: number;
  area: number | null;
  price: number | null;
  status: FlatStatus;
  areaKind: AreaKind;
  features: string[];
}

export interface PanoramaLink {
  target: string;
  yaw: number;
  pitch: number;
}

export interface Panorama {
  id: string;
  title: string;
  src: string;
  poster?: string;
  links?: PanoramaLink[];
}

export interface MediaAlbum {
  id: string;
  title: string;
  date: string;
  images: string[];
}

export interface ProjectDocument {
  id: string;
  title: string;
  url: string;
  category: string;
  date?: string;
}

export interface CameraStream {
  id: string;
  title: string;
  url: string;
}

export interface ExperienceConfig {
  selectionMedia?: {
    masterplan?: SelectionImage;
    facades?: Record<string, SelectionImage>;
    floorPlans?: Record<string, SelectionImage>;
  };
  apartmentTours?: Record<string, { modelUrl?: string; panoramas?: Panorama[] }>;
  version: number;
  model: {
    url: string | null;
    label: string;
    scale: number;
  };
  panoramas: Panorama[];
  constructionAlbums: MediaAlbum[];
  cameras: CameraStream[];
  documents: ProjectDocument[];
  inventory: Partial<Flat>[];
  leadEndpoint: string;
  source: string;
}

/** Coordinates use the original image's pixel dimensions; keys identify sections, floors or plan IDs. */
export interface SelectionImage {
  image: string;
  width: number;
  height: number;
  regions: { id: string; points: [number, number][] }[];
}

export interface MortgageCalculationResult {
  principal: number;
  payment: number;
  interest: number;
  total: number;
}

export interface LeadSubmission {
  name: string;
  phone: string;
  consent: boolean;
  topic: string;
  website?: string;
  requestId?: string;
}

export interface LeadReceipt {
  id: string;
  mode: 'local' | 'crm';
  message: string;
}

/**
 * Канонические публичные DTO-контракты (docs/architecture-contracts.md)
 */

export interface BuildingDto {
  id: string;
  name: string;
  sectionsCount: number;
  floorsCount: number;
  address?: string;
}

export interface SectionDto {
  id: string;
  buildingId: string;
  number: number;
  floorsCount: number;
  variantsCount: number;
}

export interface FloorRegionDto {
  id: string;
  apartmentNumber?: string;
  points: [number, number][];
  centroid?: [number, number];
}

export interface FloorDto {
  id: string;
  buildingId: string;
  sectionId: string;
  floorNumber: number;
  svgViewBox: string;
  planImageUrl: string;
  regions: FloorRegionDto[];
}

export type ApartmentStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export interface ApartmentDto {
  id: string;
  number?: string;
  rooms: number;
  section: number;
  floor: number;
  area: number;
  livingArea?: number;
  price: number | null;
  pricePerMeter?: number | null;
  status: ApartmentStatus;
  layoutUrl: string;
  features?: string[];
}

export interface ApartmentStatusResponseDto {
  updatedAt: string;
  statuses: Record<string, ApartmentStatus>;
}

export interface LeadSubmissionDto {
  name: string;
  phone: string;
  consent: boolean;
  topic?: string;
  requestId?: string;
  website?: string;
  apartmentId?: string;
}

export interface BookingSubmissionDto extends LeadSubmissionDto {
  apartmentId: string;
  date?: string;
  time?: string;
}

export type LeadRequestDto = LeadSubmissionDto;

export interface LeadResponseDto {
  success: boolean;
  id: string;
  mode: 'crm' | 'local';
  message: string;
}

