import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  RotateCcw,
  Maximize,
  Plus,
  Minus,
  Navigation,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  ArrowUpRight,
  Building2,
  Home
} from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';
import { ExperienceConfig, LumaTourScene, flats } from '../lib/experience';
import { PanoramaViewer } from './PanoramaViewer';
import { VisualTourViewer } from './VisualTourViewer';
import '../styles/luma-tour.css';
import {
  createTravertineTexture,
  createPerforatedLatticeTexture,
  createWindowGlassTexture,
  createPaverTexture,
  createPlaygroundTexture,
  createSkyEnvironment
} from '../lib/modelGenerator';

interface SceneProps {
  config: ExperienceConfig;
  section: number;
  floor: number;
  onSelect?: (section: number, floor: number) => void;
  interior?: boolean;
}

export function SceneViewer({ config, section, floor, onSelect, interior = false }: SceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    scene: THREE.Scene;
    sunLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    nightLightsGroup: THREE.Group;
    renderer: THREE.WebGLRenderer;
    setMode: (mode: 'day' | 'golden' | 'night') => void;
    flyTo: (pos: [number, number, number], target: [number, number, number]) => void;
  } | null>(null);

  const selectionRef = useRef({ section, floor });
  selectionRef.current = { section, floor };

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeMode, setTimeMode] = useState<'day' | 'golden' | 'night'>('day');
  const [activeSpot, setActiveSpot] = useState('Главный фасад');
  const [hoveredFloor, setHoveredFloor] = useState<{ section: number; floor: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    setError('');

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setError('3D недоступно в этом браузере. Выберите секцию и этаж кнопками ниже.');
      return;
    }

    let isDisposed = false;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.2, 600);
    camera.position.set(62, 38, 56);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 10, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 160;
    controls.maxPolarAngle = Math.PI * 0.48;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    renderer.domElement.setAttribute(
      'aria-label',
      'Интерактивная фотореалистичная 3D-модель ЖК Shattyq: вращайте мышью или пальцем'
    );
    renderer.domElement.setAttribute('role', 'img');

    // Lighting Pipeline
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x8a8475, 1.8);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.8);
    sunLight.position.set(45, 70, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.00015;
    sunLight.shadow.normalBias = 0.02;
    Object.assign(sunLight.shadow.camera, {
      left: -65,
      right: 65,
      top: 65,
      bottom: -65,
      near: 10,
      far: 180
    });
    scene.add(sunLight);

    // Group for Night Architectural Lights
    const nightLightsGroup = new THREE.Group();
    nightLightsGroup.visible = false;
    scene.add(nightLightsGroup);

    const addWarmSpot = (x: number, y: number, z: number, intensity = 45, distance = 14) => {
      const pl = new THREE.PointLight(0xffcc77, intensity, distance, 1.5);
      pl.position.set(x, y, z);
      nightLightsGroup.add(pl);
    };

    addWarmSpot(-18.5, 4.0, 20, 50, 16);
    addWarmSpot(18.5, 4.0, 20, 50, 16);
    addWarmSpot(-14, 3.8, 20, 35, 12);
    addWarmSpot(0, 3.8, 20, 35, 12);
    addWarmSpot(14, 3.8, 20, 35, 12);
    addWarmSpot(0, 7.5, 3, 40, 18);
    addWarmSpot(-11, 7.5, 6, 30, 14);
    addWarmSpot(11, 7.5, 6, 30, 14);

    // Procedural PBR Textures
    const travertineTex = createTravertineTexture();
    const perforatedTex = createPerforatedLatticeTexture();
    const paverTex = createPaverTexture();
    const playgroundTex = createPlaygroundTexture();
    const windowDayTex = createWindowGlassTexture(false);
    const windowLitTex = createWindowGlassTexture(true);

    const windowMeshes: { mesh: THREE.Mesh; lit: boolean }[] = [];

    let currentBgTex: THREE.Texture | null = null;
    let currentEnvMap: THREE.Texture | null = null;
    let currentRenderTarget: THREE.WebGLRenderTarget | null = null;

    const updateTimeMode = (mode: 'day' | 'golden' | 'night') => {
      if (currentBgTex) currentBgTex.dispose();
      if (currentEnvMap) currentEnvMap.dispose();
      if (currentRenderTarget) currentRenderTarget.dispose();

      const { envMap, bgTexture, renderTarget } = createSkyEnvironment(renderer, mode);
      currentEnvMap = envMap;
      currentBgTex = bgTexture;
      currentRenderTarget = renderTarget;
      scene.environment = envMap;
      scene.background = bgTexture;

      if (mode === 'night') {
        scene.fog = new THREE.FogExp2('#0f172a', 0.005);
        hemiLight.color.set('#3a4b6b');
        hemiLight.groundColor.set('#161e2e');
        hemiLight.intensity = 0.55;
        sunLight.intensity = 0.35;
        sunLight.color.set('#6a82a8');
        sunLight.position.set(-20, 40, -20);
        nightLightsGroup.visible = true;
        renderer.toneMappingExposure = 1.35;

        windowMeshes.forEach(({ mesh, lit }) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            if (lit) {
              mesh.material.map = windowLitTex;
              mesh.material.emissive.set(0xffb84d);
              mesh.material.emissiveIntensity = 0.95;
            } else {
              mesh.material.map = windowDayTex;
              mesh.material.emissive.set(0x000000);
              mesh.material.emissiveIntensity = 0;
            }
          }
        });
      } else if (mode === 'golden') {
        scene.fog = new THREE.FogExp2('#c27546', 0.0035);
        hemiLight.color.set('#ffeedd');
        hemiLight.groundColor.set('#956242');
        hemiLight.intensity = 1.4;
        sunLight.intensity = 2.7;
        sunLight.color.set('#ff9f45');
        sunLight.position.set(65, 30, 45);
        nightLightsGroup.visible = true;
        renderer.toneMappingExposure = 1.2;

        windowMeshes.forEach(({ mesh, lit }) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            if (lit) {
              mesh.material.map = windowLitTex;
              mesh.material.emissive.set(0xff9933);
              mesh.material.emissiveIntensity = 0.5;
            } else {
              mesh.material.map = windowDayTex;
              mesh.material.emissive.set(0x000000);
              mesh.material.emissiveIntensity = 0;
            }
          }
        });
      } else {
        scene.fog = new THREE.FogExp2('#d6e5f5', 0.0025);
        hemiLight.color.set('#ffffff');
        hemiLight.groundColor.set('#8a8475');
        hemiLight.intensity = 1.8;
        sunLight.intensity = 2.9;
        sunLight.color.set('#fff6e6');
        sunLight.position.set(45, 70, 40);
        nightLightsGroup.visible = false;
        renderer.toneMappingExposure = 1.12;

        windowMeshes.forEach(({ mesh }) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.map = windowDayTex;
            mesh.material.emissive.set(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        });
      }
    };

    updateTimeMode('day');

    let cameraAnim: {
      fromPos: THREE.Vector3;
      toPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
      progress: number;
    } | null = null;

    const flyTo = (pos: [number, number, number], target: [number, number, number]) => {
      cameraAnim = {
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(...pos),
        fromTarget: controls.target.clone(),
        toTarget: new THREE.Vector3(...target),
        progress: 0
      };
    };

    apiRef.current = {
      camera,
      controls,
      scene,
      sunLight,
      hemiLight,
      nightLightsGroup,
      renderer,
      setMode: (m) => {
        updateTimeMode(m);
        setTimeMode(m);
      },
      flyTo
    };

    const pickableFloors: THREE.Mesh[] = [];
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const enhanceModelHierarchy = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;

          const name = obj.name.toLowerCase();

          const hit = /section[_ -]?(\d+).*floor[_ -]?(\d+)/i.exec(obj.name);
          if (hit) {
            obj.userData = { section: Number(hit[1]), floor: Number(hit[2]) };
            pickableFloors.push(obj);
          }

          if (name.includes('travertine') || name.includes('slab') || name.includes('podium')) {
            obj.material = new THREE.MeshStandardMaterial({
              color: 0xf5efe4,
              map: travertineTex,
              roughness: 0.68,
              metalness: 0.04
            });
          } else if (name.includes('lattice') || name.includes('perforated')) {
            obj.material = new THREE.MeshStandardMaterial({
              color: 0xbaa07c,
              map: perforatedTex,
              roughness: 0.38,
              metalness: 0.55
            });
          } else if (name.includes('paver') || name.includes('sidewalk') || name.includes('boulevard')) {
            obj.material = new THREE.MeshStandardMaterial({
              color: 0xd8d4cb,
              map: paverTex,
              roughness: 0.85,
              metalness: 0.02
            });
          } else if (name.includes('epdm') || name.includes('playground')) {
            obj.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              map: playgroundTex,
              roughness: 0.9,
              metalness: 0.0
            });
          } else if (name.includes('win_') || name.includes('glass')) {
            const isLit = Boolean(obj.userData.lit);
            obj.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              map: isLit ? windowLitTex : windowDayTex,
              roughness: 0.12,
              metalness: 0.8,
              envMapIntensity: 1.5
            });
            windowMeshes.push({ mesh: obj, lit: isLit });
          }
        }
      });
    };

    const modelUrl = config.model.url || '/models/shattyq_complex.glb';

    const disposeHierarchy = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
              if (!mat) continue;
              for (const key of Object.keys(mat)) {
                const val = (mat as any)[key];
                if (val && val instanceof THREE.Texture) {
                  val.dispose();
                }
              }
              mat.dispose();
            }
          }
        }
      });
    };

    if (!interior) {
      setLoading(true);
      new GLTFLoader().load(
        siteUrl(modelUrl),
        (gltf) => {
          if (isDisposed) {
            disposeHierarchy(gltf.scene);
            return;
          }
          modelGroup.visible = false;
          scene.remove(modelGroup);

          const root = gltf.scene;
          root.scale.setScalar(config.model.scale || 1);

          const bounds = new THREE.Box3().setFromObject(root);
          const center = bounds.getCenter(new THREE.Vector3());
          root.position.x -= center.x;
          root.position.z -= center.z;

          enhanceModelHierarchy(root);
          scene.add(root);
          setLoading(false);
        },
        undefined,
        () => {
          if (!isDisposed) {
            setLoading(false);
            setError('Модель загружается. Показан предварительный вид.');
          }
        }
      );
    }

    const raycaster = new THREE.Raycaster();
    let downCoord = [0, 0];
    let pointerMoveRaf: number | null = null;
    let pendingPointer: { clientX: number; clientY: number } | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      downCoord = [e.clientX, e.clientY];
    };

    const handlePointerMove = (e: PointerEvent) => {
      pendingPointer = { clientX: e.clientX, clientY: e.clientY };
      if (pointerMoveRaf !== null) return;

      pointerMoveRaf = requestAnimationFrame(() => {
        pointerMoveRaf = null;
        if (isDisposed || !pendingPointer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const x = pendingPointer.clientX - rect.left;
        const y = pendingPointer.clientY - rect.top;

        if (tooltipRef.current) {
          tooltipRef.current.style.transform = `translate(${x + 12}px, ${y - 40}px)`;
        }

        const mouse = new THREE.Vector2(
          (x / rect.width) * 2 - 1,
          -((y / rect.height) * 2 - 1)
        );
        raycaster.setFromCamera(mouse, camera);

        // Raycast ONLY pickableFloors (18 meshes) to eliminate pointermove bottleneck
        const intersects = raycaster.intersectObjects(pickableFloors, false);
        const hit = intersects.find((h) => h.object.userData?.section);

        if (hit && hit.object.userData?.section) {
          const nextSection = hit.object.userData.section;
          const nextFloor = hit.object.userData.floor;
          setHoveredFloor((prev) => {
            if (prev?.section === nextSection && prev?.floor === nextFloor) {
              return prev;
            }
            return { section: nextSection, floor: nextFloor };
          });
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredFloor((prev) => (prev === null ? prev : null));
          renderer.domElement.style.cursor = 'grab';
        }
      });
    };

    const handlePointerLeave = () => {
      if (pointerMoveRaf !== null) {
        cancelAnimationFrame(pointerMoveRaf);
        pointerMoveRaf = null;
      }
      pendingPointer = null;
      setHoveredFloor((prev) => (prev === null ? prev : null));
      renderer.domElement.style.cursor = 'grab';
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downCoord[0], e.clientY - downCoord[1]) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      );
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(pickableFloors, false);
      const hit = intersects.find((h) => h.object.userData?.section);
      if (hit) {
        onSelectRef.current?.(hit.object.userData.section, hit.object.userData.floor);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    renderer.setAnimationLoop(() => {
      if (isDisposed) return;

      if (cameraAnim) {
        cameraAnim.progress += 0.035;
        const t = Math.min(1, cameraAnim.progress);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        camera.position.lerpVectors(cameraAnim.fromPos, cameraAnim.toPos, ease);
        controls.target.lerpVectors(cameraAnim.fromTarget, cameraAnim.toTarget, ease);
        controls.update();

        if (t >= 1) {
          cameraAnim = null;
        }
      }

      pickableFloors.forEach((mesh) => {
        const isChosen =
          mesh.userData.section === selectionRef.current.section &&
          mesh.userData.floor === selectionRef.current.floor;
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          if (isChosen) {
            mesh.material.emissive.set(0x283870);
            mesh.material.emissiveIntensity = 0.8;
          } else {
            mesh.material.emissive.set(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      isDisposed = true;
      if (pointerMoveRaf !== null) {
        cancelAnimationFrame(pointerMoveRaf);
        pointerMoveRaf = null;
      }
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      controls.dispose();

      disposeHierarchy(scene);
      disposeHierarchy(modelGroup);

      if (currentBgTex) currentBgTex.dispose();
      if (currentEnvMap) currentEnvMap.dispose();
      if (currentRenderTarget) currentRenderTarget.dispose();
      travertineTex.dispose();
      perforatedTex.dispose();
      paverTex.dispose();
      playgroundTex.dispose();
      windowDayTex.dispose();
      windowLitTex.dispose();

      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      apiRef.current = null;
    };
  }, [config.model.url, config.model.scale, interior]);

  const setViewPreset = useCallback((label: string, pos: [number, number, number], target: [number, number, number]) => {
    const api = apiRef.current;
    if (!api) return;
    api.flyTo(pos, target);
    setActiveSpot(label);
  }, []);

  const setLighting = (mode: 'day' | 'golden' | 'night') => {
    apiRef.current?.setMode(mode);
    setTimeMode(mode);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapRef.current?.requestFullscreen().catch(() => {
        setError('Полноэкранный режим недоступен в этом браузере.');
      });
    }
  };

  const presets: [string, [number, number, number], [number, number, number]][] = interior
    ? [
        ['Общий вид', [15, 13, 18], [0, 0, 0]],
        ['Гостиная', [-3, 1.65, 4], [-3, 1.65, -3]],
        ['Спальня', [4, 1.65, 0], [4, 1.65, -4]]
      ]
    : [
        ['Главный фасад', [62, 38, 56], [0, 10, 0]],
        ['Двор и детская площадка', [0, 24, 26], [0, 8, 0]],
        ['Вход & Кафе', [-18.5, 4.5, 32], [-17, 3, 14]],
        ['Архитектура фасада', [-28, 20, 18], [-18.5, 16, -4]],
        ['Вид сверху (Генплан)', [0, 85, 1], [0, 0, 0]]
      ];

  return (
    <div className="scene-wrap" ref={wrapRef}>
      <div className="scene-canvas" ref={hostRef} />

      <div className="scene-label">
        <span className="live-dot" />
        {config.model.url && !error && !interior
          ? 'ЖК Shattyq · Фотореалистичная 3D-модель'
          : interior
          ? 'Демо-интерьер · 3D-пространство'
          : 'ЖК Shattyq · 3D-модель комплекса'}
      </div>

      {hoveredFloor && (
        <div
          ref={tooltipRef}
          className="scene-floor-tooltip"
          style={{ pointerEvents: 'none' }}
        >
          <div className="tooltip-title">
            Секция {hoveredFloor.section} · Этаж {hoveredFloor.floor}
          </div>
          <div className="tooltip-sub">Нажмите для выбора квартир</div>
        </div>
      )}

      <div className="scene-tools">
        <button
          className={`icon ${timeMode === 'day' ? 'active-mode' : ''}`}
          aria-label="Дневной свет"
          title="Дневной свет"
          onClick={() => setLighting('day')}
        >
          <Sun size={18} />
        </button>

        <button
          className={`icon ${timeMode === 'golden' ? 'active-mode' : ''}`}
          aria-label="Золотой час (закат)"
          title="Золотой час (закат)"
          onClick={() => setLighting('golden')}
        >
          <Sunset size={18} />
        </button>

        <button
          className={`icon ${timeMode === 'night' ? 'active-mode' : ''}`}
          aria-label="Ночная иллюминация"
          title="Ночная иллюминация"
          onClick={() => setLighting('night')}
        >
          <Moon size={18} />
        </button>

        <div className="tool-divider" />

        <button
          className="icon"
          aria-label="Приблизить 3D"
          title="Приблизить"
          onClick={() => {
            const api = apiRef.current;
            if (api) {
              api.camera.position.lerp(api.controls.target, 0.2);
              api.controls.update();
            }
          }}
        >
          <Plus size={18} />
        </button>

        <button
          className="icon"
          aria-label="Отдалить 3D"
          title="Отдалить"
          onClick={() => {
            const api = apiRef.current;
            if (api) {
              api.camera.position
                .sub(api.controls.target)
                .multiplyScalar(1.2)
                .add(api.controls.target);
              api.controls.update();
            }
          }}
        >
          <Minus size={18} />
        </button>

        <button
          className="icon"
          aria-label="Сбросить ракурс"
          title="Сбросить ракурс"
          onClick={() =>
            setViewPreset(
              'Главный фасад',
              interior ? [15, 13, 18] : [62, 38, 56],
              interior ? [0, 0, 0] : [0, 10, 0]
            )
          }
        >
          <RotateCcw size={18} />
        </button>

        <button className="icon" aria-label="На весь экран" title="Полноэкранный режим" onClick={toggleFullscreen}>
          <Maximize size={18} />
        </button>
      </div>

      <div className="scene-presets">
        {presets.map(([title, pos, tgt]) => (
          <button
            key={title}
            className={activeSpot === title ? 'active' : ''}
            onClick={() => setViewPreset(title, pos, tgt)}
          >
            <Navigation size={13} />
            {title}
          </button>
        ))}
      </div>

      {loading && (
        <div className="scene-notice" role="status">
          <Sparkles className="spin-slow" size={16} /> Загрузка реалистичной 3D-модели…
        </div>
      )}
      {error && (
        <div className="scene-notice" role="status">
          {error}
        </div>
      )}
      <span className="scene-hint">
        Вращайте мышью или пальцем · Нажимайте на этажи здания для выбора квартир
      </span>
    </div>
  );
}

export interface TourPageProps {
  config: ExperienceConfig;
  onConsult?: (topic: string) => void;
}

export function TourPage({ config, onConsult }: TourPageProps) {
  const [mode, setMode] = useState<'complex' | 'panorama'>('panorama');

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ВИРТУАЛЬНЫЙ 3D-ТУР</span>
        <h1>
          Архитектура и пространство.
          <br />
          Почувствуйте атмосферу комплекса.
        </h1>
        <p>
          Интерактивный 3D-план жилого комплекса Shattyq (Sensata Group) с реалистичными ракурсами комплекса,
          интерактивным выбором секций, фильтрацией по комнатам и сферическим 360°-туром.
        </p>
      </div>

      {config.panoramas.length > 0 && (
        <div className="tabs feature-tabs" role="tablist" aria-label="Вкладки 3D-тура">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'complex'}
            className={mode === 'complex' ? 'active' : ''}
            onClick={() => setMode('complex')}
          >
            Интерактивный 3D-план (Ракурсы комплекса)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'panorama'}
            className={mode === 'panorama' ? 'active' : ''}
            onClick={() => setMode('panorama')}
          >
            Панорамы 360°
          </button>
        </div>
      )}

      {mode === 'panorama' && config.panoramas.length > 0 ? (
        <PanoramaViewer panoramas={config.panoramas} />
      ) : (
        <VisualTourViewer flats={flats} config={config} onConsult={onConsult} />
      )}

      <div className="feature-bottom">
        <p>
          Выберите понравившуюся планировку в каталоге или исследуйте расположение секций прямо на 3D-модели.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onConsult && (
            <button
              type="button"
              className="button outline"
              onClick={() => onConsult('Консультация по Shattyq')}
            >
              Заказать консультацию
            </button>
          )}
          <a
            className="button blue"
            href={siteUrl('/visual')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/visual');
            }}
          >
            Выбрать квартиру на 3D-плане <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_LUMA_SCENES: LumaTourScene[] = [
  {
    id: 'exterior',
    label: 'Экстерьер',
    captureId: '4f362242-ad43-4851-9b04-88adf71f24f5',
    title: 'Corsewall Lighthouse Hotel',
    note: 'Демонстрационная сцена стороннего автора @LiftPlanner. Это не съёмка ЖК Shattyq.'
  },
  {
    id: 'interior',
    label: 'Интерьер',
    captureId: 'b271fff7-37dd-47b1-8921-6375cd069c91',
    title: 'Grand Central Terminal',
    note: 'Демонстрационная сцена интерьера стороннего автора @FrancLucent. Это не съёмка ЖК Shattyq.'
  }
];

