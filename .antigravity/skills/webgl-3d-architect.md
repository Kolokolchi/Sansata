# WebGL / Three.js Performance Engineer

## Роль
Инженер по высокопроизводительной 3D-графике, оптимизации WebGL/Three.js сцен, рендерингу архитектурных моделей зданий, секций и планировок с 60+ FPS в браузере.

---

## Стек и ключевые зависимости
- **Three.js** (`three`)
- **GLTFLoader** (`three/examples/jsm/loaders/GLTFLoader.js`)
- **DRACOLoader** (`three/examples/jsm/loaders/DRACOLoader.js`)
- **OrbitControls** (`three/examples/jsm/controls/OrbitControls.js`)

---

## Архитектурные правила и стандарты

### 1. Оптимизация и загрузка 3D-моделей (DRACO / Meshopt)
- **Строгий запрет тяжелых сеток без сжатия**: Все модели зданий, секций и окружения обязаны поставляться в бинарном формате `.glb` со сжатием геометрии DRACO или Meshopt. Запрещено использовать несжатые `.obj` или сырые `.gltf` с текстовыми буферами.
- **Локальный декодер Draco**: Не использовать внешние CDN (Cloudflare, unpkg) для скачивания воркеров декодирования. Всегда указывать локальный путь к распакованным библиотекам:
  ```typescript
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

  const dracoLoader = new DRACOLoader();
  // Локальный путь к воркерам в public/assets/draco/
  dracoLoader.setDecoderPath('/assets/draco/gltf/');
  dracoLoader.setDecoderConfig({ type: 'js' }); // или 'wasm'

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  ```
- **Frustum Culling**: Убедиться, что на всех мешах флаг `frustumCulled = true` для отсечения невидимой геометрии вне пирамиды видимости камеры.

---

### 2. Управление ресурсами и Disposed-пайплайн
При переключении между фасадом здания, этажами или квартирами Three.js не очищает память GPU автоматически. Необходим строгий цикл освобождения ресурсов:

```typescript
/**
 * Рекурсивно очищает геометрию, материалы и связанные текстуры из GPU памяти
 */
export function disposeSceneObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      // 1. Очистка геометрии
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      // 2. Очистка материалов и текстур
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          // Очистка всех текстурных карт
          for (const key of Object.keys(mat)) {
            const value = (mat as any)[key];
            if (value && typeof value === 'object' && 'isTexture' in value) {
              value.dispose();
            }
          }
          mat.dispose();
        }
      }
    }
  });

  if (obj.parent) {
    obj.parent.remove(obj);
  }
}
```

---

### 3. Интерактивность и Raycasting с троттлингом
- **Запрет Raycasting на каждом пикселе `mousemove`**: Проверка лучевых пересечений ресурсоемка. Обязателен Throttling/Debouncing (не чаще 1 раза в 16–30 мс через `requestAnimationFrame`).
- **Упрощенные прокси-коллайдеры (Bounding Boxes / Convex Hulls)**:
  Для секций зданий или этажей создавать невидимые упрощенные боксы-коллайдеры с тегом `userData: { sectionId: 'A', interactive: true }`, а не проверять пересечение с миллионом треугольников оконных рам и фасадных панелей.
- **Пример реализации**:
  ```typescript
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isRaycastScheduled = false;

  export function handlePointerMove(
    event: MouseEvent,
    container: HTMLElement,
    camera: THREE.Camera,
    interactiveObjects: THREE.Object3D[],
    onHover: (hit: THREE.Intersection | null) => void
  ): void {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!isRaycastScheduled) {
      isRaycastScheduled = true;
      requestAnimationFrame(() => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects, false);
        onHover(intersects.length > 0 ? intersects[0] : null);
        isRaycastScheduled = false;
      });
    }
  }
  ```

---

### 4. Камера и OrbitControls: Защитные ограничения
Пользователь никогда не должен видеть модель «снизу из-под земли» или иметь возможность зазумиться внутрь стены:

```typescript
export function setupOrbitControls(camera: THREE.Camera, domElement: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  
  // Плавная инерция
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Ограничение углов по вертикали (не падать под землю и не скручивать зенит)
  controls.minPolarAngle = Math.PI * 0.1; // ~18 градусов (вид сверху)
  controls.maxPolarAngle = Math.PI * 0.48; // ~86 градусов (чуть выше горизонта земли)

  // Ограничения дистанции приближения/отдаления
  controls.minDistance = 15;  // минимальный отступ от фасада
  controls.maxDistance = 300; // максимальный охват квартала

  // Отключение сдвига правой кнопкой (pan), если модель зафиксирована по центру
  controls.screenSpacePanning = false;

  return controls;
}
```

---

### 5. Освещение, PBR и PMREM-окружение
- **Тонокомпенсация (Tone Mapping)**:
  `renderer.toneMapping = THREE.ACESFilmicToneMapping;`
  `renderer.toneMappingExposure = 1.0;`
  `renderer.outputColorSpace = THREE.SRGBColorSpace;`
- **HDR Окружение через PMREMGenerator**:
  Использовать легковесные сжатые HDR/EXR карты (или низкополигональный префильтрованный Cubemap) для отражений на окнах и металле фасадов без просадки FPS.
- **Тени**: Ограничивать размеры карты теней (`shadowMap.mapSize.set(1024, 1024)`) и использовать `shadow.bias = -0.0001` для устранения теневого муара на стенах (shadow acne).
