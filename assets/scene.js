import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  FLOORS,
  W,
  D,
  FT,
  TILE_TOP,
  WH,
  ROAD_Y,
  PIT_Y,
  PIT,
  ZONE,
  OPEN_H,
  STAIR_VOID,
  LANES,
  ROOF_RECTS,
  ROOF_OUTLINE,
  SLAB_RECT,
  subtractRects,
  wallModel,
  furnish,
  terrainHeight,
  wx,
  wz,
} from './data.js';

const TIMES = {
  day: {
    top: 0x5b9bd5, bottom: 0xdcecf3, fog: 0xdcecf3, near: 80, far: 210,
    sun: 0xfff1d6, sunI: 1.9, sunPos: [16, 26, 12],
    amb: 0xffffff, ambI: 0.6, hemiSky: 0xcfe8ff, hemiGround: 0x3a4a2f, hemiI: 0.55,
    glass: 0, lamp: 0, stars: 0,
  },
  sunset: {
    top: 0x28345c, bottom: 0xf0a070, fog: 0xd89a78, near: 60, far: 190,
    sun: 0xff9a55, sunI: 1.7, sunPos: [-30, 10, 12],
    amb: 0xffc9a8, ambI: 0.38, hemiSky: 0xffb88a, hemiGround: 0x2a2a3a, hemiI: 0.45,
    glass: 0.6, lamp: 0.6, stars: 0,
  },
  night: {
    top: 0x05081a, bottom: 0x1b2745, fog: 0x0d1428, near: 50, far: 170,
    sun: 0x9db4ff, sunI: 0.5, sunPos: [-12, 26, -8],
    amb: 0x7c8cc8, ambI: 0.32, hemiSky: 0x3b4a7a, hemiGround: 0x101520, hemiI: 0.3,
    glass: 1.3, lamp: 1, stars: 1,
  },
};

const WALL_EXT = 0xf4f1e6;
const WALL_INT = 0xece8dc;
const CONCRETE = 0xa6a49c;
const SLAB = 0xe9e6dd;
const SLAB_ROAD = 0xd9a441;

