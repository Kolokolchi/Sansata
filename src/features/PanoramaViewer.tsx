import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { siteUrl } from '../lib/site';
import { Panorama } from '../lib/experience';

interface PanoramaViewerProps {
  panoramas: Panorama[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  captureToken?: number;
}

interface MarkerItem {
  button: HTMLButtonElement;
  position: THREE.Vector3;
}

export function PanoramaViewer({
  panoramas,
  selectedId,
  onSelect,
  captureToken = 0
}: PanoramaViewerProps) {
  const [currentId, setCurrentId] = useState<string>(panoramas[0]?.id || '');
  const choose = (id: string) => {
    setCurrentId(id);
    onSelect?.(id);
  };

  const captureRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (captureToken) captureRef.current?.();
  }, [captureToken]);

  const [error, setError] = useState<string>('');

  const currentPanorama = panoramas.find((p) => p.id === (selectedId || currentId)) || panoramas[0];
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

    // Inverted sphere for 360-degree equirectangular panorama projection
    const geometry = new THREE.SphereGeometry(40, 64, 32);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      if (!container.clientHeight) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

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

    return () => {
      isDisposed = true;
      captureRef.current = null;
      resizeObserver.disconnect();
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

  // 3. Update spatial navigation markers on room switch
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

  return (
    <div>
      <div className="tabs">
        {panoramas.map((item) => (
          <button
            key={item.id}
            onClick={() => choose(item.id)}
            className={currentPanorama?.id === item.id ? 'active' : ''}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="panorama-canvas" ref={hostRef} />

      {error && <p role="alert">{error}</p>}
      <p className="muted-note">
        Вращайте изображение мышью или пальцем. Стрелки и кнопки названий перемещают между точками.
      </p>
    </div>
  );
}
