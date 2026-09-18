import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { siteUrl } from '../lib/site';
import { Panorama } from '../lib/experience';
import { Plus, Minus, RotateCcw, Maximize, Compass, X } from 'lucide-react';

export interface PanoramaViewerProps {
  panoramas: Panorama[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  captureToken?: number;
  inline?: boolean;
  onClose?: () => void;
}

interface MarkerItem {
  button: HTMLButtonElement;
  position: THREE.Vector3;
}

function orientCameraTo(camera: THREE.PerspectiveCamera, controls: OrbitControls, yaw = 0, pitch = 0) {
  const yawRad = THREE.MathUtils.degToRad(yaw);
  const pitchRad = THREE.MathUtils.degToRad(pitch);
  const camDir = new THREE.Vector3(
    Math.sin(yawRad) * Math.cos(pitchRad),
    Math.sin(pitchRad),
    -Math.cos(yawRad) * Math.cos(pitchRad)
  ).normalize();

  camera.position.copy(camDir).multiplyScalar(-0.01);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

export function PanoramaViewer({
  panoramas,
  selectedId,
  onSelect,
  captureToken = 0,
  inline = false,
  onClose
}: PanoramaViewerProps) {
  const [internalId, setInternalId] = useState<string>(selectedId || panoramas[0]?.id || '');

  useEffect(() => {
    if (selectedId) {
      setInternalId(selectedId);
    }
  }, [selectedId]);

  const choose = (id: string) => {
    setInternalId(id);
    onSelect?.(id);
  };

  const captureRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (captureToken) captureRef.current?.();
  }, [captureToken]);

  const [error, setError] = useState<string>('');

  const currentPanorama = panoramas.find((p) => p.id === internalId) || panoramas[0];
  const hostRef = useRef<HTMLDivElement>(null);

