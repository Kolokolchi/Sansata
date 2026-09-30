import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourceDir = resolve(scriptDir, '../src/sandbox');
const outputDir = resolve(sourceDir, 'hdri');
const layout = JSON.parse(await readFile(resolve(sourceDir, 'greybox-layout.json'), 'utf8'));
const width = 1536;
const height = width / 2;
const previewWidth = 384;
const previewHeight = previewWidth / 2;

function srgbToLinear(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const materials = Object.fromEntries(Object.entries(layout.materials).map(([key, value]) => {
  const hex = value.color.slice(1);
  const channels = [0, 2, 4].map((offset) => srgbToLinear(parseInt(hex.slice(offset, offset + 2), 16)));
  return [key, { channels, emissive: value.emissive || 0 }];
}));

function intersectBox(origin, direction, box) {
  let near = -Infinity;
  let far = Infinity;
  let nearAxis = -1;
  let farAxis = -1;
  let nearSign = 0;
  let farSign = 0;

  for (let axis = 0; axis < 3; axis++) {
    const d = direction[axis];
    if (Math.abs(d) < 1e-9) {
      if (origin[axis] < box.min[axis] || origin[axis] > box.max[axis]) return null;
      continue;
    }
    let t1 = (box.min[axis] - origin[axis]) / d;
    let t2 = (box.max[axis] - origin[axis]) / d;
    let sign1 = -1;
    let sign2 = 1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      [sign1, sign2] = [sign2, sign1];
    }
    if (t1 > near) { near = t1; nearAxis = axis; nearSign = sign1; }
    if (t2 < far) { far = t2; farAxis = axis; farSign = sign2; }
    if (near > far) return null;
  }

  if (far <= 0.0001) return null;
  return near > 0.0001
    ? { t: near, axis: nearAxis, sign: nearSign }
    : { t: far, axis: farAxis, sign: farSign };
}

function trace(origin, direction) {
  let nearest = null;
  let box = null;
  for (const candidate of layout.boxes) {
    const hit = intersectBox(origin, direction, candidate);
    if (hit && (!nearest || hit.t < nearest.t)) { nearest = hit; box = candidate; }
  }
  if (!nearest || !box) return [0.14, 0.17, 0.19];

  const point = origin.map((value, index) => value + direction[index] * nearest.t);
  const normal = [0, 0, 0];
  normal[nearest.axis] = nearest.sign;
  const material = materials[box.material];
  let illumination = 0.56;

  for (const light of layout.lights) {
    const delta = light.position.map((value, index) => value - point[index]);
    const distanceSquared = delta.reduce((sum, value) => sum + value * value, 0);
    const lambert = Math.max(0, delta[nearest.axis] * nearest.sign / Math.sqrt(distanceSquared));
    illumination += light.power * lambert / (distanceSquared + 2.5);
  }

  if (box.material === 'floor' && normal[1] > 0.5) {
    const xEdge = Math.abs(point[0] - Math.round(point[0]));
    const zEdge = Math.abs(point[2] - Math.round(point[2]));
    if (xEdge < 0.008 || zEdge < 0.008) illumination *= 0.7;
  }
  if (box.material === 'wall' && Math.abs(normal[1]) < 0.5) {
    const horizontal = nearest.axis === 0 ? point[2] : point[0];
    if (Math.abs(horizontal - Math.round(horizontal)) < 0.005) illumination *= 0.88;
  }

  const brightness = illumination + material.emissive;
  return material.channels.map((value) => value * brightness);
}

function encodeRgbe(rgb, output, offset) {
  const highest = Math.max(...rgb);
  if (highest < 1e-32) { output.fill(0, offset, offset + 4); return; }
  const exponent = Math.ceil(Math.log2(highest));
  const scale = 256 / 2 ** exponent;
  output[offset] = Math.min(255, Math.floor(rgb[0] * scale));
  output[offset + 1] = Math.min(255, Math.floor(rgb[1] * scale));
  output[offset + 2] = Math.min(255, Math.floor(rgb[2] * scale));
  output[offset + 3] = exponent + 128;
}

function hdrFile(pixels) {
  const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\nEXPOSURE=1.0\n\n-Y ${height} +X ${width}\n`);
  const rows = [header];
  for (let y = 0; y < height; y++) {
    rows.push(Buffer.from([2, 2, width >> 8, width & 255]));
    for (let channel = 0; channel < 4; channel++) {
      const row = Uint8Array.from({ length: width }, (_, x) => pixels[(y * width + x) * 4 + channel]);
      const packets = [];
      const runAt = (x) => {
        let count = 1;
        while (count < 127 && x + count < width && row[x + count] === row[x]) count++;
        return count;
      };
      for (let x = 0; x < width;) {
        const run = runAt(x);
        if (run >= 4) {
          packets.push(128 + run, row[x]);
          x += run;
        } else {
          const start = x++;
          while (x < width && x - start < 128 && runAt(x) < 4) x++;
          packets.push(x - start, ...row.slice(start, x));
        }
      }
      rows.push(Buffer.from(packets));
    }
  }
  return Buffer.concat(rows);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function previewFile(rgb) {
  const stride = previewWidth * 3 + 1;
  const raw = Buffer.alloc(stride * previewHeight);
  for (let y = 0; y < previewHeight; y++) {
    for (let x = 0; x < previewWidth; x++) {
      const srcX = Math.floor(x * width / previewWidth);
      const srcY = Math.floor(y * height / previewHeight);
      const src = (srcY * width + srcX) * 3;
      const dst = y * stride + 1 + x * 3;
      for (let channel = 0; channel < 3; channel++) {
        const mapped = rgb[src + channel] / (1 + rgb[src + channel]);
        raw[dst + channel] = Math.round(255 * mapped ** (1 / 2.2));
      }
    }
  }
  const info = Buffer.alloc(13);
  info.writeUInt32BE(previewWidth, 0);
  info.writeUInt32BE(previewHeight, 4);
  info[8] = 8;
  info[9] = 2;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', info),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

await mkdir(outputDir, { recursive: true });
for (const node of layout.nodes) {
  const hdr = Buffer.alloc(width * height * 4);
  const rgb = new Float32Array(width * height * 3);
  const origin = node.position;
  for (let y = 0; y < height; y++) {
    const pitch = (0.5 - (y + 0.5) / height) * Math.PI;
    const cosPitch = Math.cos(pitch);
    for (let x = 0; x < width; x++) {
      const yaw = ((x + 0.5) / width - 0.75) * Math.PI * 2;
      const direction = [Math.sin(yaw) * cosPitch, Math.sin(pitch), -Math.cos(yaw) * cosPitch];
      const color = trace(origin, direction);
      const pixel = y * width + x;
      rgb.set(color, pixel * 3);
      encodeRgbe(color, hdr, pixel * 4);
    }
  }
  const hdrData = hdrFile(hdr);
  const previewData = previewFile(rgb);
  await Promise.all([
    writeFile(resolve(outputDir, `${node.id}.hdr`), hdrData),
    writeFile(resolve(outputDir, `${node.id}-preview.png`), previewData)
  ]);
  console.log(`${node.id}: ${width}x${height} HDR (${(hdrData.length / 1048576).toFixed(1)} MiB), ${previewWidth}x${previewHeight} preview`);
}