export interface CloudTourPageProps {
  config: ExperienceConfig;
  onConsult?: (topic: string) => void;
}

export function CloudTourPage({ config, onConsult }: CloudTourPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const scenes: LumaTourScene[] =
    config.lumaScenes && config.lumaScenes.length > 0
      ? config.lumaScenes
      : config.lumaTour
      ? [
          {
            id: 'exterior',
            label: 'Экстерьер',
            captureId: config.lumaTour.captureId,
            title: config.lumaTour.title,
            note: config.lumaTour.note
          },
          DEFAULT_LUMA_SCENES[1]
        ]
      : DEFAULT_LUMA_SCENES;

  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      if (scenes.some((s) => s.id === hash)) {
        return hash;
      }
    }
    return scenes[0]?.id || 'exterior';
  });

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0] || DEFAULT_LUMA_SCENES[0];
  const lumaCaptureId = activeScene.captureId;
  const lumaTitle = activeScene.title;
  const lumaNote = activeScene.note;
  const lumaUrl = `https://lumalabs.ai/capture/${lumaCaptureId}`;

  const handleSelectScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#${sceneId}`);
    }
  };

  const toggleFrameFullscreen = () => {
    if (!frameRef.current) return;
    if (!document.fullscreenElement) {
      frameRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="experience-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / ОБЛАЧНЫЙ 3D-ТУР</span>
        <h1>Облачный 3D-тур</h1>
        <p>
          Интерактивная 3D-съёмка высокого разрешения с фотореалистичным рендерингом Luma Labs (3D Gaussian Splatting).
          Исследуйте объёмное пространство со свободным вращением, плавным перемещением камеры и детальным обзором прямо в браузере.
        </p>
      </div>

      <div className="tabs feature-tabs" role="tablist" aria-label="Выбор 3D-сцены">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            role="tab"
            aria-selected={activeScene.id === scene.id}
            className={activeScene.id === scene.id ? 'active' : ''}
            onClick={() => handleSelectScene(scene.id)}
          >
            {scene.id === 'interior' ? <Home size={16} /> : <Building2 size={16} />}
            <span>{scene.label}</span>
          </button>
        ))}
      </div>

      <div className="luma-tour">
        <div className="luma-tour-frame" ref={frameRef}>
          <div className="luma-frame-scene-bar" role="group" aria-label="Быстрое переключение сцены">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                className={`luma-frame-scene-btn ${activeScene.id === scene.id ? 'active' : ''}`}
                onClick={() => handleSelectScene(scene.id)}
                aria-pressed={activeScene.id === scene.id}
                title={`Переключить на ${scene.label}`}
              >
                {scene.id === 'interior' ? <Home size={13} /> : <Building2 size={13} />}
                <span>{scene.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="luma-fullscreen-btn"
            onClick={toggleFrameFullscreen}
            title="Развернуть на весь экран"
            aria-label="Развернуть на весь экран"
          >
            <Maximize size={14} />
            <span>Во весь экран</span>
          </button>
          <iframe
            key={lumaCaptureId}
            src={`https://lumalabs.ai/embed/${lumaCaptureId}?mode=sparkles&showTitle=false&showMenu=false`}
            title={`Интерактивный 3D-тур Luma: ${lumaTitle}`}
            allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        <div className="luma-tour-hints">
          <div className="luma-hint-item">
            <span className="luma-hint-icon">🖱️</span>
            <span><strong>Вращение</strong> · Зажмите ЛКМ или проведите одним пальцем</span>
          </div>
          <div className="luma-hint-item">
            <span className="luma-hint-icon">✋</span>
            <span><strong>Панорамирование</strong> · Зажмите ПКМ или проведите двумя пальцами</span>
          </div>
          <div className="luma-hint-item">
            <span className="luma-hint-icon">🔍</span>
            <span><strong>Масштабирование</strong> · Колёсико мыши или щипок пальцами</span>
          </div>
        </div>

        <div className="luma-tour-caption">
          <p><strong>{lumaTitle}</strong> · {lumaNote}</p>
          <a href={lumaUrl} target="_blank" rel="noopener noreferrer">
            Открыть оригинал на Luma Labs <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      <div className="feature-bottom">
        <p>
          Облачный просмотрщик демонстрирует объёмные возможности формата фотограмметрии и нейросетевых 3D-сцен. Для выбора планировки Shattyq откройте 3D-план.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onConsult && (
            <button
              type="button"
              className="button outline"
              onClick={() => onConsult('Консультация по 3D-туру')}
            >
              Заказать консультацию
            </button>
          )}
          <a
            className="button blue"
            href={siteUrl('/visual')}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/visual');
            }}
          >
            Выбрать квартиру на 3D-плане <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