  const apiRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    material: THREE.MeshBasicMaterial;
    geometry: THREE.BufferGeometry;
  } | null>(null);

  const markersRef = useRef<MarkerItem[]>([]);

  // 1. One-time WebGL mount effect (preserves renderer across room switches)
  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    setError('');

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setError('Панорама недоступна в этом браузере.');
      return;
    }

    let isDisposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.set(0, 0, 0.01);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = -0.35;
    controls.enableDamping = true;

    const initYaw = currentPanorama?.initialYaw ?? 0;
    const initPitch = currentPanorama?.initialPitch ?? 0;
    orientCameraTo(camera, controls, initYaw, initPitch);

    // Inverted sphere for 360-degree equirectangular panorama projection
    const geometry = new THREE.SphereGeometry(40, 64, 32);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    captureRef.current = () => {
      renderer.render(scene, camera);
      const link = document.createElement('a');
      link.href = renderer.domElement.toDataURL('image/png');
      link.download = 'Shattyq-panorama.png';
      link.click();
    };

    apiRef.current = { renderer, scene, camera, controls, material, geometry };

    const handleResize = () => {
      if (isDisposed || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    requestAnimationFrame(handleResize);
    const timeoutId = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);

    const forward = new THREE.Vector3();

    renderer.setAnimationLoop(() => {
      if (isDisposed) return;
      controls.update();
      renderer.render(scene, camera);

      camera.getWorldDirection(forward);

      for (const { button, position } of markersRef.current) {
        const isVisible = position.clone().sub(camera.position).dot(forward) > 0;
        const projected = position.clone().project(camera);

        button.hidden = !isVisible || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
        button.style.left = `${(projected.x + 1) * 50}%`;
        button.style.top = `${(1 - projected.y) * 50}%`;
      }
    });

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.min(95, Math.max(30, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      isDisposed = true;
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      captureRef.current = null;
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.setAnimationLoop(null);
      controls.dispose();

      markersRef.current.forEach((m) => m.button.remove());
      markersRef.current = [];

      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      apiRef.current = null;
    };
  }, []);

  // 2. Smooth texture swapping when switching rooms (no canvas destruction!)
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !currentPanorama) return;
    setError('');

    let isCancelled = false;
    let mainLoaded = false;
    const loader = new THREE.TextureLoader();

    // If poster image exists, load low-res preview first
    if (currentPanorama.poster) {
      loader.load(
        siteUrl(currentPanorama.poster),
        (posterTex) => {
          if (isCancelled || mainLoaded) {
            posterTex.dispose();
            return;
          }
          posterTex.colorSpace = THREE.SRGBColorSpace;
          const oldTex = api.material.map;
          api.material.map = posterTex;
          api.material.needsUpdate = true;
          if (oldTex && oldTex !== posterTex) {
            oldTex.dispose();
          }
        },
        undefined,
        () => {
          // Poster load failed; non-critical, main texture will load
        }
      );
    }

    // Load full-resolution 360 panorama texture
    loader.load(
      siteUrl(currentPanorama.src),
      (newTexture) => {
        if (isCancelled) {
          newTexture.dispose();
          return;
        }
        mainLoaded = true;
        newTexture.colorSpace = THREE.SRGBColorSpace;
        const oldTex = api.material.map;
        api.material.map = newTexture;
        api.material.needsUpdate = true;
        if (oldTex && oldTex !== newTexture) {
          oldTex.dispose();
        }
      },
      undefined,
      () => {
        if (!isCancelled) {
          setError('Не удалось загрузить панораму. Выберите другую точку.');
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [currentPanorama?.id, currentPanorama?.src, currentPanorama?.poster]);

  // 3. Re-orient camera when switching panoramas to each room's canonical initial view
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !currentPanorama) return;
    const yaw = currentPanorama.initialYaw ?? 0;
    const pitch = currentPanorama.initialPitch ?? 0;
    orientCameraTo(api.camera, api.controls, yaw, pitch);
  }, [currentPanorama?.id, currentPanorama?.initialYaw, currentPanorama?.initialPitch]);

  // 4. Update spatial navigation markers on room switch
  useEffect(() => {
    const container = hostRef.current;
    if (!container || !currentPanorama) return;

    // Remove previous buttons
    markersRef.current.forEach((m) => m.button.remove());
    markersRef.current = [];

    const newMarkers: MarkerItem[] = (currentPanorama.links || []).map((link) => {
      const button = document.createElement('button');
      button.className = 'panorama-marker';
      button.textContent = '↗';
      const targetTitle = panoramas.find((v) => v.id === link.target)?.title || link.target;
      button.setAttribute('aria-label', `Перейти: ${targetTitle}`);
      button.title = button.getAttribute('aria-label') || '';
      button.onclick = () => choose(link.target);
      container.appendChild(button);

      const yaw = THREE.MathUtils.degToRad(link.yaw);
      const pitch = THREE.MathUtils.degToRad(link.pitch);
      const position = new THREE.Vector3(
        20 * Math.sin(yaw) * Math.cos(pitch),
        20 * Math.sin(pitch),
        -20 * Math.cos(yaw) * Math.cos(pitch)
      );

      return { button, position };
    });

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((m) => m.button.remove());
    };
  }, [currentPanorama?.id, currentPanorama?.links, panoramas]);

  const zoomIn = () => {
    if (!apiRef.current) return;
    const cam = apiRef.current.camera;
    cam.fov = Math.max(30, cam.fov - 8);
    cam.updateProjectionMatrix();
  };

  const zoomOut = () => {
    if (!apiRef.current) return;
    const cam = apiRef.current.camera;
    cam.fov = Math.min(95, cam.fov + 8);
    cam.updateProjectionMatrix();
  };

  const resetView = () => {
    if (!apiRef.current) return;
    const { camera, controls } = apiRef.current;
    camera.fov = 70;
    camera.updateProjectionMatrix();
    const yaw = currentPanorama?.initialYaw ?? 0;
    const pitch = currentPanorama?.initialPitch ?? 0;
    orientCameraTo(camera, controls, yaw, pitch);
  };

  const toggleFullscreen = () => {
    const el = hostRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className={`panorama-viewer-root ${inline ? 'is-inline' : 'is-full'}`}>
      {/* Top Bar with scene switching chips */}
      <div className="panorama-top-bar">
        <div className="panorama-chips-container" role="tablist" aria-label="Точки обзора 360°">
          {panoramas.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={currentPanorama?.id === item.id}
              onClick={() => choose(item.id)}
              className={`panorama-scene-chip ${currentPanorama?.id === item.id ? 'is-active' : ''}`}
            >
              <Compass size={14} />
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {onClose && (
          <button
            type="button"
            className="panorama-close-button"
            onClick={onClose}
            aria-label="Закрыть 360-тур"
            title="Закрыть 360-тур"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Canvas Wrap taking all remaining height */}
      <div className="panorama-canvas-wrap">
        <div className="panorama-canvas" ref={hostRef} />

        {/* Floating Controls (Zoom, Reset, Fullscreen) */}
        <div className="panorama-floating-controls">
          <button
            type="button"
            className="panorama-ctrl-btn"
            onClick={zoomIn}
            title="Приблизить (+)"
            aria-label="Приблизить"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="panorama-ctrl-btn"
            onClick={zoomOut}
            title="Отдалить (-)"
            aria-label="Отдалить"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            className="panorama-ctrl-btn"
            onClick={resetView}
            title="Сбросить угол обзора"
            aria-label="Сбросить угол обзора"
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            className="panorama-ctrl-btn"
            onClick={toggleFullscreen}
            title="Во весь экран"
            aria-label="Во весь экран"
          >
            <Maximize size={17} />
          </button>
        </div>

        {/* Subtle Hint Badge at Bottom Center */}
        <div className="panorama-hint-badge">
          <span>Вращайте панораму 360° мышью или пальцем · Колёсико для зума</span>
        </div>

        {error && (
          <div className="panorama-error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
