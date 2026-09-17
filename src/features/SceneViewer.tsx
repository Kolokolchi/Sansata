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
  MapPin,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';
import { ExperienceConfig } from '../lib/experience';
import { PanoramaViewer } from './PanoramaViewer';
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

interface Hotspot {
  id: string;
  title: string;
  desc: string;
  pos: [number, number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'cafe',
    title: 'Кафе и уличная терраса',
    desc: 'Уютные кофейни и ресторанные террасы на первом этаже',
    pos: [-18, 3.2, 21],
    cameraPos: [-18, 4.5, 32],
    cameraTarget: [-17, 3, 15]
  },
  {
    id: 'courtyard',
    title: 'Детский городок EPDM',
    desc: 'Безопасное резиновое покрытие, горки, качели и развивающие зоны',
    pos: [0, 6.5, 3],
    cameraPos: [0, 22, 24],
    cameraTarget: [0, 6, 0]
  },
  {
    id: 'sec1',
    title: 'Парадный вход · Секция 1',
    desc: 'Дизайнерское лобби с консьерж-сервисом и зоной ожидания',
    pos: [-18.5, 2.5, 19.5],
    cameraPos: [-24, 6, 32],
    cameraTarget: [-18.5, 4, 18]
  },
  {
    id: 'sec2',
    title: 'Парадный вход · Секция 2',
    desc: 'Витражная входная группа с бесшумными скоростными лифтами',
    pos: [18.5, 2.5, 19.5],
    cameraPos: [24, 6, 32],
    cameraTarget: [18.5, 4, 18]
  },
  {
    id: 'workout',
    title: 'Воркаут & Спортзона',
    desc: 'Уличные тренажеры, брусья и зона для утренней йоги',
    pos: [-7.5, 6.0, -4.5],
    cameraPos: [-12, 12, 6],
    cameraTarget: [-7.5, 6, -4.5]
  }
];

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
  const [showHotspots, setShowHotspots] = useState(true);
  const showHotspotsRef = useRef(showHotspots);
  showHotspotsRef.current = showHotspots;
  const [hoveredFloor, setHoveredFloor] = useState<{ section: number; floor: number } | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

    const tempVec = new THREE.Vector3();

    const updateHotspotsDOM = () => {
      if (!showHotspotsRef.current || interior || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;

      for (const spot of HOTSPOTS) {
        const pin = pinRefs.current[spot.id];
        if (!pin) continue;

        tempVec.set(...spot.pos);
        tempVec.project(camera);
        const isBehind = tempVec.z > 1;
        const x = (tempVec.x * 0.5 + 0.5) * w;
        const y = (-(tempVec.y * 0.5) + 0.5) * h;
        const visible = !isBehind && x >= 10 && x <= w - 10 && y >= 10 && y <= h - 10;

        if (visible) {
          pin.style.display = '';
          pin.style.transform = `translate(${x}px, ${y}px)`;
        } else {
          pin.style.display = 'none';
        }
      }
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
          updateHotspotsDOM();
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
    controls.addEventListener('change', updateHotspotsDOM);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        updateHotspotsDOM();
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
        updateHotspotsDOM();

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
      controls.removeEventListener('change', updateHotspotsDOM);
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

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !hostRef.current) return;
    const container = hostRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    const tempVec = new THREE.Vector3();

    for (const spot of HOTSPOTS) {
      const pin = pinRefs.current[spot.id];
      if (!pin) continue;
      if (!showHotspots || interior) {
        pin.style.display = 'none';
        continue;
      }
      tempVec.set(...spot.pos);
      tempVec.project(api.camera);
      const isBehind = tempVec.z > 1;
      const x = (tempVec.x * 0.5 + 0.5) * w;
      const y = (-(tempVec.y * 0.5) + 0.5) * h;
      const visible = !isBehind && x >= 10 && x <= w - 10 && y >= 10 && y <= h - 10;
      if (visible) {
        pin.style.display = '';
        pin.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        pin.style.display = 'none';
      }
    }
  }, [showHotspots, interior]);

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

      {showHotspots && !interior && (
        <div className="scene-hotspots-layer" style={{ pointerEvents: 'none' }}>
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              ref={(el) => {
                pinRefs.current[spot.id] = el;
              }}
              className={`scene-hotspot-pin ${selectedHotspot?.id === spot.id ? 'active' : ''}`}
              style={{
                display: 'none',
                transform: 'translate(0px, 0px)',
                pointerEvents: 'auto'
              }}
              onClick={() => {
                setSelectedHotspot(spot);
                setViewPreset(spot.title, spot.cameraPos, spot.cameraTarget);
              }}
              title={spot.title}
            >
              <span className="pin-dot" />
              <span className="pin-title">{spot.title}</span>
            </button>
          ))}
        </div>
      )}

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

      {selectedHotspot && (
        <div className="scene-spot-modal">
          <div className="spot-modal-content">
            <div className="spot-modal-badge">
              <MapPin size={14} /> Инфраструктура комплекса
            </div>
            <h4>{selectedHotspot.title}</h4>
            <p>{selectedHotspot.desc}</p>
            <div className="spot-modal-actions">
              <button
                className="button-sm primary"
                onClick={() => {
                  setViewPreset(selectedHotspot.title, selectedHotspot.cameraPos, selectedHotspot.cameraTarget);
                  setSelectedHotspot(null);
                }}
              >
                Приблизить ракурс
              </button>
              <button className="button-sm secondary" onClick={() => setSelectedHotspot(null)}>
                Закрыть
              </button>
            </div>
          </div>
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
          className={`icon ${showHotspots ? 'active-mode' : ''}`}
          aria-label="Показать/скрыть инфраструктуру"
          title="Метки инфраструктуры"
          onClick={() => setShowHotspots(!showHotspots)}
        >
          <MapPin size={18} />
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

export function TourPage({ config }: { config: ExperienceConfig }) {
  const [mode, setMode] = useState<'complex' | 'interior' | 'panorama'>('complex');

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
          Интерактивная 3D-модель жилого комплекса Shattyq (Sensata Group) с реалистичными материалами,
          сеткой фасадов из травертина, благоустроенным двором, тремя режимами времени суток и выбором этажей.
        </p>
      </div>

      <div className="tabs feature-tabs">
        <button className={mode === 'complex' ? 'active' : ''} onClick={() => setMode('complex')}>
          Территория в 3D (Архитектура и двор)
        </button>
        <button className={mode === 'interior' ? 'active' : ''} onClick={() => setMode('interior')}>
          3D-интерьер квартиры
        </button>
        {config.panoramas.length > 0 && (
          <button className={mode === 'panorama' ? 'active' : ''} onClick={() => setMode('panorama')}>
            Панорамы 360°
          </button>
        )}
      </div>

      {mode === 'panorama' ? (
        <PanoramaViewer panoramas={config.panoramas} />
      ) : (
        <SceneViewer key={mode} config={config} section={0} floor={0} interior={mode === 'interior'} />
      )}

      <div className="feature-bottom">
        <p>
          Выберите понравившуюся планировку в каталоге или исследуйте расположение секций прямо на 3D-модели.
        </p>
        <a
          className="button blue"
          href={siteUrl('/visual')}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(siteUrl('/visual'));
          }}
        >
          Выбрать квартиру на 3D-плане <ArrowUpRight size={18} />
        </a>
      </div>
    </div>
  );
}
