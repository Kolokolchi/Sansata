import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InteriorDesign, TourView } from '../lib/journey';
import { siteUrl } from '../lib/site';

export const roomNames = ['Гостиная', 'Спальня', 'Кухня', 'Прихожая'];

interface ApartmentSceneProps {
  mode: TourView;
  point: number;
  design: InteriorDesign;
  rooms: number;
  modelUrl?: string;
  captureToken?: number;
}

const box = (
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
  parent: THREE.Object3D
) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const cyl = (
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
  parent: THREE.Object3D
) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
};

const disposeObjectTree = (root: THREE.Object3D) => {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          for (const key of Object.keys(m)) {
            const val = (m as any)[key];
            if (val && val instanceof THREE.Texture) val.dispose();
          }
          m.dispose();
        }
      }
    }
  });
};

const disposeGeometriesOnly = (root: THREE.Object3D) => {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry) {
      o.geometry.dispose();
    }
  });
};

export function ApartmentScene({
  mode,
  point,
  design,
  rooms,
  modelUrl,
  captureToken = 0
}: ApartmentSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    radius: number;
  } | null>(null);

  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const extraRoomsGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<{
    wall: THREE.MeshStandardMaterial;
    floor: THREE.MeshStandardMaterial;
    white: THREE.MeshStandardMaterial;
    dark: THREE.MeshStandardMaterial;
    cloth: THREE.MeshStandardMaterial;
    sage: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
    glass: THREE.MeshStandardMaterial;
  } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelRevision, setModelRevision] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // 1. One-time WebGL mount effect (does NOT tear down when furniture moves)
  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setError('3D недоступен. Откройте вкладку «Планировка».');
      return;
    }

    let stopped = false;
    setError('');
    setLoading(false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f5f4f1');

    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 300);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxDistance = 40;
    controls.minDistance = 8;
    controls.maxPolarAngle = Math.PI * 0.48;

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      'Интерактивная модель квартиры — вращение мышью и масштабирование'
    );

    scene.add(new THREE.HemisphereLight('#ffffff', '#b5a58b', 2.5));

    const sun = new THREE.DirectionalLight('#fff4dd', 4);
    sun.position.set(-5, 15, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight('#dce7ff', 2);
    fill.position.set(7, 5, -8);
    scene.add(fill);

    const model = new THREE.Group();
    scene.add(model);

    const mat = (c: string, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const wall = mat(design.wall);
    const wood = mat(design.floor);
    const white = mat('#faf8f3');
    const dark = mat('#6c645b');
    const cloth = mat('#c0baaa');
    const sage = mat('#8e9985');
    const metal = mat('#8d8271', 0.3);
    const glass = new THREE.MeshStandardMaterial({
      color: '#b6cbd0',
      transparent: true,
      opacity: 0.3,
      roughness: 0.1
    });

    materialsRef.current = { wall, floor: wood, white, dark, cloth, sage, metal, glass };

    // Base apartment architecture (built once)
    box(12, 0.24, 10, 0, -0.12, 0, wood, model);
    for (let i = 0; i < 29; i++) {
      box(0.018, 0.008, 10, -5.8 + i * 0.4, 0.015, 0, mat('#ab957c'), model);
    }

    box(12, 2.8, 0.18, 0, 1.4, -5, wall, model);
    box(0.18, 2.8, 10, -6, 1.4, 0, wall, model);
    box(0.18, 2.8, 10, 6, 1.4, 0, wall, model);

    // Low front sill keeps dollhouse readable; full height rear walls frame rooms
    box(12, 0.55, 0.18, 0, 0.275, 5, wall, model);
    box(0.16, 2.8, 5.8, 0, 1.4, -2.1, wall, model);
    box(4, 2.8, 0.16, 4, 1.4, 0.8, wall, model);
    box(0.16, 2.8, 2, 0, 1.4, 4, wall, model);

    box(3, 2.1, 0.06, 3, 1.65, -4.88, glass, model);
    box(3, 2.1, 0.06, -3, 1.65, -4.88, glass, model);
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      box(0.07, 2.1, 0.11, x, 1.65, -4.8, metal, model);
    }
    box(9, 0.06, 0.12, 0, 2.7, -4.8, metal, model);

    // Kitchen, framed art, rug and fixtures
    box(4.4, 0.9, 0.65, -3.6, 0.45, -4.3, white, model);
    box(4.5, 0.07, 0.75, -3.6, 0.94, -4.3, dark, model);
    for (let i = 0; i < 5; i++) {
      box(0.018, 0.85, 0.015, -5.7 + i * 0.85, 0.46, -3.96, metal, model);
      box(0.26, 0.025, 0.04, -5.3 + i * 0.85, 0.76, -3.93, metal, model);
    }
    box(0.9, 0.04, 0.45, -4.6, 1, -4.2, metal, model);
    box(0.7, 0.04, 0.4, -2.4, 1, -4.2, dark, model);
    box(0.8, 2.5, 0.85, -5.45, 1.25, -3, white, model);

    box(4, 0.025, 3.8, -3, 0.035, 0.6, mat('#e6e0d5'), model);
    box(0.65, 1.5, 0.07, 4.7, 1.8, -4.83, metal, model);
    box(0.54, 1.38, 0.08, 4.7, 1.8, -4.77, mat('#c1b097'), model);

    // Dynamic groups for extra rooms and furniture
    const extraRoomsGroup = new THREE.Group();
    model.add(extraRoomsGroup);
    extraRoomsGroupRef.current = extraRoomsGroup;

    const furnitureGroup = new THREE.Group();
    model.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    let radius = 17;
    camera.position.set(13, 14, 17);
    controls.target.set(0, 0, 0);
    api.current = { renderer, scene, camera, controls, radius };

    if (modelUrl) {
      setLoading(true);
      new GLTFLoader().load(
        siteUrl(modelUrl),
        (g) => {
          if (stopped) {
            disposeObjectTree(g.scene);
            return;
          }
          scene.remove(model);
          const bounds = new THREE.Box3().setFromObject(g.scene);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          g.scene.position.sub(center);
          g.scene.position.y += size.y / 2;
          scene.add(g.scene);
          radius = Math.max(size.x, size.y, size.z) * 1.4;
          if (api.current) api.current.radius = radius;
          camera.position.set(radius, radius * 0.9, radius);
          controls.maxDistance = radius * 3;
          camera.far = radius * 10;
          camera.updateProjectionMatrix();
          setModelRevision((v) => v + 1);
          setLoading(false);
        },
        undefined,
        () => {
          if (!stopped) {
            setLoading(false);
            setError('Модель не загрузилась. Показан демонстрационный интерьер.');
          }
        }
      );
    }

    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    renderer.setAnimationLoop(() => {
      controls.autoRotate = modeRef.current === 'spin';
      controls.autoRotateSpeed = 0.8;
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      stopped = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      disposeObjectTree(scene);
      if (!scene.children.includes(model)) {
        disposeObjectTree(model);
      }
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
      materialsRef.current = null;
      furnitureGroupRef.current = null;
      extraRoomsGroupRef.current = null;
    };
  }, [modelUrl]);

  // 2. Separate Furniture & Style Update effect (no WebGL context destruction!)
  useEffect(() => {
    const mats = materialsRef.current;
    const fg = furnitureGroupRef.current;
    const eg = extraRoomsGroupRef.current;
    if (!mats || !fg || !eg) return;

    // Update wall and floor colors smoothly
    mats.wall.color.set(design.wall);
    mats.floor.color.set(design.floor);

    // Update extra room items
    disposeGeometriesOnly(eg);
    eg.clear();
    if (rooms > 2) {
      box(2, 0.45, 1, 3, 0.23, 3.5, mats.floor, eg);
      box(1.95, 0.15, 0.95, 3, 0.53, 3.5, mats.white, eg);
      box(1, 0.7, 0.6, 5, 0.35, 2.3, mats.cloth, eg);
    }

    // Rebuild furniture meshes without touching WebGLRenderer
    disposeGeometriesOnly(fg);
    fg.clear();

    for (const item of design.furniture) {
      const group = new THREE.Group();
      group.position.set(item.x, 0, item.z);
      group.rotation.y = (item.rotation * Math.PI) / 180;
      fg.add(group);

      switch (item.kind) {
        case 'sofa':
          box(3, 0.45, 1, 0, 0.35, 0, mats.cloth, group);
          box(3, 0.65, 0.2, 0, 0.8, 0.45, mats.cloth, group);
          for (const x of [-1.5, 1.5]) box(0.2, 0.65, 1, x, 0.65, 0, mats.cloth, group);
          for (const x of [-0.7, 0.7]) box(0.65, 0.3, 0.5, x, 0.7, 0.2, mats.sage, group);
          break;
        case 'bed':
          box(2.5, 0.35, 3.3, 0, 0.2, 0, mats.floor, group);
          box(2.45, 0.25, 3.25, 0, 0.5, 0, mats.white, group);
          box(2.45, 0.06, 1.7, 0, 0.66, 0.65, mats.sage, group);
          box(2.5, 1, 0.15, 0, 0.6, -1.65, mats.cloth, group);
          for (const x of [-0.65, 0.65]) box(0.95, 0.16, 0.65, x, 0.72, -1.05, mats.white, group);
          break;
        case 'table':
          cyl(0.7, 0.08, 0, 0.7, 0, mats.floor, group);
          cyl(0.12, 0.7, 0, 0.35, 0, mats.dark, group);
          break;
        case 'chair':
          box(0.7, 0.12, 0.7, 0, 0.48, 0, mats.cloth, group);
          box(0.7, 0.65, 0.1, 0, 0.8, 0.32, mats.cloth, group);
          for (const x of [-0.25, 0.25]) {
            for (const z of [-0.25, 0.25]) {
              box(0.05, 0.45, 0.05, x, 0.23, z, mats.dark, group);
            }
          }
          break;
        case 'plant':
          cyl(0.3, 0.55, 0, 0.28, 0, mats.white, group);
          for (let i = 0; i < 6; i++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.37, 12, 8), mats.sage);
            leaf.scale.set(0.65, 1.6, 0.5);
            leaf.position.set(Math.sin(i) * 0.25, 0.85 + Math.cos(i) * 0.15, Math.cos(i) * 0.25);
            leaf.rotation.z = i * 0.7;
            leaf.castShadow = true;
            group.add(leaf);
          }
          break;
      }
    }
  }, [design, rooms]);

  // 3. Camera position & view mode effect (does NOT depend on design updates)
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const { camera, controls, radius } = a;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = radius * 3;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI * 0.49;
    camera.fov = 40;

    if (mode === 'panorama') {
      const points = [
        [-3, 1.6, 3.6],
        [3, 1.6, 0],
        [-3, 1.6, -2],
        [2, 1.6, 3.8]
      ];
      const pos = points[point % points.length];
      controls.target.set(pos[0], pos[1], pos[2] - 0.01);
      camera.position.set(...(pos as [number, number, number]));
      controls.minDistance = 0.01;
      controls.maxDistance = 0.01;
      controls.enableZoom = false;
      controls.maxPolarAngle = Math.PI * 0.95;
      controls.minPolarAngle = Math.PI * 0.05;
      camera.fov = 75;
    } else if (mode === 'top') {
      camera.position.set(0, radius * 1.65, 0.01);
      controls.target.set(0, 0, 0);
      controls.enableRotate = false;
    } else {
      camera.position.set(radius * 0.76, radius * 0.8, radius);
      controls.target.set(0, 0, 0);
    }
    camera.updateProjectionMatrix();
    controls.update();
  }, [mode, point, modelRevision]);

  // 4. Screenshot capture effect
  useEffect(() => {
    if (!captureToken || !api.current) return;
    const { renderer, scene, camera } = api.current;
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = 'Shattyq-interior.png';
    a.click();
  }, [captureToken]);

  return (
    <div className="apartment-scene" ref={host}>
      {loading && (
        <span className="apartment-loading" role="status">
          Загружаем модель…
        </span>
      )}
      {error && (
        <p className="apartment-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
