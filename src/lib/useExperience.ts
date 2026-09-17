import { useEffect, useState } from 'react';
import { siteUrl } from './site';
import { ExperienceConfig, fallbackConfig, flats, Flat } from './experience';
import { parseExperience } from './config';

interface UseExperienceReturn {
  config: ExperienceConfig;
  inventory: Flat[];
  warning: string;
}

export function useExperience(): UseExperienceReturn {
  const [config, setConfig] = useState<ExperienceConfig>(fallbackConfig);
  const [warning, setWarning] = useState<string>('');

  useEffect(() => {
    const controller = new AbortController();

    fetch(siteUrl('/experience.json'), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load experience config');
        return res.json();
      })
      .then((json) => {
        setConfig(parseExperience(json));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setWarning('Дополнительные материалы временно недоступны. Основной каталог работает.');
        }
      });

    return () => controller.abort();
  }, []);

  const inventory = flats.map((flat) => {
    const patch = config.inventory.find((item) => item.id === flat.id);
    return patch ? { ...flat, ...patch } : flat;
  }) as Flat[];

  return { config, inventory, warning };
}
