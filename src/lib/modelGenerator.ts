import * as THREE from 'three';

/**
 * Procedural PBR Texture and Material Generator for ЖК Shattyq
 * Produces high-resolution physically-based textures (albedo, bump, normal, emissive)
 * based on architectural renders and real materials.
 */

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * 1. Travertine / Limestone Stone Cladding Texture
 */
export function createTravertineTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 1024);

  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#f5f0e6');
  grad.addColorStop(0.5, '#eee8dc');
  grad.addColorStop(1, '#e6decb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle natural horizontal strata
  for (let y = 0; y < 1024; y += 6) {
    const alpha = 0.025 + Math.random() * 0.04;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(165, 150, 125, ${alpha})` : `rgba(255, 255, 255, ${alpha * 1.6})`;
    ctx.fillRect(0, y, 1024, 3 + Math.random() * 4);
  }

  // Fine stone grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Architectural stone tile joints
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(125, 115, 100, 0.3)';
  for (let x = 0; x <= 1024; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 2. Decorative Perforated Bronze Lattice Texture
 */
export function createPerforatedLatticeTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 1024);

  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, '#c2a884');
  grad.addColorStop(0.5, '#998363');
  grad.addColorStop(1, '#69573f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.fillStyle = '#241f19';
  const size = 32;
  for (let y = 16; y < 1024; y += size) {
    for (let x = 16; x < 512; x += size) {
      const offsetX = (y / size) % 2 === 0 ? 0 : size / 2;
      ctx.beginPath();
      ctx.roundRect(x + offsetX - 5, y - 10, 10, 20, 4);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 3. Architectural Window Texture with Interior Reflections
 */
export function createWindowGlassTexture(lit: boolean = false): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);

  if (lit) {
    // Warm glowing apartment interior
    const warmGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
    warmGrad.addColorStop(0, '#fff4cc');
    warmGrad.addColorStop(0.5, '#ffcf66');
    warmGrad.addColorStop(1, '#664214');
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Drapes / Curtain silhouettes
    ctx.fillStyle = 'rgba(50, 35, 20, 0.45)';
    ctx.fillRect(15, 15, 95, 482);
    ctx.fillRect(402, 15, 95, 482);
  } else {
    // Daylight sky & reflection
    const skyGrad = ctx.createLinearGradient(0, 0, 512, 512);
    skyGrad.addColorStop(0, '#6287a6');
    skyGrad.addColorStop(0.5, '#415e75');
    skyGrad.addColorStop(1, '#203445');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(320, 180, 160, 60, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 250, 240, 0.22)';
    ctx.fillRect(30, 30, 70, 452);
    ctx.fillRect(412, 30, 70, 452);
  }

  // Dark architectural mullion frame
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#1e2126';
  ctx.strokeRect(7, 7, 498, 498);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 4. Paving Stones Texture
 */
export function createPaverTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#dcd8cf';
  ctx.fillRect(0, 0, 512, 512);

  const pw = 64;
  const ph = 32;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9c9688';

  for (let y = 0; y < 512; y += ph) {
    const shift = (y / ph) % 2 === 0 ? 0 : pw / 2;
    for (let x = -pw; x < 512 + pw; x += pw) {
      const px = x + shift;
      const shade = (Math.random() - 0.5) * 18;
      const r = Math.round(218 + shade);
      const g = Math.round(214 + shade);
      const b = Math.round(204 + shade);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(px + 1, y + 1, pw - 2, ph - 2);
      ctx.strokeRect(px, y, pw, ph);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 5. Tartan / EPDM Geometric Playground Texture
 */
export function createPlaygroundTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 1024);

  ctx.fillStyle = '#1da3b5'; // Teal
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.fillStyle = '#f2643d'; // Coral
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(600, 100);
  ctx.lineTo(800, 700);
  ctx.lineTo(200, 900);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ecb44d'; // Sand
  ctx.beginPath();
  ctx.arc(650, 450, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f5886'; // Cobalt
  ctx.beginPath();
  ctx.moveTo(700, 0);
  ctx.lineTo(1024, 0);
  ctx.lineTo(1024, 500);
  ctx.lineTo(600, 300);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#47b89d'; // Mint
  ctx.beginPath();
  ctx.arc(200, 200, 160, 0, Math.PI * 2);
  ctx.fill();

  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const grain = (Math.random() - 0.5) * 16;
    d[i] = Math.min(255, Math.max(0, d[i] + grain));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + grain));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 6. Generate Realistic Environment Sky Texture & PMREM Target
 */
export function createSkyEnvironment(
  renderer: THREE.WebGLRenderer,
  mode: 'day' | 'golden' | 'night'
): { envMap: THREE.Texture; bgTexture: THREE.CanvasTexture; renderTarget: THREE.WebGLRenderTarget } {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const [canvas, ctx] = createCanvas(2048, 1024);
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);

  if (mode === 'night') {
    grad.addColorStop(0, '#060913');
    grad.addColorStop(0.35, '#0c1426');
    grad.addColorStop(0.7, '#16233d');
    grad.addColorStop(1, '#223250');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 350; i++) {
      const sx = Math.random() * 2048;
      const sy = Math.random() * 600;
      const sr = 0.5 + Math.random() * 1.3;
      ctx.globalAlpha = 0.25 + Math.random() * 0.75;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  } else if (mode === 'golden') {
    grad.addColorStop(0, '#223c60');
    grad.addColorStop(0.3, '#754b5b');
    grad.addColorStop(0.6, '#d87848');
    grad.addColorStop(0.85, '#f5ba68');
    grad.addColorStop(1, '#df9852');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Sunset Glow
    const sunGrad = ctx.createRadialGradient(1400, 680, 20, 1400, 680, 450);
    sunGrad.addColorStop(0, 'rgba(255, 245, 210, 0.95)');
    sunGrad.addColorStop(0.25, 'rgba(255, 175, 85, 0.65)');
    sunGrad.addColorStop(0.7, 'rgba(235, 100, 50, 0.25)');
    sunGrad.addColorStop(1, 'rgba(200, 70, 40, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 2048, 1024);
  } else {
    // Crisp daylight sky
    grad.addColorStop(0, '#3672c4');
    grad.addColorStop(0.35, '#6599e0');
    grad.addColorStop(0.75, '#b4d3f5');
    grad.addColorStop(1, '#e4effa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 8; i++) {
      const cx = 150 + i * 260;
      const cy = 350 + Math.sin(i) * 90;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 140 + Math.random() * 60, 35 + Math.random() * 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const bgTexture = new THREE.CanvasTexture(canvas);
  bgTexture.mapping = THREE.EquirectangularReflectionMapping;
  bgTexture.colorSpace = THREE.SRGBColorSpace;

  const envTarget = pmrem.fromEquirectangular(bgTexture);
  pmrem.dispose();

  return { envMap: envTarget.texture, bgTexture, renderTarget: envTarget };
}
