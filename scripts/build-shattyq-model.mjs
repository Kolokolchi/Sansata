import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

// Polyfill FileReader for Node.js environment
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
      if (this.onloadend) this.onloadend();
    });
  }
};

const OUTPUT_DIR = path.resolve('public/models');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'shattyq_complex.glb');

console.log('🏗️  Building high-fidelity photorealistic Shattyq 3D complex model...');

const scene = new THREE.Scene();
scene.name = 'Shattyq_Complex_Scene';

// --- Color Palette based on Sensata Shattyq Architectural Photos ---
const cTravertine = 0xf3efe6; // Warm light limestone
const cTravertineShade = 0xe0dbcc; // Inset panels
const cTravertineCornice = 0xd5cfbd; // Horizontal ledges
const cBronzeOrnament = 0xb29a76; // Perforated Kazakh/modern lattice panels
const cDarkBronze = 0x3a352e; // Window profiles and mullions
const cCharcoalTrim = 0x222428; // Architectural accents & parapets
const cGlassDay = 0x3d5668; // Tinted reflective glazing
const cGlassLit = 0xffdf96; // Glowing night apartment window
const cGlassStorefront = 0x243747; // Commercial panoramic glass
const cPodiumStone = 0xebe6db; // Stylobate facade
const cPaverLight = 0xd8d4cb; // Pedestrian sidewalk pavers
const cPaverDark = 0xb4afa5; // Curbs and borders
const cAsphalt = 0x36383d; // Road surface
const cRoadMarking = 0xffffff; // Road striping
const cGrass = 0x547a46; // Lawn
const cFoliage1 = 0x3c6934; // Deep green leaves
const cFoliage2 = 0x518844; // Bright green leaves
const cFoliage3 = 0x2d5227; // Olive evergreen
const cHydrangea = 0xf5f7f2; // White hydrangea flowers
const cLavender = 0x8878b4; // Purple lavender mounds
const cWoodWarm = 0x855734; // Cedar/Teak park bench wood
const cSteelDark = 0x272b30; // Dark powder-coated steel
const cSteelSilver = 0xc6cbd1; // Stainless steel
const cGlassRailing = 0x7694a8; // Balustrade glass
const cPlayTeal = 0x1ca3b6; // EPDM Turquoise
const cPlayCoral = 0xf1633d; // EPDM Coral / Terracotta
const cPlaySand = 0xedb449; // EPDM Sand Yellow
const cPlayCobalt = 0x2d5584; // EPDM Cobalt Blue
const cPlayMint = 0x44b89c; // EPDM Mint
const cCarWhite = 0xf8f9fa;
const cCarBlack = 0x1a1b1e;
const cCarBlue = 0x1d3d70;
const cCarRed = 0x942224;

function createMat(params) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.1,
    ...params
  });
}

const matTravertine = createMat({ color: cTravertine, roughness: 0.7, metalness: 0.04 });
const matTravertineShade = createMat({ color: cTravertineShade, roughness: 0.75, metalness: 0.04 });
const matTravertineCornice = createMat({ color: cTravertineCornice, roughness: 0.72, metalness: 0.06 });
const matPerforatedLattice = createMat({ color: cBronzeOrnament, roughness: 0.42, metalness: 0.45 });
const matCharcoal = createMat({ color: cCharcoalTrim, roughness: 0.45, metalness: 0.35 });
const matDarkBronze = createMat({ color: cDarkBronze, roughness: 0.38, metalness: 0.55 });
const matGlass = createMat({ color: cGlassDay, roughness: 0.12, metalness: 0.88, transparent: true, opacity: 0.9 });
const matGlassLit = createMat({ color: cGlassLit, roughness: 0.2, metalness: 0.3, emissive: 0xffcc66, emissiveIntensity: 0.75 });
const matCafeGlass = createMat({ color: cGlassStorefront, roughness: 0.1, metalness: 0.85, emissive: 0x4a3418, emissiveIntensity: 0.35 });
const matPodium = createMat({ color: cPodiumStone, roughness: 0.75, metalness: 0.05 });
const matPaver = createMat({ color: cPaverLight, roughness: 0.85, metalness: 0.02 });
const matPaverDark = createMat({ color: cPaverDark, roughness: 0.88, metalness: 0.02 });
const matAsphalt = createMat({ color: cAsphalt, roughness: 0.92, metalness: 0.04 });
const matRoadMarking = createMat({ color: cRoadMarking, roughness: 0.5, metalness: 0.0 });
const matGrass = createMat({ color: cGrass, roughness: 0.95, metalness: 0.0 });
const matFoliage1 = createMat({ color: cFoliage1, roughness: 0.85, metalness: 0.0 });
const matFoliage2 = createMat({ color: cFoliage2, roughness: 0.85, metalness: 0.0 });
const matFoliage3 = createMat({ color: cFoliage3, roughness: 0.85, metalness: 0.0 });
const matHydrangea = createMat({ color: cHydrangea, roughness: 0.9, metalness: 0.0 });
const matLavender = createMat({ color: cLavender, roughness: 0.9, metalness: 0.0 });
const matWood = createMat({ color: cWoodWarm, roughness: 0.62, metalness: 0.05 });
const matSteelDark = createMat({ color: cSteelDark, roughness: 0.35, metalness: 0.75 });
const matSteelSilver = createMat({ color: cSteelSilver, roughness: 0.25, metalness: 0.9 });
const matGlassRailing = createMat({ color: cGlassRailing, roughness: 0.08, metalness: 0.92, transparent: true, opacity: 0.68 });
const matPlayTeal = createMat({ color: cPlayTeal, roughness: 0.92, metalness: 0.0 });
const matPlayCoral = createMat({ color: cPlayCoral, roughness: 0.92, metalness: 0.0 });
const matPlaySand = createMat({ color: cPlaySand, roughness: 0.92, metalness: 0.0 });
const matPlayCobalt = createMat({ color: cPlayCobalt, roughness: 0.92, metalness: 0.0 });
const matPlayMint = createMat({ color: cPlayMint, roughness: 0.92, metalness: 0.0 });
const matNeonSign = createMat({ color: 0xfffaee, emissive: 0xffeedd, emissiveIntensity: 1.5, roughness: 0.2 });

