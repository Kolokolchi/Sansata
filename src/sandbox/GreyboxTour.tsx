import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { siteUrl } from '../lib/site';
import layout from './greybox-layout.json';
import './greybox-tour.css';

type TourNode = {
  id: string;
  title: string;
  roomType: string;
  position: [number, number, number];
  initialYaw: number;
  links: string[];
  panoramaFile: string;
  previewFile: string;
  panoramaYaw: number;
};

type Transition = {
  to: TourNode;
  points: THREE.Vector3[];
  nodeIds: string[];
  distances: number[];
  length: number;
  duration: number;
  started: number;
  requested: number;
  pushHistory: boolean;
};

type Runtime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sphere: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  sphereNext: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  boxGeometry: THREE.BoxGeometry;
  boxMaterials: THREE.MeshStandardMaterial[];
  boxMeshes: THREE.Mesh[];
  nodeId: string;
  position: THREE.Vector3;
  yaw: number;
  pitch: number;
  transition: Transition | null;
  pending: { id: string; pushHistory: boolean } | null;
  disposed: boolean;
  previews: Map<string, THREE.Texture>;
  hdri: Map<string, THREE.Texture>;
  loadingPreview: Set<string>;
  loadingHdri: Set<string>;
  failedPreview: Set<string>;
  failedHdri: Set<string>;
  modelVisible: boolean;
  frameId: number;
};

const nodes = layout.nodes as TourNode[];
const byId = new Map(nodes.map((node) => [node.id, node]));
const hdriUrls = Object.fromEntries(nodes.map(node => [node.id, new URL(`./hdri/${node.panoramaFile}`, import.meta.url).href]));
const previewUrls = Object.fromEntries(nodes.map(node => [node.id, new URL(`./hdri/${node.previewFile}`, import.meta.url).href]));

function canWalk(from: TourNode, to: TourNode): boolean {
  // Sweep a body with 12 cm clearance through the collision boxes, including low furniture.
  for (const box of layout.boxes) {
    if (box.max[1] <= .06 || box.min[1] >= Math.max(from.position[1], to.position[1]) + .22) continue;
    let entry = 0;
    let exit = 1;
    for (const axis of [0, 2]) {
      const origin = from.position[axis];
      const delta = to.position[axis] - origin;
      const min = box.min[axis] - .12;
      const max = box.max[axis] + .12;
      if (Math.abs(delta) < 1e-9) {
        if (origin < min || origin > max) { entry = 2; break; }
      } else {
        const a = (min - origin) / delta;
        const b = (max - origin) / delta;
        entry = Math.max(entry, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
      }
    }
    if (entry <= exit) return false;
  }
  return true;
}

function initialNode(): TourNode {
  return byId.get(new URLSearchParams(window.location.search).get('point') || '') || byId.get('living')!;
}

function direction(yaw: number, pitch: number): THREE.Vector3 {
  const a = THREE.MathUtils.degToRad(yaw);
  const b = THREE.MathUtils.degToRad(pitch);
  return new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), -Math.cos(a) * Math.cos(b));
}