export function createScene(canvas, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdcecf3, 80, 210);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  camera.position.set(19, 15, 22);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5.5, 0);
  controls.enableDamping = true;
  controls.minDistance = 5;
  controls.maxDistance = 75;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.autoRotateSpeed = 1.1;

  /* ---------- lights ---------- */
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3a4a2f, 0.55);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  sun.target.position.set(0, 5, 0);
  scene.add(amb, hemi, sun, sun.target);

  /* ---------- helpers ---------- */
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 22);
  const coneGeo = new THREE.ConeGeometry(0.5, 1, 9);
  const mats = new Map();
  const M = (color, opacity = 1) => {
    const k = color + '|' + opacity;
    if (!mats.has(k))
      mats.set(
        k,
        new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.03, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }),
      );
    return mats.get(k);
  };
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9fd4e8, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.2,
    emissive: 0xffc878, emissiveIntensity: 0, depthWrite: false,
  });
  const railGlass = M(0xbfe6f2, 0.35);

  function box(parent, x, y, z, w, h, d, mat, { cast = true, receive = true } = {}) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  }
  const rect = (parent, r, y0, h, mat, o) =>
    box(parent, wx((r.x0 + r.x1) / 2), y0 + h / 2, wz((r.z0 + r.z1) / 2), r.x1 - r.x0, h, r.z1 - r.z0, mat, o);

  const labels = [];
  function label(text, x, y, z, parent, kind, size = 0.034) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const fs = 30;
    g.font = `700 ${fs}px system-ui, "Segoe UI", sans-serif`;
    const tw = Math.ceil(g.measureText(text).width) + 34;
    c.width = tw;
    c.height = 56;
    g.font = `700 ${fs}px system-ui, "Segoe UI", sans-serif`;
    g.fillStyle = 'rgba(12,18,13,.86)';
    g.beginPath();
    if (g.roundRect) g.roundRect(1, 4, tw - 2, 48, 14);
    else g.rect(1, 4, tw - 2, 48);
    g.fill();
    g.fillStyle = '#f4f7f1';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, tw / 2, 29);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: false }));
    s.scale.set((size * tw) / 56, size, 1);
    s.position.set(x, y, z);
    s.renderOrder = 20;
    s.userData.kind = kind;
    parent.add(s);
    labels.push(s);
    return s;
  }

  /* ---------- sky + stars ---------- */
  function setSky(top, bottom) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#' + top.toString(16).padStart(6, '0'));
    gr.addColorStop(1, '#' + bottom.toString(16).padStart(6, '0'));
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    if (scene.background && scene.background.dispose) scene.background.dispose();
    scene.background = t;
  }
  const stars = (() => {
    const n = 500,
      p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2,
        ph = Math.acos(0.15 + Math.random() * 0.85);
      p[i * 3] = 180 * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = 180 * Math.cos(ph);
      p[i * 3 + 2] = 180 * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    pts.visible = false;
    scene.add(pts);
    return pts;
  })();

  /* ---------- environment ---------- */
  const env = new THREE.Group();
  scene.add(env);
  const envCallouts = [];

  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  (function terrain() {
    const NX = 240, NZ = 200, X0 = -50, X1 = 50, Z0 = -46, Z1 = 34;
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3);
    const col = new Float32Array((NX + 1) * (NZ + 1) * 3);
    const idx = [];
    const grass1 = new THREE.Color(0x558440), grass2 = new THREE.Color(0x3f6b31), rock = new THREE.Color(0x80827a);
    const lawn = new THREE.Color(0x7aa35f), gravel = new THREE.Color(0x7b786c), c = new THREE.Color();
    const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const jit = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    let k = 0;
    for (let iz = 0; iz <= NZ; iz++)
      for (let ix = 0; ix <= NX; ix++) {
        const x = X0 + (ix / NX) * (X1 - X0), z = Z0 + (iz / NZ) * (Z1 - Z0);
        const y = terrainHeight(x, z);
        pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
        const slope = Math.abs(y - terrainHeight(x + 0.6, z)) + Math.abs(y - terrainHeight(x, z + 0.6));
        c.copy(grass1).lerp(grass2, jit(Math.floor(x * 0.6), Math.floor(z * 0.6)) * 0.8);
        const rocky = Math.max(sm(13, 22, y), sm(1.1, 2.8, slope) * 0.8);
        c.lerp(rock, Math.min(1, rocky));
        if (z > PIT.zN - 0.2 && Math.abs(x) < PIT.x + 2 && z < PIT.zS + 3) c.lerp(lawn, 0.7);
        if (z < -4.2 && z > -11.4) c.lerp(gravel, 0.7);
        col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
        k += 3;
      }
    for (let iz = 0; iz < NZ; iz++)
      for (let ix = 0; ix < NX; ix++) {
        const a = iz * (NX + 1) + ix, b = a + 1, d = a + NX + 1, e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, terrainMat);
    m.receiveShadow = true;
    env.add(m);
  })();

  /* road, driveway, retaining wall */
  const asphalt = M(0x2f3336);
  box(env, 0, ROAD_Y - 0.04, -8.5, 100, 0.08, 3.6, asphalt, { cast: false });
  for (const dz of [-1.7, 1.7]) box(env, 0, ROAD_Y + 0.001, -8.5 + dz, 100, 0.012, 0.1, M(0xe8e6dc), { cast: false });
  for (let x = -48; x < 48; x += 3.2) box(env, x, ROAD_Y + 0.002, -8.5, 1.5, 0.012, 0.12, M(0xe8b34b), { cast: false });
  const garage = FLOORS[2].rooms.find((r) => r.type === 'car');
  box(env, wx(garage.x + garage.w / 2), ROAD_Y - 0.05, -5.2, garage.w + 0.4, 0.1, 3.0, M(0x9aa0a6), { cast: false });
  const retMat = new THREE.MeshStandardMaterial({ color: 0x9a9890, roughness: 0.9 });
  box(env, 0, (6.2 + PIT_Y) / 2, -4.0, W + 1.4, 6.2 - PIT_Y, 0.5, retMat);
  /* parked car on the road */
  (function roadCar() {
    const g = new THREE.Group();
    g.position.set(11, ROAD_Y, -9.2);
    env.add(g);
    box(g, 0, 0.55, 0, 3.8, 0.55, 1.75, M(0xd94f30));
    box(g, -0.1, 1.05, 0, 1.9, 0.48, 1.55, M(0x1f272d));
    for (const x of [-1.2, 1.2]) for (const z of [-0.88, 0.88]) {
      const w = new THREE.Mesh(cylGeo, M(0x151515));
      w.rotation.x = Math.PI / 2; w.scale.set(0.66, 0.2, 0.66); w.position.set(x, 0.33, z); g.add(w);
    }
  })();
  /* street lamp */
  const lampLight = new THREE.PointLight(0xffd9a0, 0, 26, 2);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd9a0, emissiveIntensity: 0 }));
  (function lamp() {
    const g = new THREE.Group();
    g.position.set(wx(7.2), ROAD_Y, -6.6);
    env.add(g);
    const pole = new THREE.Mesh(cylGeo, M(0x3b4148));
    pole.scale.set(0.14, 4.6, 0.14); pole.position.y = 2.3; g.add(pole);
    box(g, 0.45, 4.55, 0, 0.9, 0.09, 0.09, M(0x3b4148));
    lampBulb.position.set(0.85, 4.45, 0); lampLight.position.set(0.85, 4.3, 0);
    g.add(lampBulb, lampLight);
  })();

  /* trees (instanced) */
  const forest = new THREE.Group();
  env.add(forest);
  (function trees() {
    const N = 200;
    const trunk = new THREE.InstancedMesh(cylGeo, M(0x5a4631), N);
    const lo = new THREE.InstancedMesh(coneGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), N);
    const hi = new THREE.InstancedMesh(coneGeo, lo.material, N);
    const dummy = new THREE.Object3D();
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const col = new THREE.Color();
    let n = 0, guard = 0;
    while (n < N && guard++ < 4000) {
      const x = -46 + rnd() * 92, z = -42 + rnd() * 66;
      if (Math.abs(x) < 17 && z > -12 && z < 17) continue;
      if (z > -11.8 && z < -4.0) continue;
      const y = terrainHeight(x, z);
      const s = 0.8 + rnd() * 0.9;
      dummy.rotation.set(0, rnd() * 6, 0);
      dummy.scale.set(0.35 * s, 1.5 * s, 0.35 * s); dummy.position.set(x, y + 0.7 * s, z); dummy.updateMatrix(); trunk.setMatrixAt(n, dummy.matrix);
      dummy.scale.set(2.5 * s, 2.7 * s, 2.5 * s); dummy.position.set(x, y + 2.1 * s, z); dummy.updateMatrix(); lo.setMatrixAt(n, dummy.matrix);
      dummy.scale.set(1.9 * s, 2.2 * s, 1.9 * s); dummy.position.set(x, y + 3.6 * s, z); dummy.updateMatrix(); hi.setMatrixAt(n, dummy.matrix);
      col.setHSL(0.3 + rnd() * 0.06, 0.45, 0.2 + rnd() * 0.1);
      lo.setColorAt(n, col); hi.setColorAt(n, col);
      n++;
    }
    for (const m of [trunk, lo, hi]) { m.count = n; m.castShadow = true; m.receiveShadow = true; forest.add(m); }
  })();

  /* ---------- house ---------- */
  const house = new THREE.Group();
  scene.add(house);
  const floorGroups = [];
  const tiles = new Map();
  const wallPieces = [];

  function buildStair(g) {
    const mat = M(0xe3e0d6), mat2 = M(0xcfcabc);
    const { x0, mid, x1 } = LANES;
    const blk = (xa, xb, za, zb, top, m) => box(g, wx((xa + xb) / 2), FT + top / 2, wz((za + zb) / 2), xb - xa, top, zb - za, m);
    for (let k = 0; k < 5; k++) blk(x0, mid - 0.05, 3.0 - 0.3 * (k + 1), 3.0 - 0.3 * k, 0.3 * (k + 1), mat);
    blk(x0, x1, 0.1, 1.5, 1.5, mat2);
    for (let k = 0; k < 5; k++) blk(mid + 0.05, x1, 1.5 + 0.3 * k, 1.8 + 0.3 * k, 1.5 + 0.3 * (k + 1), mat);
  }

  function buildWalls(f, g) {
    const model = wallModel(f);
    for (const seg of model.segments) {
      const interior = seg.side === 'I';
      const th = interior ? 0.1 : 0.2;
      const buried = f.id <= 2 && seg.side === 'N';
      const wallMat = buried ? M(CONCRETE) : interior ? M(WALL_INT) : M(WALL_EXT);
      let a0 = seg.a, b0 = seg.b;
      if (seg.o === 'H' && !interior) {
        if (seg.a === 0) a0 -= th / 2;
        if (seg.b === W) b0 += th / 2;
      }
      const piece = (a, b, y0, y1, mat, glass = false) => {
        if (b - a < 1e-4 || y1 - y0 < 1e-4) return;
        const m = new THREE.Mesh(boxGeo, mat);
        const len = b - a, mid = (a + b) / 2;
        const t = glass ? th * 0.45 : th;
        if (seg.o === 'H') { m.scale.set(len, 1, t); m.position.set(wx(mid), 0, wz(seg.at)); }
        else { m.scale.set(t, 1, len); m.position.set(wx(seg.at), 0, wz(mid)); }
        m.castShadow = !glass; m.receiveShadow = true;
        g.add(m);
        wallPieces.push({ mesh: m, side: seg.side, y0, y1 });
      };
      const ops = model.openings
        .filter((o) => o.o === seg.o && o.at === seg.at && o.a >= seg.a - 1e-6 && o.a + o.w <= seg.b + 1e-6)
        .sort((p, q) => p.a - q.a);
      let cur = a0;
      for (const op of ops) {
        piece(cur, op.a, 0, WH, wallMat);
        const [y0, y1] = OPEN_H[op.k];
        if (y0 > 0) piece(op.a, op.a + op.w, 0, y0, wallMat);
        if (y1 < WH) piece(op.a, op.a + op.w, y1, WH, wallMat);
        if (op.k === 'window' || op.k === 'slider') piece(op.a, op.a + op.w, y0, y1, glassMat, true);
        if (op.k === 'garage') piece(op.a + 0.02, op.a + op.w - 0.02, 0, y1, M(0x8a929c));
        if (op.k === 'entry') piece(op.a + 0.02, op.a + op.w - 0.02, 0, y1, M(0x6b4f35));
        cur = op.a + op.w;
      }
      piece(cur, b0, 0, WH, wallMat);
    }
  }

  FLOORS.forEach((f, idx) => {
    const g = new THREE.Group();
    g.userData = { floorId: f.id, base: f.base, idx };
    house.add(g);
    floorGroups.push(g);

    const slabs = f.id === 1 ? [SLAB_RECT] : subtractRects([SLAB_RECT], STAIR_VOID);
    for (const r of slabs) rect(g, r, 0, FT, M(f.id === 3 ? SLAB_ROAD : SLAB));

    f.rooms.forEach((r, ri) => {
      if (r.type === 'stair') return;
      const tm = new THREE.MeshStandardMaterial({ color: ZONE[r.zone], roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0 });
      const t = box(g, wx(r.x + r.w / 2), FT + 0.03, wz(r.z + r.d / 2), r.w - 0.06, 0.06, r.d - 0.06, tm, { cast: false });
      tiles.set(f.id + ':' + ri, t);
    });

    for (const it of furnish(f)) {
      const y0 = TILE_TOP + it.y;
      const mat = it.glass ? railGlass : M(it.c);
      let m;
      if (it.shape === 'cyl') {
        m = new THREE.Mesh(cylGeo, mat);
        m.scale.set(it.w, it.h, it.w);
        m.position.set(wx(it.x), y0 + it.h / 2, wz(it.z));
      } else if (it.shape === 'wheel') {
        m = new THREE.Mesh(cylGeo, mat);
        m.rotation.z = Math.PI / 2;
        m.scale.set(it.d, it.w, it.d);
        m.position.set(wx(it.x), y0 + it.h / 2, wz(it.z));
      } else {
        m = new THREE.Mesh(boxGeo, mat);
        m.scale.set(it.w, it.h, it.d);
        m.position.set(wx(it.x), y0 + it.h / 2, wz(it.z));
      }
      m.castShadow = !it.glass;
      m.receiveShadow = true;
      g.add(m);
    }

    buildWalls(f, g);
    buildStair(g);

    f.rooms.forEach((r) => {
      if (r.type === 'stair') return;
      label(r.name, wx(r.x + r.w / 2), FT + 2.1, wz(r.z + r.d / 2), g, 'room', r.w < 1.9 ? 0.022 : 0.027);
    });
    label(`${f.short} · ${f.tag}`, -(W / 2 + 2.6), FT + 1.6, 0, g, 'floor', 0.036);
    if (f.id === 3) label('GARAGE DOORS', wx(garage.x + garage.w / 2), FT + 3.1, wz(-0.4), g, 'callout', 0.03);
  });

  /* roof deck */
  const roof = new THREE.Group();
  house.add(roof);
  (function buildRoof() {
    const slabs = subtractRects(ROOF_RECTS, STAIR_VOID);
    for (const r of slabs) rect(roof, r, 0, FT, M(0x4a554d));
    const pts = ROOF_OUTLINE;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const dx = q[0] - p[0], dz = q[1] - p[1];
      const len = Math.hypot(dx, dz);
      box(roof, wx((p[0] + q[0]) / 2), FT + 0.4, wz((p[1] + q[1]) / 2), Math.abs(dx) > 0 ? len + 0.15 : 0.15, 0.8, Math.abs(dz) > 0 ? len + 0.15 : 0.15, M(WALL_EXT));
    });
    const r2 = ROOF_RECTS[1];
    const cols = Math.max(1, Math.floor((r2.x1 - r2.x0 - 0.8) / 1.7));
    const startX = r2.x0 + 0.4 + 0.85 + ((r2.x1 - r2.x0 - 0.8) - cols * 1.7) / 2;
    for (let c = 0; c < cols; c++) for (const pz of [r2.z0 + 1.3, r2.z0 + 2.8]) {
      const p = box(roof, wx(startX + c * 1.7), FT + 0.28, wz(pz), 1.5, 0.05, 1.0, M(0x1f3a63));
      p.rotation.x = -0.3;
    }
    label('ROOF DECK · SOLAR-READY', wx((r2.x0 + r2.x1) / 2), FT + 1.5, wz((r2.z0 + r2.z1) / 2), roof, 'callout', 0.03);
  })();

  /* env callouts */
  envCallouts.push(
    label('MOUNTAIN ROAD = 3F LEVEL', -17, ROAD_Y + 1.6, -8.5, env, 'callout', 0.03),
    label('VALLEY VIEW', 6, 0.6, 12, env, 'callout', 0.03),
  );

  /* ---------- state + visibility ---------- */
  const state = { floor: 0, explode: 0.18, mode: 'cutaway', roof: false, labels: true, env: true, highlight: null };
  const CUT = {
    cutaway: { N: WH, W: WH, S: 1.0, E: 1.0, I: 1.15 },
    exterior: { N: WH, W: WH, S: WH, E: WH, I: WH },
  };

  function applyWalls() {
    const cut = CUT[state.mode];
    for (const p of wallPieces) {
      const c = cut[p.side];
      if (p.y0 >= c - 0.04) { p.mesh.visible = false; continue; }
      p.mesh.visible = true;
      const top = Math.min(p.y1, c);
      p.mesh.scale.y = top - p.y0;
      p.mesh.position.y = FT + p.y0 + (top - p.y0) / 2;
    }
  }
  function layout() {
    const e = state.explode * 2.4;
    floorGroups.forEach((g, i) => (g.position.y = g.userData.base + i * e));
    roof.position.y = 12 + 4 * e;
  }
  function refreshLabels() {
    const all = state.floor === 0;
    for (const l of labels) {
      const k = l.userData.kind;
      l.visible = state.labels && (k === 'floor' ? all : k === 'room' ? !all : k === 'callout' ? all : true);
    }
  }
  function refresh() {
    floorGroups.forEach((g) => (g.visible = state.floor === 0 || g.userData.floorId === state.floor));
    roof.visible = state.roof && (state.floor === 0 || state.floor === 4);
    env.visible = state.env;
    const iso = state.floor !== 0;
    for (const m of [terrainMat, retMat]) {
      m.transparent = iso;
      m.opacity = iso ? 0.2 : 1;
      m.depthWrite = !iso;
      m.needsUpdate = true;
    }
    forest.visible = !iso;
    layout();
    applyWalls();
    refreshLabels();
  }

  /* ---------- camera ---------- */
  let fly = null;
  controls.addEventListener('start', () => (fly = null));
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  function floorTarget(id) {
    if (!id) return V([0, 5.5, 0]);
    const g = floorGroups[id - 1];
    return V([0, g.position.y + 1.4, 0]);
  }
  function flyTo(pos, target) { fly = { pos, target }; }

  function setFloor(id) {
    state.floor = id;
    refresh();
    const t = floorTarget(id);
    const dir = camera.position.clone().sub(controls.target).normalize();
    flyTo(t.clone().add(dir.multiplyScalar(id ? 17 : 30)), t);
  }
  function setView(name) {
    const t = floorTarget(state.floor);
    if (name === 'iso') flyTo(t.clone().add(V(state.floor ? [11, 9, 13] : [17, 10, 20])), t);
    else if (name === 'top') flyTo(t.clone().add(V([0.001, state.floor ? 19 : 34, 1.2])), t);
    else if (name === 'road') flyTo(V([6, 11, -15]), V([0, 6.8, 0]));
    else if (name === 'valley') flyTo(V([-7, 5.6, 23]), V([0, 6.2, 0]));
  }

  /* ---------- time of day ---------- */
  function setTime(name) {
    const T = TIMES[name];
    sun.color.setHex(T.sun); sun.intensity = T.sunI;
    sun.position.set(T.sunPos[0], T.sunPos[1] + 5, T.sunPos[2]);
    amb.color.setHex(T.amb); amb.intensity = T.ambI;
    hemi.color.setHex(T.hemiSky); hemi.groundColor.setHex(T.hemiGround); hemi.intensity = T.hemiI;
    scene.fog.color.setHex(T.fog); scene.fog.near = T.near; scene.fog.far = T.far;
    setSky(T.top, T.bottom);
    glassMat.emissiveIntensity = T.glass;
    lampLight.intensity = T.lamp * 70;
    lampBulb.material.emissiveIntensity = T.lamp * 2;
    stars.visible = T.stars > 0;
  }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!down || state.floor !== 0) return;
    if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(house.children, true).find((h) => h.object.visible && !h.object.isSprite);
    let o = hit && hit.object;
    while (o && !(o.userData && o.userData.floorId)) o = o.parent;
    if (o && hooks.onPick) hooks.onPick(o.userData.floorId);
  });

  /* ---------- loop + resize ---------- */
  function resize() {
    const p = canvas.parentElement;
    const w = p.clientWidth, h = p.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  let running = true;
  (function loop() {
    requestAnimationFrame(loop);
    if (!running) return;
    if (fly) {
      camera.position.lerp(fly.pos, 0.09);
      controls.target.lerp(fly.target, 0.09);
      if (camera.position.distanceTo(fly.pos) < 0.04 && controls.target.distanceTo(fly.target) < 0.04) fly = null;
    }
    controls.update();
    renderer.render(scene, camera);
  })();

  setTime('day');
  refresh();

  return {
    setFloor,
    setView,
    setTime,
    setExplode(v) { state.explode = v; refresh(); if (state.floor) controls.target.copy(floorTarget(state.floor)); },
    setMode(m) { state.mode = m; applyWalls(); },
    setRoof(v) { state.roof = v; refresh(); },
    setLabels(v) { state.labels = v; refreshLabels(); },
    setEnv(v) { state.env = v; refresh(); },
    setSpin(v) { controls.autoRotate = v; },
    pause(v) { running = !v; },
    highlightRoom(floorId, ri) {
      if (state.highlight) { state.highlight.material.emissiveIntensity = 0; state.highlight = null; }
      const t = tiles.get(floorId + ':' + ri);
      if (t) { t.material.emissiveIntensity = 0.45; state.highlight = t; }
    },
    snapshot() {
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },
  };
}