function addBox(w, h, d, x, y, z, mat, parent = scene, name = '') {
  const geom = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addCylinder(rTop, rBot, h, segs, x, y, z, mat, parent = scene, name = '') {
  const geom = new THREE.CylinderGeometry(rTop, rBot, h, segs);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addSphere(r, detail, x, y, z, mat, parent = scene, name = '') {
  const geom = new THREE.IcosahedronGeometry(r, detail);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

// ==========================================
// 1. SITE & STREETSCAPE
// ==========================================
const siteGroup = new THREE.Group();
siteGroup.name = 'Site_and_Landscape';
scene.add(siteGroup);

addBox(150, 0.8, 130, 0, -0.4, 0, matPaverDark, siteGroup, 'Base_Ground');
addBox(150, 0.2, 30, 0, 0.02, 42, matAsphalt, siteGroup, 'Avenue_Asphalt');

for (let i = -7; i <= 7; i++) {
  addBox(4.5, 0.02, 0.25, i * 10, 0.14, 42, matRoadMarking, siteGroup);
}
for (let k = -4; k <= 4; k++) {
  addBox(0.85, 0.02, 5.5, -24 + k * 1.5, 0.14, 42, matRoadMarking, siteGroup);
  addBox(0.85, 0.02, 5.5, 24 + k * 1.5, 0.14, 42, matRoadMarking, siteGroup);
}
addBox(150, 0.35, 0.35, 0, 0.18, 26.8, matPaverDark, siteGroup);
addBox(150, 0.35, 0.35, 0, 0.18, 57.2, matPaverDark, siteGroup);

addBox(146, 0.3, 17.6, 0, 0.16, 17.8, matPaver, siteGroup, 'Boulevard_Pavement');

addBox(26, 0.32, 2.8, -40, 0.18, 23.5, matGrass, siteGroup);
addBox(26, 0.32, 2.8, 40, 0.18, 23.5, matGrass, siteGroup);
addBox(34, 0.32, 2.8, 0, 0.18, 23.5, matGrass, siteGroup);

// ==========================================
// 2. COMMERCIAL STYLOBATE & ENTRANCES
// ==========================================
const stylobateGroup = new THREE.Group();
stylobateGroup.name = 'Commercial_Stylobate';
scene.add(stylobateGroup);

const PODIUM_H = 4.4;
const PODIUM_W = 76;
const PODIUM_D = 50;
const PODIUM_X = 0;
const PODIUM_Z = -5;

addBox(PODIUM_W, PODIUM_H, PODIUM_D, PODIUM_X, PODIUM_H / 2, PODIUM_Z, matPodium, stylobateGroup, 'Stylobate_Core');

const frontZ = PODIUM_Z + PODIUM_D / 2 + 0.1;
for (let x = -36; x <= 36; x += 6.0) {
  addBox(1.0, PODIUM_H + 0.2, 1.0, x, PODIUM_H / 2, frontZ, matTravertine, stylobateGroup);
  addBox(0.8, PODIUM_H - 0.2, 0.1, x, PODIUM_H / 2, frontZ + 0.46, matTravertineShade, stylobateGroup);
}
addBox(PODIUM_W + 0.8, 0.7, 1.3, PODIUM_X, PODIUM_H - 0.2, frontZ, matTravertineCornice, stylobateGroup);
addBox(PODIUM_W + 0.6, 0.35, 1.1, PODIUM_X, 0.2, frontZ, matTravertineCornice, stylobateGroup);

for (let i = 0; i < 12; i++) {
  const bayX = -33.0 + i * 6.0;
  addBox(5.0, 3.2, 0.15, bayX, 2.0, frontZ - 0.15, matCafeGlass, stylobateGroup, `Storefront_Glass_${i}`);
  addBox(0.08, 3.2, 0.25, bayX - 1.25, 2.0, frontZ - 0.14, matDarkBronze, stylobateGroup);
  addBox(0.08, 3.2, 0.25, bayX + 1.25, 2.0, frontZ - 0.14, matDarkBronze, stylobateGroup);
  addBox(5.0, 0.08, 0.25, bayX, 2.8, frontZ - 0.14, matDarkBronze, stylobateGroup);

  if (i === 2) {
    addBox(3.4, 0.5, 0.2, bayX, 3.75, frontZ + 0.12, matCharcoal, stylobateGroup);
    addBox(2.2, 0.28, 0.25, bayX, 3.75, frontZ + 0.15, matNeonSign, stylobateGroup, 'Sign_COFFEE');
  } else if (i === 3) {
    addBox(3.0, 0.5, 0.2, bayX, 3.75, frontZ + 0.12, matCharcoal, stylobateGroup);
    addBox(1.8, 0.28, 0.25, bayX, 3.75, frontZ + 0.15, matNeonSign, stylobateGroup, 'Sign_CAFE');
  } else if (i === 8) {
    addBox(3.8, 0.5, 0.2, bayX, 3.75, frontZ + 0.12, matCharcoal, stylobateGroup);
    addBox(2.6, 0.28, 0.25, bayX, 3.75, frontZ + 0.15, matNeonSign, stylobateGroup, 'Sign_SHATTYQ_LOBBY');
  } else if (i === 10) {
    addBox(3.2, 0.5, 0.2, bayX, 3.75, frontZ + 0.12, matCharcoal, stylobateGroup);
    addBox(2.0, 0.28, 0.25, bayX, 3.75, frontZ + 0.15, matNeonSign, stylobateGroup, 'Sign_MINIMARKET');
  }
}

function createEntrancePortal(x, z, sectionNum) {
  const pGroup = new THREE.Group();
  pGroup.name = `Entrance_Portal_Sec_${sectionNum}`;
  addBox(4.8, 3.6, 1.4, x, 1.8, z + 0.4, matCharcoal, pGroup);
  addBox(3.8, 3.2, 1.5, x, 1.6, z + 0.4, matTravertine, pGroup);
  addBox(2.8, 2.7, 0.1, x, 1.4, z + 0.2, matGlass, pGroup);
  addBox(0.08, 2.7, 0.18, x, 1.4, z + 0.22, matDarkBronze, pGroup);
  addBox(5.6, 0.25, 2.4, x, 3.75, z + 1.2, matCharcoal, pGroup);
  addBox(5.3, 0.08, 2.2, x, 3.65, z + 1.2, matNeonSign, pGroup);
  stylobateGroup.add(pGroup);
}
createEntrancePortal(-18.5, frontZ, 1);
createEntrancePortal(18.5, frontZ, 2);

const terraceY = PODIUM_H;
addBox(PODIUM_W + 0.2, 1.1, 0.1, PODIUM_X, terraceY + 0.55, PODIUM_Z + PODIUM_D / 2, matGlassRailing, stylobateGroup, 'Railing_Front');
addBox(PODIUM_W + 0.2, 1.1, 0.1, PODIUM_X, terraceY + 0.55, PODIUM_Z - PODIUM_D / 2, matGlassRailing, stylobateGroup, 'Railing_Back');
addBox(0.1, 1.1, PODIUM_D, PODIUM_X - PODIUM_W / 2, terraceY + 0.55, PODIUM_Z, matGlassRailing, stylobateGroup, 'Railing_Left');
addBox(0.1, 1.1, PODIUM_D, PODIUM_X + PODIUM_W / 2, terraceY + 0.55, PODIUM_Z, matGlassRailing, stylobateGroup, 'Railing_Right');

addBox(PODIUM_W + 0.4, 0.08, 0.12, PODIUM_X, terraceY + 1.1, PODIUM_Z + PODIUM_D / 2, matSteelSilver, stylobateGroup);
addBox(PODIUM_W + 0.4, 0.08, 0.12, PODIUM_X, terraceY + 1.1, PODIUM_Z - PODIUM_D / 2, matSteelSilver, stylobateGroup);
addBox(0.12, 0.08, PODIUM_D + 0.2, PODIUM_X - PODIUM_W / 2, terraceY + 1.1, PODIUM_Z, matSteelSilver, stylobateGroup);
addBox(0.12, 0.08, PODIUM_D + 0.2, PODIUM_X + PODIUM_W / 2, terraceY + 1.1, PODIUM_Z, matSteelSilver, stylobateGroup);

// ==========================================
// 3. RESIDENTIAL TOWERS (SECTION 1 & SECTION 2)
// ==========================================
const FLOOR_H = 3.2;
const TOWER_W = 25.6;
const TOWER_D = 16.8;
const NUM_FLOORS = 9;

// Random seed generator for lit windows
let rngSeed = 42;
function pseudoRandom() {
  rngSeed = (rngSeed * 9301 + 49297) % 233280;
  return rngSeed / 233280;
}

function buildTowerFloor(sectionNum, floorNum, posX, posZ) {
  const floorGroup = new THREE.Group();
  const floorName = `Section_${sectionNum}_Floor_${floorNum}`;
  floorGroup.name = floorName;
  floorGroup.userData = { section: sectionNum, floor: floorNum, name: `Секция ${sectionNum}, Этаж ${floorNum}` };

  const floorBaseY = PODIUM_H + (floorNum - 1) * FLOOR_H;
  const floorCenterY = floorBaseY + FLOOR_H / 2;

  const slabCore = addBox(TOWER_W, FLOOR_H - 0.08, TOWER_D, posX, floorCenterY, posZ, matTravertine, floorGroup, `Slab_${floorName}`);
  slabCore.userData = { section: sectionNum, floor: floorNum };

  addBox(TOWER_W + 0.4, 0.26, TOWER_D + 0.4, posX, floorBaseY + FLOOR_H, posZ, matTravertineCornice, floorGroup);

  const numBaysX = 6;
  const baySpacingX = TOWER_W / numBaysX;

  for (let b = 0; b <= numBaysX; b++) {
    const colX = posX - TOWER_W / 2 + b * baySpacingX;
    addBox(0.58, FLOOR_H + 0.02, 0.42, colX, floorCenterY, posZ + TOWER_D / 2 + 0.16, matTravertine, floorGroup);
    addBox(0.58, FLOOR_H + 0.02, 0.42, colX, floorCenterY, posZ - TOWER_D / 2 - 0.16, matTravertine, floorGroup);
  }

  for (let b = 0; b < numBaysX; b++) {
    const bayCenterX = posX - TOWER_W / 2 + (b + 0.5) * baySpacingX;
    const isOrnamentalBay = (b === 2 || b === 4);
    const isLitWindow = pseudoRandom() > 0.55;

    const winFront = addBox(
      baySpacingX - 0.65,
      FLOOR_H - 0.65,
      0.12,
      bayCenterX,
      floorCenterY,
      posZ + TOWER_D / 2 + 0.08,
      isLitWindow ? matGlassLit : matGlass,
      floorGroup,
      `Win_Front_${sectionNum}_${floorNum}_${b}`
    );
    winFront.userData = { section: sectionNum, floor: floorNum, lit: isLitWindow };

    addBox(baySpacingX - 0.55, 0.1, 0.35, bayCenterX, floorBaseY + 0.25, posZ + TOWER_D / 2 + 0.15, matDarkBronze, floorGroup);
    addBox(baySpacingX - 0.55, 0.1, 0.35, bayCenterX, floorBaseY + FLOOR_H - 0.25, posZ + TOWER_D / 2 + 0.15, matDarkBronze, floorGroup);

    if (isOrnamentalBay) {
      addBox(0.95, FLOOR_H - 0.65, 0.18, bayCenterX - (baySpacingX / 2 - 0.8), floorCenterY, posZ + TOWER_D / 2 + 0.15, matPerforatedLattice, floorGroup);
    }

    const isBackLit = pseudoRandom() > 0.6;
    const winBack = addBox(
      baySpacingX - 0.65,
      FLOOR_H - 0.65,
      0.12,
      bayCenterX,
      floorCenterY,
      posZ - TOWER_D / 2 - 0.08,
      isBackLit ? matGlassLit : matGlass,
      floorGroup,
      `Win_Back_${sectionNum}_${floorNum}_${b}`
    );
    winBack.userData = { section: sectionNum, floor: floorNum, lit: isBackLit };

    addBox(baySpacingX - 0.55, 0.1, 0.35, bayCenterX, floorBaseY + 0.25, posZ - TOWER_D / 2 - 0.15, matDarkBronze, floorGroup);
  }

  const numBaysZ = 4;
  const baySpacingZ = TOWER_D / numBaysZ;
  for (let bz = 0; bz <= numBaysZ; bz++) {
    const colZ = posZ - TOWER_D / 2 + bz * baySpacingZ;
    addBox(0.42, FLOOR_H + 0.02, 0.58, posX + TOWER_W / 2 + 0.16, floorCenterY, colZ, matTravertine, floorGroup);
    addBox(0.42, FLOOR_H + 0.02, 0.58, posX - TOWER_W / 2 - 0.16, floorCenterY, colZ, matTravertine, floorGroup);
  }
  for (let bz = 0; bz < numBaysZ; bz++) {
    const bayCenterZ = posZ - TOWER_D / 2 + (bz + 0.5) * baySpacingZ;
    const isEastLit = pseudoRandom() > 0.65;
    const winEast = addBox(0.12, FLOOR_H - 0.65, baySpacingZ - 0.65, posX + TOWER_W / 2 + 0.08, floorCenterY, bayCenterZ, isEastLit ? matGlassLit : matGlass, floorGroup);
    winEast.userData = { section: sectionNum, floor: floorNum, lit: isEastLit };

    const isWestLit = pseudoRandom() > 0.65;
    const winWest = addBox(0.12, FLOOR_H - 0.65, baySpacingZ - 0.65, posX - TOWER_W / 2 - 0.08, floorCenterY, bayCenterZ, isWestLit ? matGlassLit : matGlass, floorGroup);
    winWest.userData = { section: sectionNum, floor: floorNum, lit: isWestLit };
  }

  // Panoramic corner balcony glazing
  addBox(0.14, FLOOR_H - 0.6, 2.2, posX + TOWER_W / 2 - 0.02, floorCenterY, posZ + TOWER_D / 2 - 1.1, matGlass, floorGroup);
  addBox(2.2, FLOOR_H - 0.6, 0.14, posX + TOWER_W / 2 - 1.1, floorCenterY, posZ + TOWER_D / 2 - 0.02, matGlass, floorGroup);

  scene.add(floorGroup);
  return floorGroup;
}

const sec1X = -18.5;
const sec1Z = -4.0;
const sec2X = 18.5;
const sec2Z = -4.0;

for (let f = 1; f <= NUM_FLOORS; f++) {
  buildTowerFloor(1, f, sec1X, sec1Z);
  buildTowerFloor(2, f, sec2X, sec2Z);
}

function buildRoofStructures(sectionNum, posX, posZ) {
  const roofY = PODIUM_H + NUM_FLOORS * FLOOR_H;
  const roofGroup = new THREE.Group();
  roofGroup.name = `Roof_Section_${sectionNum}`;

  addBox(TOWER_W + 0.6, 1.2, 0.4, posX, roofY + 0.6, posZ + TOWER_D / 2, matTravertineCornice, roofGroup);
  addBox(TOWER_W + 0.6, 1.2, 0.4, posX, roofY + 0.6, posZ - TOWER_D / 2, matTravertineCornice, roofGroup);
  addBox(0.4, 1.2, TOWER_D, posX + TOWER_W / 2, roofY + 0.6, posZ, matTravertineCornice, roofGroup);
  addBox(0.4, 1.2, TOWER_D, posX - TOWER_W / 2, roofY + 0.6, posZ, matTravertineCornice, roofGroup);

  addBox(TOWER_W + 0.8, 0.15, 0.6, posX, roofY + 1.25, posZ + TOWER_D / 2, matCharcoal, roofGroup);
  addBox(TOWER_W + 0.8, 0.15, 0.6, posX, roofY + 1.25, posZ - TOWER_D / 2, matCharcoal, roofGroup);
  addBox(0.6, 0.15, TOWER_D + 0.4, posX + TOWER_W / 2, roofY + 1.25, posZ, matCharcoal, roofGroup);
  addBox(0.6, 0.15, TOWER_D + 0.4, posX - TOWER_W / 2, roofY + 1.25, posZ, matCharcoal, roofGroup);

  addBox(7.2, 3.2, 6.0, posX - 3, roofY + 1.6, posZ, matCharcoal, roofGroup);
  addBox(7.4, 0.3, 6.2, posX - 3, roofY + 3.3, posZ, matTravertineCornice, roofGroup);

  addBox(2.8, 1.6, 2.2, posX + 4.5, roofY + 0.8, posZ + 3.0, matSteelDark, roofGroup);
  addBox(2.8, 1.6, 2.2, posX + 4.5, roofY + 0.8, posZ - 3.0, matSteelDark, roofGroup);
  addCylinder(0.4, 0.4, 1.8, 12, posX + 7.5, roofY + 0.9, posZ, matSteelSilver, roofGroup);

  scene.add(roofGroup);
}
buildRoofStructures(1, sec1X, sec1Z);
buildRoofStructures(2, sec2X, sec2Z);

// ==========================================
// 4. ELEVATED COURTYARD & PLAYGROUND
// ==========================================
const courtyardGroup = new THREE.Group();
courtyardGroup.name = 'Elevated_Courtyard_Landscape';
scene.add(courtyardGroup);

const courtBaseY = PODIUM_H + 0.05;

addBox(PODIUM_W - 0.8, 0.1, PODIUM_D - 0.8, PODIUM_X, courtBaseY, PODIUM_Z, matPaver, courtyardGroup, 'Courtyard_Floor');

addBox(22, 0.12, 14, 0, courtBaseY + 0.02, 3, matPlayTeal, courtyardGroup, 'EPDM_Teal');
addBox(14, 0.13, 10, -4, courtBaseY + 0.03, 5, matPlayCoral, courtyardGroup, 'EPDM_Coral');
addBox(9, 0.14, 8, 5, courtBaseY + 0.04, 2, matPlaySand, courtyardGroup, 'EPDM_Sand');
addBox(8, 0.14, 7, -5, courtBaseY + 0.04, 0, matPlayCobalt, courtyardGroup, 'EPDM_Cobalt');
addBox(7, 0.14, 6, 6, courtBaseY + 0.04, 6, matPlayMint, courtyardGroup, 'EPDM_Mint');

// Children's Play Tower Fortress
const playTowerX = -2.5;
const playTowerZ = 3.5;
const towerGroup = new THREE.Group();
towerGroup.name = 'Play_Tower_Complex';

for (let dx of [-1.2, 1.2]) {
  for (let dz of [-1.2, 1.2]) {
    addCylinder(0.08, 0.08, 4.4, 8, playTowerX + dx, courtBaseY + 2.2, playTowerZ + dz, matWood, towerGroup);
  }
}
addBox(2.6, 0.15, 2.6, playTowerX, courtBaseY + 1.2, playTowerZ, matWood, towerGroup);
addBox(2.6, 0.15, 2.6, playTowerX, courtBaseY + 2.4, playTowerZ, matWood, towerGroup);
addBox(2.6, 0.7, 0.06, playTowerX, courtBaseY + 2.8, playTowerZ + 1.25, matSteelDark, towerGroup);
addBox(2.6, 0.7, 0.06, playTowerX, courtBaseY + 2.8, playTowerZ - 1.25, matSteelDark, towerGroup);

const roofGeom = new THREE.ConeGeometry(2.2, 1.4, 4);
const roofMesh = new THREE.Mesh(roofGeom, matPlayCobalt);
roofMesh.position.set(playTowerX, courtBaseY + 4.9, playTowerZ);
roofMesh.rotation.y = Math.PI / 4;
roofMesh.castShadow = true;
towerGroup.add(roofMesh);

const slideMesh = addBox(0.9, 0.25, 3.8, playTowerX + 1.8, courtBaseY + 1.2, playTowerZ + 1.8, matPlaySand, towerGroup);
slideMesh.rotation.x = -Math.PI / 5;
slideMesh.rotation.y = Math.PI / 6;

addBox(3.2, 0.1, 0.9, playTowerX + 2.8, courtBaseY + 1.2, playTowerZ, matWood, towerGroup);
addBox(1.8, 2.4, 1.8, playTowerX + 4.6, courtBaseY + 1.2, playTowerZ, matWood, towerGroup);
addBox(2.2, 0.15, 2.2, playTowerX + 4.6, courtBaseY + 2.4, playTowerZ, matPlayCoral, towerGroup);
courtyardGroup.add(towerGroup);

// Swings
const swingGroup = new THREE.Group();
swingGroup.name = 'Swing_Set';
const swingX = 7.0;
const swingZ = 4.0;
addCylinder(0.06, 0.06, 3.2, 8, swingX - 2.2, courtBaseY + 1.5, swingZ, matSteelDark, swingGroup);
addCylinder(0.06, 0.06, 3.2, 8, swingX + 2.2, courtBaseY + 1.5, swingZ, matSteelDark, swingGroup);
addBox(4.8, 0.1, 0.1, swingX, courtBaseY + 3.0, swingZ, matSteelSilver, swingGroup);
for (let s of [-1.0, 1.0]) {
  addCylinder(0.015, 0.015, 2.0, 6, swingX + s - 0.25, courtBaseY + 1.9, swingZ, matSteelSilver, swingGroup);
  addCylinder(0.015, 0.015, 2.0, 6, swingX + s + 0.25, courtBaseY + 1.9, swingZ, matSteelSilver, swingGroup);
  addBox(0.65, 0.05, 0.28, swingX + s, courtBaseY + 0.85, swingZ, matWood, swingGroup);
}
courtyardGroup.add(swingGroup);

// Carousel
const carouselGroup = new THREE.Group();
carouselGroup.name = 'Playground_Carousel';
addCylinder(1.2, 1.2, 0.08, 16, -6.5, courtBaseY + 0.18, 5.5, matPlayTeal, carouselGroup);
addCylinder(0.06, 0.06, 0.9, 8, -6.5, courtBaseY + 0.55, 5.5, matSteelSilver, carouselGroup);
courtyardGroup.add(carouselGroup);

// Sandbox
const sandboxGroup = new THREE.Group();
sandboxGroup.name = 'Playground_Sandbox';
addBox(3.4, 0.35, 3.4, 5.5, courtBaseY + 0.18, -4.5, matWood, sandboxGroup);
addBox(3.0, 0.25, 3.0, 5.5, courtBaseY + 0.15, -4.5, matPlaySand, sandboxGroup);
courtyardGroup.add(sandboxGroup);

// Workout
const workoutGroup = new THREE.Group();
workoutGroup.name = 'Workout_Zone';
const fitX = -7.5;
const fitZ = -4.5;
addBox(6.0, 0.12, 5.0, fitX, courtBaseY + 0.03, fitZ, matPlayCobalt, workoutGroup);
addCylinder(0.05, 0.05, 2.7, 8, fitX - 1.6, courtBaseY + 1.35, fitZ, matSteelSilver, workoutGroup);
addCylinder(0.05, 0.05, 2.7, 8, fitX, courtBaseY + 1.35, fitZ, matSteelSilver, workoutGroup);
addCylinder(0.05, 0.05, 2.7, 8, fitX + 1.6, courtBaseY + 1.35, fitZ, matSteelSilver, workoutGroup);
addBox(3.4, 0.06, 0.06, fitX, courtBaseY + 2.55, fitZ, matSteelSilver, workoutGroup);
addCylinder(0.04, 0.04, 1.2, 8, fitX - 1.2, courtBaseY + 0.6, fitZ + 1.5, matSteelSilver, workoutGroup);
addCylinder(0.04, 0.04, 1.2, 8, fitX - 1.2, courtBaseY + 0.6, fitZ + 0.9, matSteelSilver, workoutGroup);
addBox(0.06, 0.06, 0.7, fitX - 1.2, courtBaseY + 1.15, fitZ + 1.2, matSteelSilver, workoutGroup);
courtyardGroup.add(workoutGroup);

// ==========================================
// 5. VEGETATION, TREES & FLOWERBEDS
// ==========================================
const vegGroup = new THREE.Group();
vegGroup.name = 'Landscaping_and_Vegetation';
scene.add(vegGroup);

function createDetailedTree(x, y, z, scale = 1, foliageMat = matFoliage1) {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.scale.setScalar(scale);

  addCylinder(0.18, 0.28, 3.6, 8, 0, 1.8, 0, matWood, tree);

  addSphere(1.8, 2, 0, 4.2, 0, foliageMat, tree);
  addSphere(1.4, 2, 0.8, 3.6, 0.6, foliageMat === matFoliage1 ? matFoliage2 : matFoliage1, tree);
  addSphere(1.3, 2, -0.7, 3.8, -0.5, foliageMat === matFoliage1 ? matFoliage3 : matFoliage2, tree);
  addSphere(1.1, 2, 0.2, 4.9, -0.4, foliageMat, tree);

  vegGroup.add(tree);
  return tree;
}

createDetailedTree(-11, courtBaseY, 6.5, 0.95, matFoliage1);
createDetailedTree(-11, courtBaseY, -1.0, 1.05, matFoliage2);
createDetailedTree(11, courtBaseY, 6.5, 0.95, matFoliage2);
createDetailedTree(11, courtBaseY, -1.0, 1.05, matFoliage1);
createDetailedTree(0, courtBaseY, -8.0, 1.1, matFoliage3);
createDetailedTree(-7, courtBaseY, 11.0, 0.85, matFoliage2);
createDetailedTree(7, courtBaseY, 11.0, 0.85, matFoliage1);

for (let bx = -50; bx <= 50; bx += 14) {
  if (Math.abs(bx) > 5) {
    createDetailedTree(bx, 0.16, 23.5, 1.2, bx % 28 === 0 ? matFoliage1 : matFoliage2);
  }
}
createDetailedTree(-48, 0.16, 5, 1.3, matFoliage3);
createDetailedTree(-48, 0.16, -15, 1.25, matFoliage1);
createDetailedTree(48, 0.16, 5, 1.3, matFoliage2);
createDetailedTree(48, 0.16, -15, 1.25, matFoliage3);

function createFlowerBed(x, y, z, w, d) {
  const bed = new THREE.Group();
  bed.position.set(x, y, z);
  addBox(w, 0.18, d, 0, 0.09, 0, matGrass, bed);
  addBox(w + 0.2, 0.25, 0.12, 0, 0.12, d / 2, matPaverDark, bed);
  addBox(w + 0.2, 0.25, 0.12, 0, 0.12, -d / 2, matPaverDark, bed);
  addBox(0.12, 0.25, d, w / 2, 0.12, 0, matPaverDark, bed);
  addBox(0.12, 0.25, d, -w / 2, 0.12, 0, matPaverDark, bed);

  for (let fx = -w / 2 + 0.6; fx <= w / 2 - 0.6; fx += 1.0) {
    for (let fz = -d / 2 + 0.6; fz <= d / 2 - 0.6; fz += 1.0) {
      const isLav = Math.random() > 0.45;
      const r = 0.25 + Math.random() * 0.15;
      addSphere(r, 1, fx + (Math.random() - 0.5) * 0.3, 0.3 + r / 2, fz + (Math.random() - 0.5) * 0.3, isLav ? matLavender : matHydrangea, bed);
    }
  }
  vegGroup.add(bed);
}

createFlowerBed(-9, courtBaseY, 2.0, 3.6, 2.2);
createFlowerBed(9, courtBaseY, 2.0, 3.6, 2.2);
createFlowerBed(0, courtBaseY, 8.5, 6.0, 2.0);
createFlowerBed(-32, 0.16, 21.0, 6.0, 2.0);
createFlowerBed(32, 0.16, 21.0, 6.0, 2.0);

// ==========================================
// 6. URBAN FURNITURE, BENCHES, CAFE & CARS
// ==========================================
const propsGroup = new THREE.Group();
propsGroup.name = 'Urban_Furniture_and_Props';
scene.add(propsGroup);

function createBench(x, y, z, rotY = 0) {
  const bench = new THREE.Group();
  bench.position.set(x, y, z);
  bench.rotation.y = rotY;

  addBox(2.2, 0.06, 0.5, 0, 0.45, 0, matWood, bench);
  addBox(2.2, 0.45, 0.06, 0, 0.72, -0.22, matWood, bench);
  addBox(0.06, 0.45, 0.52, -0.9, 0.22, 0, matSteelDark, bench);
  addBox(0.06, 0.45, 0.52, 0.9, 0.22, 0, matSteelDark, bench);

  propsGroup.add(bench);
}

createBench(-4, courtBaseY, -1.5, 0);
createBench(4, courtBaseY, -1.5, 0);
createBench(-9.5, courtBaseY, 5.5, Math.PI / 2);
createBench(9.5, courtBaseY, 5.5, -Math.PI / 2);
createBench(-1.5, courtBaseY, 9.8, Math.PI);
createBench(1.5, courtBaseY, 9.8, Math.PI);

createBench(-24, 0.16, 21.5, 0);
createBench(24, 0.16, 21.5, 0);

function createCafeTable(x, y, z) {
  const table = new THREE.Group();
  table.position.set(x, y, z);
  addCylinder(0.55, 0.55, 0.05, 16, 0, 0.75, 0, matWood, table);
  addCylinder(0.04, 0.04, 0.75, 8, 0, 0.375, 0, matSteelDark, table);
  addCylinder(0.28, 0.28, 0.02, 12, 0, 0.01, 0, matSteelDark, table);

  for (let rot of [0, Math.PI]) {
    const chair = new THREE.Group();
    chair.position.set(Math.sin(rot) * 0.7, 0, Math.cos(rot) * 0.7);
    chair.rotation.y = rot + Math.PI;
    addBox(0.42, 0.04, 0.4, 0, 0.45, 0, matWood, chair);
    addBox(0.42, 0.42, 0.04, 0, 0.68, -0.18, matWood, chair);
    addCylinder(0.02, 0.02, 0.45, 6, -0.18, 0.22, 0.18, matSteelDark, chair);
    addCylinder(0.02, 0.02, 0.45, 6, 0.18, 0.22, 0.18, matSteelDark, chair);
    table.add(chair);
  }

  addCylinder(0.035, 0.035, 2.6, 8, 0, 1.3, 0, matWood, table);
  const canopyGeom = new THREE.ConeGeometry(1.6, 0.65, 8);
  const canopy = new THREE.Mesh(canopyGeom, matTravertine);
  canopy.position.set(0, 2.5, 0);
  canopy.castShadow = true;
  table.add(canopy);

  propsGroup.add(table);
}

createCafeTable(-14, 0.16, 21.0);
createCafeTable(-18, 0.16, 21.0);
createCafeTable(-22, 0.16, 21.0);

function createStreetLight(x, y, z, isCourtyard = false) {
  const light = new THREE.Group();
  light.position.set(x, y, z);
  const h = isCourtyard ? 3.6 : 5.8;

  addCylinder(0.06, 0.09, h, 8, 0, h / 2, 0, matSteelDark, light);
  addBox(1.2, 0.1, 0.22, 0.5, h, 0, matSteelDark, light);
  addBox(0.9, 0.04, 0.18, 0.5, h - 0.06, 0, matNeonSign, light);

  propsGroup.add(light);
}

createStreetLight(-42, 0.16, 24.5);
createStreetLight(-14, 0.16, 24.5);
createStreetLight(14, 0.16, 24.5);
createStreetLight(42, 0.16, 24.5);
createStreetLight(-11, courtBaseY, 9.0, true);
createStreetLight(11, courtBaseY, 9.0, true);
createStreetLight(0, courtBaseY, -6.0, true);

function createCar(x, y, z, rotY = 0, colorMat = matCharcoal) {
  const car = new THREE.Group();
  car.position.set(x, y, z);
  car.rotation.y = rotY;

  addBox(2.1, 0.7, 4.6, 0, 0.55, 0, colorMat, car);
  addBox(1.85, 0.65, 2.6, 0, 1.15, -0.2, colorMat, car);
  addBox(1.86, 0.55, 2.4, 0, 1.15, -0.2, matGlass, car);
  addBox(0.4, 0.15, 0.1, -0.7, 0.6, 2.31, matNeonSign, car);
  addBox(0.4, 0.15, 0.1, 0.7, 0.6, 2.31, matNeonSign, car);
  addBox(0.4, 0.15, 0.1, -0.7, 0.65, -2.31, createMat({ color: 0xcc1111, emissive: 0x880000, emissiveIntensity: 0.8 }), car);
  addBox(0.4, 0.15, 0.1, 0.7, 0.65, -2.31, createMat({ color: 0xcc1111, emissive: 0x880000, emissiveIntensity: 0.8 }), car);

  for (let wx of [-1.05, 1.05]) {
    for (let wz of [-1.4, 1.4]) {
      const wheel = addCylinder(0.35, 0.35, 0.24, 12, wx, 0.35, wz, matCharcoal, car);
      wheel.rotation.z = Math.PI / 2;
    }
  }

  propsGroup.add(car);
}

createCar(-10, 0.14, 35, Math.PI / 2, createMat({ color: cCarWhite, roughness: 0.2, metalness: 0.8 }));
createCar(12, 0.14, 45, -Math.PI / 2, createMat({ color: cCarBlue, roughness: 0.25, metalness: 0.7 }));
createCar(-35, 0.14, 45, -Math.PI / 2, createMat({ color: cCarBlack, roughness: 0.2, metalness: 0.85 }));
createCar(38, 0.14, 35, Math.PI / 2, createMat({ color: cCarRed, roughness: 0.3, metalness: 0.7 }));

// ==========================================
// EXPORT TO STANDALONE BINARY GLB
// ==========================================
console.log('📦 Exporting scene with GLTFExporter to GLB...');

const exporter = new GLTFExporter();
const glbArrayBuffer = await exporter.parseAsync(scene, {
  binary: true,
  embedImages: true,
  truncateDrawRange: true
});

const buffer = Buffer.from(glbArrayBuffer);
fs.writeFileSync(OUTPUT_FILE, buffer);

const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(2);
console.log(`✅ Photorealistic Shattyq GLB Model successfully created at: ${OUTPUT_FILE} (${sizeMb} MB)`);