function normalizeYaw(value: number): number {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function ease(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function createModel(scene: THREE.Scene, runtime: Runtime) {
  const palette = new Map<string, THREE.MeshStandardMaterial>();
  for (const [key, definition] of Object.entries(layout.materials)) {
    const color = new THREE.Color(definition.color);
    const emissive = 'emissive' in definition ? Number(definition.emissive) : 0;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.94,
      metalness: 0,
      emissive: emissive ? color : new THREE.Color(0),
      emissiveIntensity: emissive
    });
    palette.set(key, material);
    runtime.boxMaterials.push(material);
  }

  for (const box of layout.boxes) {
    const material = palette.get(box.material);
    if (!material) continue;
    const mesh = new THREE.Mesh(runtime.boxGeometry, material);
    mesh.position.set(
      (box.min[0] + box.max[0]) / 2,
      (box.min[1] + box.max[1]) / 2,
      (box.min[2] + box.max[2]) / 2
    );
    mesh.scale.set(
      box.max[0] - box.min[0],
      box.max[1] - box.min[1],
      box.max[2] - box.min[2]
    );
    scene.add(mesh);
    runtime.boxMeshes.push(mesh);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  for (const light of layout.lights) {
    const lamp = new THREE.PointLight(0xfff8ed, light.power * 2.1, 8, 2);
    lamp.position.set(...(light.position as [number, number, number]));
    scene.add(lamp);
  }
}

export default function GreyboxTour() {
  const start = useRef(initialNode());
  const [currentId, setCurrentId] = useState(start.current.id);
  const [isMoving, setIsMoving] = useState(false);
  const [status, setStatus] = useState('Подготовка HDRI…');
  const [modelVisible, setModelVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const current = byId.get(currentId)!;

  const applyTexture = useCallback((runtime: Runtime, id: string, sphere = runtime.sphere) => {
    const texture = runtime.hdri.get(id) || runtime.previews.get(id);
    if (sphere.material.map !== (texture || null)) {
      sphere.material.map = texture || null;
      sphere.material.toneMapped = runtime.hdri.has(id);
      sphere.material.needsUpdate = true;
    }
    sphere.position.set(...byId.get(id)!.position);
    sphere.rotation.y = THREE.MathUtils.degToRad(byId.get(id)!.panoramaYaw);
    sphere.visible = !!texture && !runtime.modelVisible;
    if (id === runtime.nodeId && !runtime.transition) setStatus(texture ? '' : runtime.failedHdri.has(id) && runtime.failedPreview.has(id)
      ? 'Панорама недоступна. Выберите другую точку или включите 3D для проверки.' : 'Загрузка HDRI…');
  }, []);

  const loadTextures = useCallback((runtime: Runtime, id: string, previewOnly = false) => {
    if (!byId.has(id)) return;
    if (!runtime.previews.has(id) && !runtime.loadingPreview.has(id)) {
      runtime.loadingPreview.add(id);
      new THREE.TextureLoader().load(previewUrls[id], (texture) => {
        runtime.loadingPreview.delete(id);
        if (runtime.disposed) { texture.dispose(); return; }
        if (texture.image.width !== texture.image.height * 2) {
          texture.dispose(); runtime.failedPreview.add(id);
          if (runtime.nodeId === id && !runtime.transition) applyTexture(runtime, id);
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        runtime.previews.set(id, texture);
        runtime.failedPreview.delete(id);
        if (runtime.nodeId === id && !runtime.hdri.has(id) && !runtime.transition) applyTexture(runtime, id);
      }, undefined, () => {
        runtime.loadingPreview.delete(id);
        runtime.failedPreview.add(id);
        if (!runtime.disposed && runtime.nodeId === id && !runtime.transition) applyTexture(runtime, id);
      });
    }
    if (!previewOnly && !runtime.hdri.has(id) && !runtime.loadingHdri.has(id)) {
      runtime.loadingHdri.add(id);
      new HDRLoader().load(hdriUrls[id], (texture) => {
        runtime.loadingHdri.delete(id);
        if (runtime.disposed) { texture.dispose(); return; }
        if (texture.image.width !== texture.image.height * 2) {
          texture.dispose(); runtime.failedHdri.add(id);
          if (runtime.nodeId === id && !runtime.transition) applyTexture(runtime, id);
          return;
        }
        runtime.hdri.set(id, texture);
        runtime.failedHdri.delete(id);
        if (runtime.nodeId === id && !runtime.transition) applyTexture(runtime, id);
      }, undefined, () => {
        runtime.loadingHdri.delete(id);
        runtime.failedHdri.add(id);
        if (!runtime.disposed && runtime.nodeId === id && !runtime.transition) applyTexture(runtime, id);
      });
    }
  }, [applyTexture]);

  const goTo = useCallback((id: string, pushHistory = true) => {
    const runtime = runtimeRef.current;
    const to = byId.get(id);
    if (!runtime || !to || runtime.disposed) return;
    if (runtime.transition) {
      runtime.pending = { id, pushHistory };
      if (!pushHistory) runtime.transition.pushHistory = false;
      return;
    }
    if (runtime.nodeId === id) return;
    const from = byId.get(runtime.nodeId)!;
    let route = [id];
    if (!from.links.includes(id) || !canWalk(from, to)) {
      const paths = [[from.id]];
      const visited = new Set([from.id]);
      let path: string[] | undefined;
      while (paths.length) {
        const candidate = paths.shift()!;
        const last = candidate[candidate.length - 1];
        if (last === id) { path = candidate.slice(1); break; }
        for (const next of byId.get(last)!.links) {
          if (!visited.has(next) && canWalk(byId.get(last)!, byId.get(next)!)) { visited.add(next); paths.push([...candidate, next]); }
        }
      }
      if (!path?.length) { setStatus('Нет свободного прохода к выбранной точке.'); return; }
      route = path;
    }
    const points = [from.id, ...route].map(point => new THREE.Vector3(...byId.get(point)!.position));
    const distances = [0];
    for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + points[i - 1].distanceTo(points[i]));
    const length = distances[distances.length - 1];
    [from.id, ...route].forEach(point => loadTextures(runtime, point));
    runtime.transition = {
      to, points, nodeIds: [from.id, ...route], distances, length, duration: length / 3.6 * 1000, started: 0,
      requested: performance.now(), pushHistory
    };
    setIsMoving(true);
    setStatus(`Загрузка панорам: ${to.title}`);
  }, [loadTextures]);

  useEffect(() => {
    document.title = 'Greybox HDRI-тур · Песочница';
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setStatus('WebGL недоступен в этом браузере.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'greybox-tour__canvas';
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Панорама Greybox, вращайте мышью или пальцем');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#272d30');
    const camera = new THREE.PerspectiveCamera(76, 1, 0.04, 80);
    const sphereGeometry = new THREE.SphereGeometry(20, 64, 32);
    sphereGeometry.scale(-1, 1, 1);
    const sphereMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: false, depthTest: false });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(...start.current.position);
    sphere.renderOrder = 5;
    scene.add(sphere);
    const sphereNext = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
    sphereNext.renderOrder = 6;
    sphereNext.visible = false;
    scene.add(sphereNext);

    const runtime: Runtime = {
      renderer, scene, camera, sphere, sphereNext,
      boxGeometry: new THREE.BoxGeometry(1, 1, 1), boxMaterials: [], boxMeshes: [],
      nodeId: start.current.id,
      position: new THREE.Vector3(...start.current.position),
      yaw: start.current.initialYaw, pitch: -5,
      transition: null, pending: null, disposed: false,
      previews: new Map(), hdri: new Map(),
      loadingPreview: new Set(), loadingHdri: new Set(), failedPreview: new Set(), failedHdri: new Set(), modelVisible: false, frameId: 0
    };
    runtimeRef.current = runtime;
    createModel(scene, runtime);
    nodes.forEach((node) => {
      if (node.id === runtime.nodeId || start.current.links.includes(node.id)) loadTextures(runtime, node.id, node.id !== runtime.nodeId);
    });

    let markerBottom = 0;
    let controlBounds: DOMRect[] = [];
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      markerBottom = height - 85;
      controlBounds = [...(bottomRef.current?.children ?? [])].map(element => element.getBoundingClientRect());
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    if (bottomRef.current) resizeObserver.observe(bottomRef.current);
    resize();

    const raycaster = new THREE.Raycaster();
    const visibilityRay = new THREE.Raycaster();
    const screenPoint = new THREE.Vector2();
    const candidatePosition = new THREE.Vector3();
    const candidateDirection = new THREE.Vector3();
    const clearSurfaceTarget = () => {
      host.dataset.surfaceTarget = '';
      renderer.domElement.style.cursor = runtime.transition ? 'wait' : '';
      markerRefs.current.forEach(marker => { delete marker.dataset.targeted; });
    };
    const surfaceTarget = (x: number, y: number) => {
      if (runtime.transition) return null;
      const bounds = renderer.domElement.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
      screenPoint.set((x - bounds.left) / bounds.width * 2 - 1, 1 - (y - bounds.top) / bounds.height * 2);
      raycaster.setFromCamera(screenPoint, camera);
      // Pick the actual room surfaces, never the panorama sphere.
      const hit = raycaster.intersectObjects(runtime.boxMeshes, false)[0];
      if (!hit) return null;
      let nearest: TourNode | null = null;
      let distance = runtime.position.distanceToSquared(hit.point);
      for (const candidate of nodes) {
        if (candidate.id === runtime.nodeId) continue;
        candidatePosition.set(...candidate.position);
        const nextDistance = candidatePosition.distanceToSquared(hit.point);
        if (nextDistance >= distance - 0.01) continue;
        candidateDirection.copy(candidatePosition).sub(runtime.position);
        if (candidateDirection.dot(raycaster.ray.direction) <= 0) continue;
        // A wall between the scan and the clicked surface must not attract the camera.
        candidateDirection.copy(hit.point).sub(candidatePosition);
        const length = candidateDirection.length();
        visibilityRay.set(candidatePosition, candidateDirection.normalize());
        const obstruction = visibilityRay.intersectObjects(runtime.boxMeshes, false)[0];
        if (obstruction && obstruction.distance < length - 0.04) continue;
        distance = nextDistance;
        nearest = candidate;
      }
      return nearest;
    };
    const showSurfaceTarget = (target: TourNode | null) => {
      clearSurfaceTarget();
      if (!target) return;
      host.dataset.surfaceTarget = target.id;
      renderer.domElement.style.cursor = 'pointer';
      const marker = markerRefs.current.get(target.id);
      if (marker) marker.dataset.targeted = 'true';
    };
    const pointer = { active: false, id: -1, x: 0, y: 0, startX: 0, startY: 0, dragged: false };
    const onPointerDown = (event: PointerEvent) => {
      if (pointer.active) { pointer.dragged = true; return; }
      if (runtime.transition || !event.isPrimary || event.button !== 0) return;
      renderer.domElement.focus({ preventScroll: true });
      pointer.active = true;
      pointer.id = event.pointerId;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.startX = event.clientX;
      pointer.startY = event.clientY;
      pointer.dragged = false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.active && event.pointerType === 'mouse') showSurfaceTarget(surfaceTarget(event.clientX, event.clientY));
      if (!pointer.active || pointer.id !== event.pointerId || runtime.transition) return;
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 6) pointer.dragged = true;
      if (!pointer.dragged) return;
      clearSurfaceTarget();
      runtime.yaw = normalizeYaw(runtime.yaw - (event.clientX - pointer.x) * 0.16);
      runtime.pitch = THREE.MathUtils.clamp(runtime.pitch + (event.clientY - pointer.y) * 0.13, -80, 80);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (pointer.id !== event.pointerId) return;
      const clicked = event.type === 'pointerup' && !pointer.dragged
        && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) <= 6;
      pointer.active = false;
      pointer.id = -1;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      clearSurfaceTarget();
      if (clicked) {
        const target = surfaceTarget(event.clientX, event.clientY);
        if (target) goTo(target.id);
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * 0.045, 35, 95);
      camera.updateProjectionMatrix();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (runtime.transition) return;
      if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') runtime.yaw = normalizeYaw(runtime.yaw - 12);
      else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') runtime.yaw = normalizeYaw(runtime.yaw + 12);
      else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        const node = byId.get(runtime.nodeId)!;
        const forward = direction(runtime.yaw, 0);
        const best = node.links.map((id) => byId.get(id)!).filter(Boolean).sort((a, b) => {
          const aDot = new THREE.Vector3(...a.position).sub(runtime.position).normalize().dot(forward);
          const bDot = new THREE.Vector3(...b.position).sub(runtime.position).normalize().dot(forward);
          return bDot - aDot;
        })[0];
        if (best) goTo(best.id);
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        const node = byId.get(runtime.nodeId)!;
        if (node.links[0]) goTo(node.links[0]);
      } else return;
      event.preventDefault();
    };
    const onPopState = () => {
      goTo(initialNode().id, false);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerEnd);
    renderer.domElement.addEventListener('pointercancel', onPointerEnd);
    renderer.domElement.addEventListener('lostpointercapture', onPointerEnd);
    renderer.domElement.addEventListener('pointerleave', clearSurfaceTarget);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);

    const markerDirection = new THREE.Vector3();
    const markerPoint = new THREE.Vector3();
    const forward = new THREE.Vector3();
    let measurementStarted = performance.now();
    let frames = 0;
    const update = (time: number) => {
      if (runtime.disposed) return;
      let transition = runtime.transition;
      if (transition && !transition.started) {
        const required = transition.nodeIds.slice(1);
        const failed = required.some(id => runtime.failedHdri.has(id) && runtime.failedPreview.has(id));
        const ready = required.every(id => runtime.hdri.has(id) || runtime.previews.has(id));
        if (ready) {
          transition.started = time;
          setStatus(`Переход: ${transition.to.title}`);
        } else if (failed || time - transition.requested > 15000) {
          runtime.transition = null;
          runtime.pending = null;
          transition = null;
          setIsMoving(false);
          setStatus('Не удалось загрузить панорамы маршрута. Выберите другую точку.');
        }
      }
      if (transition?.started) {
        const elapsed = Math.max(0, time - transition.started);
        const progress = Math.min(1, elapsed / transition.duration);
        const distance = progress * transition.length;
        let segment = 1;
        while (segment < transition.distances.length - 1 && distance > transition.distances[segment]) segment++;
        const segmentStart = transition.distances[segment - 1];
        const segmentLength = transition.distances[segment] - segmentStart;
        runtime.position.lerpVectors(transition.points[segment - 1], transition.points[segment], (distance - segmentStart) / segmentLength);
        clearSurfaceTarget();
        const fromId = transition.nodeIds[segment - 1];
        const toId = transition.nodeIds[segment];
        const hasSource = runtime.hdri.has(fromId) || runtime.previews.has(fromId);
        applyTexture(runtime, hasSource ? fromId : toId);
        applyTexture(runtime, toId, sphereNext);
        sphereMaterial.opacity = 1;
        sphereNext.material.opacity = ease((distance - segmentStart) / segmentLength);
        if (progress >= 1) {
          runtime.nodeId = transition.to.id;
          runtime.transition = null;
          runtime.position.set(...transition.to.position);
          sphereMaterial.opacity = 1;
          sphereNext.visible = false;
          setCurrentId(transition.to.id);
          setIsMoving(false);
          applyTexture(runtime, transition.to.id);
          if (transition.pushHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set('point', transition.to.id);
            window.history.pushState({}, '', url);
          }
          transition.to.links.forEach((id) => loadTextures(runtime, id, true));
          const pending = runtime.pending;
          runtime.pending = null;
          if (pending) {
            if (pending.id !== runtime.nodeId) goTo(pending.id, pending.pushHistory);
          }
        }
      }

      // Collision geometry remains raycastable but is drawn only in the explicit debug mode.
      runtime.boxMeshes.forEach(mesh => { mesh.visible = runtime.modelVisible; });

      camera.position.copy(runtime.position);
      camera.lookAt(runtime.position.clone().add(direction(runtime.yaw, runtime.pitch)));
      camera.updateMatrixWorld();
      camera.getWorldDirection(forward);
      const activeNode = byId.get(runtime.nodeId)!;
      for (const [id, marker] of markerRefs.current) {
        const target = byId.get(id);
        if (!target || !activeNode.links.includes(id) || runtime.transition) { marker.hidden = true; continue; }
        markerDirection.set(target.position[0], 0.04, target.position[2]).sub(runtime.position).normalize();
        markerPoint.copy(runtime.position).addScaledVector(markerDirection, 14);
        const inFront = markerDirection.dot(forward) > 0.12;
        markerPoint.project(camera);
        const x = (markerPoint.x + 1) * host.clientWidth / 2;
        const y = (1 - markerPoint.y) * host.clientHeight / 2;
        const minX = 48;
        const maxX = host.clientWidth - 48;
        const minY = 115;
        let maxY = Math.max(minY, markerBottom);
        for (const bounds of controlBounds) {
          if (x > bounds.left - 30 && x < bounds.right + 30 && y > bounds.top - 16 && y < bounds.bottom + 16) {
            maxY = Math.max(minY, Math.min(maxY, bounds.top - 38));
          }
        }
        const offscreen = !inFront || x < minX || x > maxX || y < minY || y > maxY;
        marker.hidden = false;
        marker.dataset.offscreen = String(offscreen);
        if (!inFront) {
          const targetYaw = THREE.MathUtils.radToDeg(Math.atan2(target.position[0] - runtime.position.x, -(target.position[2] - runtime.position.z)));
          const onRight = normalizeYaw(targetYaw - runtime.yaw) >= 0;
          marker.style.left = `${onRight ? maxX : minX}px`;
          // Separate rear-facing indicators from the floor and from one another.
          marker.style.top = `${minY + (maxY - minY) * (0.35 + activeNode.links.indexOf(id) * 0.16)}px`;
          marker.dataset.direction = onRight ? '→' : '←';
        } else {
          marker.style.left = `${THREE.MathUtils.clamp(x, minX, maxX)}px`;
          marker.style.top = `${THREE.MathUtils.clamp(y, minY, maxY)}px`;
          marker.dataset.direction = y > maxY ? '↓' : y < minY ? '↑' : x < minX ? '←' : '→';
        }
      }
      renderer.render(scene, camera);
      host.dataset.flight = JSON.stringify({ time, position: runtime.position.toArray(), moving: !!runtime.transition?.started,
        opacity: sphereMaterial.opacity, blend: sphereNext.visible ? sphereNext.material.opacity : 0,
        geometryVisible: runtime.boxMeshes.some(mesh => mesh.visible), panoramaVisible: sphere.visible, calls: renderer.info.render.calls });
      frames++;
      if (time - measurementStarted >= 500) {
        host.dataset.metrics = JSON.stringify({ point: runtime.nodeId, yaw: runtime.yaw, pitch: runtime.pitch,
          moving: !!runtime.transition, mode: runtime.modelVisible ? 'model' : runtime.hdri.has(runtime.nodeId) ? 'hdr' : 'preview',
          fps: Math.round(frames * 1000 / (time - measurementStarted)), calls: renderer.info.render.calls,
          geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures });
        frames = 0;
        measurementStarted = time;
      }
      runtime.frameId = requestAnimationFrame(update);
    };
    runtime.frameId = requestAnimationFrame(update);

    return () => {
      runtime.disposed = true;
      cancelAnimationFrame(runtime.frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerEnd);
      renderer.domElement.removeEventListener('pointercancel', onPointerEnd);
      renderer.domElement.removeEventListener('lostpointercapture', onPointerEnd);
      renderer.domElement.removeEventListener('pointerleave', clearSurfaceTarget);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      new Set([...runtime.previews.values(), ...runtime.hdri.values()]).forEach((texture) => texture.dispose());
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      sphereNext.material.dispose();
      runtime.boxGeometry.dispose();
      runtime.boxMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, [applyTexture, goTo, loadTextures]);

  const toggleModel = () => {
    setModelVisible((value) => {
      const next = !value;
      const runtime = runtimeRef.current;
      if (runtime) {
        runtime.modelVisible = next;
        runtime.sphere.visible = !next && !!runtime.sphere.material.map;
        runtime.sphereNext.visible = !next && !!runtime.transition?.started && !!runtime.sphereNext.material.map;
        runtime.boxMeshes.forEach(mesh => { mesh.visible = next; });
      }
      return next;
    });
  };

  const resetView = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.yaw = current.initialYaw;
    runtime.pitch = -5;
    runtime.camera.fov = 76;
    runtime.camera.updateProjectionMatrix();
  };

  const currentLinks = current.links.map((id) => byId.get(id)).filter((node): node is TourNode => !!node);

  return <main className="greybox-tour" aria-label="Демонстрационный Greybox HDRI-тур">
    <div className="greybox-tour__viewport" ref={hostRef}>
      {currentLinks.map((node) => <button
        key={node.id}
        ref={(element) => { if (element) markerRefs.current.set(node.id, element); else markerRefs.current.delete(node.id); }}
        className="greybox-tour__marker"
        type="button"
        aria-label={`Перейти: ${node.title}`}
        title={node.title}
        onClick={() => goTo(node.id)}
        hidden
      ><span /><span className="greybox-tour__marker-label">{node.title}</span></button>)}
    </div>
    <div className="greybox-tour__topbar">
      <div className="greybox-tour__identity"><strong>GREYBOX</strong><span>HDRI • ДЕМО-ТУР</span></div>
      <a href={siteUrl('/sandbox/zems-tour')} className="greybox-tour__reference">Открыть референс ↗</a>
    </div>
    <div className="greybox-tour__bottom" ref={bottomRef}>
      <div className="greybox-tour__current"><span>ТОЧКА {nodes.findIndex((node) => node.id === currentId) + 1} / {nodes.length}</span><strong>{current.title}</strong><small>Тап или клик по интерьеру — идти · перетаскивание — обзор</small></div>
      <nav className="greybox-tour__linked" aria-label="Соседние точки обзора">
        {currentLinks.map((node) => <button type="button" key={node.id} onClick={() => goTo(node.id)} disabled={isMoving}>{node.title}<span>↗</span></button>)}
      </nav>
      <div className="greybox-tour__tools">
        <button type="button" onClick={resetView} aria-label="Сбросить ракурс">⟳</button>
        <button type="button" onClick={toggleModel} title={modelVisible ? 'Текущий режим: 3D. Переключить на HDRI' : 'Текущий режим: HDRI. Переключить на 3D'} aria-label={modelVisible ? 'Показать HDRI' : 'Показать Greybox модель'} aria-pressed={modelVisible}>{modelVisible ? '3D' : 'HDRI'}</button>
      </div>
    </div>
    {status && <div className="greybox-tour__status" role="status">{status}</div>}
  </main>;
}
