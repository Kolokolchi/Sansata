import { ExperienceConfig, fallbackConfig } from './experience';

const isObject = (v: unknown): v is Record<string, any> =>
  Boolean(v && typeof v === 'object' && !Array.isArray(v));

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

const isValidUrl = (v: unknown): v is string =>
  isNonEmptyString(v) && (/^\/(?!\/)/.test(v) || /^https:\/\//.test(v));

const isPositiveNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Валидация и парсинг файла конфигурации дополнительных материалов (experience.json).
 * Отклоняет поврежденные конфигурации как единое целое, сохраняя каталог доступным.
 */
export function parseExperience(value: unknown): ExperienceConfig {
  if (!isObject(value) || value.version !== 1) {
    throw new Error('Unsupported experience configuration');
  }

  const config: Record<string, any> = { ...fallbackConfig, ...value };

  // Валидация 3D модели
  if (
    !isObject(config.model) ||
    !(config.model.url === null || isValidUrl(config.model.url)) ||
    !isNonEmptyString(config.model.label) ||
    !isPositiveNumber(config.model.scale)
  ) {
    throw new Error('Invalid model');
  }

  // Проверка массивов данных
  const arrayKeys = ['panoramas', 'constructionAlbums', 'cameras', 'documents', 'inventory'];
  for (const key of arrayKeys) {
    if (!Array.isArray(config[key])) {
      throw new Error(`Invalid ${key}`);
    }
  }

  // Валидация панорам 360°
  const validPanoramas = config.panoramas.every(
    (p: any) =>
      isObject(p) &&
      isNonEmptyString(p.id) &&
      isNonEmptyString(p.title) &&
      isValidUrl(p.src) &&
      (!p.poster || isValidUrl(p.poster)) &&
      (!p.links ||
        (Array.isArray(p.links) &&
          p.links.every(
            (l: any) =>
              isObject(l) &&
              isNonEmptyString(l.target) &&
              Number.isFinite(l.yaw) &&
              Number.isFinite(l.pitch) &&
              Math.abs(l.pitch) <= 90
          )))
  );

  if (!validPanoramas) {
    throw new Error('Invalid panorama');
  }

  const panoramaIds = config.panoramas.map((p: any) => p.id);
  const hasDuplicateIds = new Set(panoramaIds).size !== panoramaIds.length;
  const hasBrokenLinks = config.panoramas.some((p: any) =>
    p.links?.some((l: any) => !panoramaIds.includes(l.target))
  );

  if (hasDuplicateIds || hasBrokenLinks) {
    throw new Error('Invalid panorama links');
  }

  // Валидация фотоальбомов хода строительства
  const validAlbums = config.constructionAlbums.every(
    (a: any) =>
      isObject(a) &&
      isNonEmptyString(a.id) &&
      isNonEmptyString(a.title) &&
      isNonEmptyString(a.date) &&
      Array.isArray(a.images) &&
      a.images.length > 0 &&
      a.images.every(isValidUrl)
  );

  if (!validAlbums) {
    throw new Error('Invalid album');
  }

  // Валидация камер
  const validCameras = config.cameras.every(
    (c: any) =>
      isObject(c) &&
      isNonEmptyString(c.id) &&
      isNonEmptyString(c.title) &&
      isValidUrl(c.url)
  );

  if (!validCameras) {
    throw new Error('Invalid camera');
  }

  // Валидация документов
  const validDocuments = config.documents.every(
    (d: any) =>
      isObject(d) &&
      isNonEmptyString(d.id) &&
      isNonEmptyString(d.title) &&
      isNonEmptyString(d.category) &&
      isValidUrl(d.url)
  );

  if (!validDocuments) {
    throw new Error('Invalid document');
  }

  // Валидация и фильтрация полей инвентаря
  config.inventory = config.inventory.map((item: any) => {
    if (!isObject(item) || !isNonEmptyString(item.id)) {
      throw new Error('Invalid inventory id');
    }

    const sanitized: Record<string, unknown> = { id: item.id };

    for (const key of ['area', 'price']) {
      if (key in item) {
        if (item[key] !== null && !isPositiveNumber(item[key])) {
          throw new Error(`Invalid ${key}`);
        }
        sanitized[key] = item[key];
      }
    }

    if ('status' in item) {
      if (!['unknown', 'available', 'reserved', 'sold'].includes(item.status)) {
        throw new Error('Invalid status');
      }
      sanitized.status = item.status;
    }

    if ('areaKind' in item) {
      if (!['official', 'calculated'].includes(item.areaKind)) {
        throw new Error('Invalid areaKind');
      }
      sanitized.areaKind = item.areaKind;
    }

    return sanitized;
  });

  if (!isValidUrl(config.leadEndpoint) || !isValidUrl(config.source)) {
    throw new Error('Invalid endpoint');
  }

  if (config.apartmentTours !== undefined) {
    if (!isObject(config.apartmentTours)) throw new Error('Invalid apartment tours');
    for (const tour of Object.values(config.apartmentTours)) {
      if (!isObject(tour) || (tour.modelUrl !== undefined && !isValidUrl(tour.modelUrl))) throw new Error('Invalid apartment model');
      if (tour.panoramas !== undefined) {
        // Reuse panorama graph validation without inheriting nested apartment tours.
        parseExperience({...fallbackConfig, panoramas: tour.panoramas});
      }
    }
  }
  if (config.selectionMedia !== undefined) {
    const media = config.selectionMedia;
    if (!isObject(media)) throw new Error('Invalid selection media');
    const validateImage = (image: any) => {
      if (!isObject(image) || !isValidUrl(image.image) || !isPositiveNumber(image.width) || !isPositiveNumber(image.height) || !Array.isArray(image.regions)) throw new Error('Invalid selection image');
      const ids = new Set();
      for (const region of image.regions) {
        if (!isObject(region) || !isNonEmptyString(region.id) || ids.has(region.id) || !Array.isArray(region.points) || region.points.length < 3 || !region.points.every((p:any)=>Array.isArray(p) && p.length===2 && p.every(Number.isFinite) && p[0]>=0 && p[0]<=image.width && p[1]>=0 && p[1]<=image.height)) throw new Error('Invalid selection region');
        ids.add(region.id);
      }
    };
    if (media.masterplan !== undefined) validateImage(media.masterplan);
    for (const key of ['facades','floorPlans']) if (media[key] !== undefined) {
      if (!isObject(media[key])) throw new Error('Invalid selection collection');
      Object.values(media[key]).forEach(validateImage);
    }
  }

  return config as ExperienceConfig;
}
