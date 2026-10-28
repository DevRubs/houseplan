/* Mountain House — single source of truth.
 * Plan space: x 0→W (west→east), z 0→D (north/road → south/valley), metres.
 * Two sizes live here: "70" (10 × 7 m, two cars) and "50" (7 × 7.2 m, one car).
 * Pick with ?plan=50 in the URL. Every floor tiles its footprint exactly
 * (checked by scripts/check.mjs for both sizes).
 */

const PLAN =
  globalThis.__MH_PLAN__ ||
  (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('plan') : null) ||
  '70';
export const IS_COMPACT = PLAN === '50';
export const W = IS_COMPACT ? 7 : 10;
export const D = IS_COMPACT ? 7.2 : 7;
export const VARIANT = IS_COMPACT
  ? { key: '50', name: 'Compact', title: '50 sqm × 4 floors', cars: 1 }
  : { key: '70', name: 'Standard', title: '70 sqm × 4 floors', cars: 2 };
export const STORY = 3; // floor-to-floor
export const FT = 0.28; // slab thickness
export const TILE_TOP = 0.34; // top of coloured floor tiles (furniture sits here)
export const WH = 2.7; // wall height above slab
export const PLATEAU = 6.2; // terrain at road level
export const ROAD_Y = 6.28; // road surface = 3F slab top
export const PIT_Y = -0.15; // ground around the house

export const rn = (v) => Math.round(v * 100) / 100;
export const css = (n) => '#' + n.toString(16).padStart(6, '0');
export const wx = (x) => x - W / 2;
/* the north (road) face is pinned at world z = -3.5 so the road, retaining wall
 * and terrain never move when the house gets deeper to the south */
export const wz = (z) => z - 3.5;

/* ---------- palette (one place, named) ---------- */
export const ZONE = {
  living: 0xf2c58a,
  sleep: 0xa9c9a0,
  wet: 0x9fd3cf,
  service: 0xd9d3c0,
  outdoor: 0x86b873,
  car: 0xf3d98b,
  circ: 0xe9e4d6,
  stair: 0xc8ced6,
  work: 0xf0b995,
};

const WOOD = 0x8a6f4d,
  WOOD2 = 0x6b4f35,
  WHITE = 0xf4f4f0,
  LINEN = 0xf2efe8,
  DARK = 0x38424a,
  STONE = 0xd9d9d6,
  SOFA = 0x5f7161,
  SOFA2 = 0x4c5e4f,
  SHELF = 0xb8a888,
  GLASS = 0xbfe6f2,
  GREEN = 0x4f8a3f,
  BLACK = 0x22272b;

/* ---------- floors ---------- */
const R = (name, x, z, w, d, zone, type) => ({ name, x, z, w, d, zone, type, area: rn(w * d) });
const hd = (at, a, w, o = {}) => ({ o: 'H', at, a, w, k: 'door', s: -1, f: 1, ...o });
const vd = (at, a, w, o = {}) => ({ o: 'V', at, a, w, k: 'door', s: 1, f: 1, ...o });

const FLOORS_70 = [
  {
    id: 1,
    short: '1F',
    name: 'Floor 1 · Downhill base',
    tag: 'Guest + family level',
    color: 0x5b8def,
    base: 0,
    winWalls: ['S'],
    desc: 'Lowest level, dug into the slope. Coolest floor. Family room opens to the valley, guest suite and gym tucked behind it.',
    rooms: [
      R('Guest Bath', 0, 0, 1.8, 3.2, 'wet', 'bath'),
      R('Gym / Flex', 1.8, 0, 2.8, 3.2, 'work', 'gym'),
      R('Laundry', 4.6, 0, 1.8, 3.2, 'service', 'laundry'),
      R('Storage', 6.4, 0, 1.8, 3.2, 'service', 'storage'),
      R('Stair', 8.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Guest Bedroom', 0, 3.2, 3.8, 3.8, 'sleep', 'bed'),
      R('Family Room', 3.8, 3.2, 6.2, 3.8, 'living', 'sofa'),
    ],
    doors: [
      hd(3.2, 0.45, 0.8),
      hd(3.2, 3.85, 0.7),
      hd(3.2, 4.9, 0.8),
      hd(3.2, 6.7, 0.8, { f: -1 }),
      hd(3.2, 8.3, 1.6, { k: 'open' }),
      vd(3.8, 4.4, 0.9, { s: -1 }),
      hd(D, 6.5, 2.8, { k: 'slider' }),
    ],
  },
  {
    id: 2,
    short: '2F',
    name: 'Floor 2 · Sleep level',
    tag: 'Bedrooms, quiet + cool',
    color: 0x7fb069,
    base: 3,
    winWalls: ['S', 'W', 'E'],
    desc: 'All bedrooms sit one floor below the road, so no street noise. Baths and closets are buried on the uphill side, bedrooms face the valley.',
    rooms: [
      R('Closet', 0, 0, 2.0, 3.2, 'service', 'closet'),
      R('Primary Bath', 2.0, 0, 2.2, 3.2, 'wet', 'bath'),
      R('Common Bath', 4.2, 0, 1.6, 3.2, 'wet', 'bath'),
      R('Study Nook', 5.8, 0, 2.4, 3.2, 'work', 'desk'),
      R('Stair', 8.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Hall', 0, 3.2, 10, 1.0, 'circ', 'hall'),
      R('Primary Bedroom', 0, 4.2, 4.4, 2.8, 'sleep', 'bed'),
      R('Bedroom 2', 4.4, 4.2, 2.8, 2.8, 'sleep', 'bed'),
      R('Bedroom 3', 7.2, 4.2, 2.8, 2.8, 'sleep', 'bed'),
    ],
    doors: [
      hd(3.2, 0.5, 0.8),
      hd(3.2, 2.8, 0.8),
      hd(3.2, 4.5, 0.8),
      hd(3.2, 6.5, 0.9),
      hd(3.2, 8.3, 1.6, { k: 'open' }),
      hd(4.2, 3.2, 0.9, { s: 1, f: -1 }),
      hd(4.2, 4.6, 0.9, { s: 1 }),
      hd(4.2, 7.4, 0.9, { s: 1 }),
    ],
  },
  {
    id: 3,
    short: '3F',
    name: 'Floor 3 · Parking + entry',
    tag: 'Road level, drive straight in',
    color: 0xe8b34b,
    base: 6,
    winWalls: ['S', 'W', 'E'],
    desc: 'The mountain floor. The road meets this slab flat: drive into a two-car garage and walk three steps to the foyer. No ramp, no stairs with groceries.',
    rooms: [
      R('Parking · 2 Cars', 0, 0, 6.4, 4.6, 'car', 'car'),
      R('Flex Room', 0, 4.6, 4.2, 2.4, 'work', 'desk'),
      R('Bath', 4.2, 4.6, 2.2, 2.4, 'wet', 'bath'),
      R('Foyer', 6.4, 0, 1.8, 3.2, 'circ', 'foyer'),
      R('Mudroom', 6.4, 3.2, 1.8, 1.4, 'service', 'mud'),
      R('Pantry', 6.4, 4.6, 1.8, 2.4, 'service', 'storage'),
      R('Stair', 8.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Storage', 8.2, 3.2, 1.8, 3.8, 'service', 'storage'),
    ],
    doors: [
      hd(0, 6.75, 0.9, { k: 'entry', s: 1 }),
      hd(0, 0.25, 2.7, { k: 'garage' }),
      hd(0, 3.45, 2.7, { k: 'garage' }),
      hd(4.6, 0.8, 0.9, { s: 1 }),
      hd(4.6, 5.0, 0.8, { s: 1, f: -1 }),
      vd(6.4, 1.2, 0.9),
      vd(6.4, 3.5, 0.8),
      hd(3.2, 6.7, 0.8, { s: 1 }),
      hd(4.6, 6.7, 0.8, { s: 1 }),
      vd(8.2, 3.5, 0.8),
      vd(8.2, 2.0, 1.0, { k: 'open' }),
    ],
  },
  {
    id: 4,
    short: '4F',
    name: 'Floor 4 · Living + view',
    tag: 'Top floor, panorama deck',
    color: 0xef7d54,
    base: 9,
    winWalls: ['N', 'S', 'W', 'E'],
    desc: 'Above the road, so it gets the whole valley. Open kitchen, dining and living, with a covered terrace on the downhill side.',
    rooms: [
      R('Kitchen', 0, 0, 4.0, 3.2, 'living', 'kitchen'),
      R('Dining Nook', 4.0, 0, 2.6, 3.2, 'living', 'table'),
      R('Powder Room', 6.6, 0, 1.6, 3.2, 'wet', 'bath'),
      R('Stair', 8.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('View Terrace', 0, 3.2, 4.2, 3.8, 'outdoor', 'terrace'),
      R('Living Room', 4.2, 3.2, 5.8, 3.8, 'living', 'sofa'),
    ],
    doors: [
      vd(4.0, 0.4, 2.4, { k: 'open' }),
      hd(3.2, 0.6, 2.6, { k: 'slider' }),
      vd(4.2, 4.3, 2.4, { k: 'slider' }),
      hd(3.2, 4.4, 2.0, { k: 'open' }),
      hd(3.2, 6.9, 0.8),
      hd(3.2, 8.3, 1.6, { k: 'open' }),
    ],
  },
];

/* compact: 7.0 × 7.2 m = 50.4 sqm per floor, one-car garage, stair at x 5.2–7.0 */
const FLOORS_50 = [
  {
    id: 1,
    short: '1F',
    name: 'Floor 1 · Bedrooms',
    tag: '3 bedrooms + CR',
    color: 0x5b8def,
    base: 0,
    winWalls: ['S', 'W', 'E'],
    desc: 'Lowest level, the coolest and quietest. Three bedrooms in a row facing the valley, with one shared CR and a closet buried on the uphill side.',
    rooms: [
      R('Closet', 0, 0, 1.8, 3.2, 'service', 'closet'),
      R('Study Nook', 1.8, 0, 1.8, 3.2, 'work', 'desk'),
      R('CR', 3.6, 0, 1.6, 3.2, 'wet', 'bath'),
      R('Stair', 5.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Hall', 0, 3.2, 7, 1.0, 'circ', 'hall'),
      R('Bedroom 1', 0, 4.2, 2.4, 3.0, 'sleep', 'bed'),
      R('Bedroom 2', 2.4, 4.2, 2.3, 3.0, 'sleep', 'bed'),
      R('Bedroom 3', 4.7, 4.2, 2.3, 3.0, 'sleep', 'bed'),
    ],
    doors: [
      hd(3.2, 0.5, 0.8),
      hd(3.2, 2.3, 0.8),
      hd(3.2, 3.9, 0.8),
      hd(3.2, 5.3, 1.6, { k: 'open' }),
      hd(4.2, 0.75, 0.9, { s: 1 }),
      hd(4.2, 3.1, 0.9, { s: 1 }),
      hd(4.2, 5.4, 0.9, { s: 1, f: -1 }),
    ],
  },
  {
    id: 2,
    short: '2F',
    name: 'Floor 2 · Kitchen + living',
    tag: 'Kitchen, pantry, dining, living, CR',
    color: 0x7fb069,
    base: 3,
    winWalls: ['S', 'W', 'E'],
    desc: 'The daily floor. Galley kitchen with a walk-in pantry on the cool uphill side, then dining and living open to each other and to the valley. The CR sits above the bedroom CR so the plumbing stacks.',
    rooms: [
      R('Kitchen', 0, 0, 2.4, 3.2, 'living', 'kitchen'),
      R('Pantry', 2.4, 0, 1.2, 3.2, 'service', 'storage'),
      R('CR', 3.6, 0, 1.6, 3.2, 'wet', 'bath'),
      R('Stair', 5.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Dining', 0, 3.2, 3.0, 4.0, 'living', 'table'),
      R('Living Room', 3.0, 3.2, 4.0, 4.0, 'living', 'sofa'),
    ],
    doors: [
      vd(2.4, 0.8, 0.8),
      hd(3.2, 0.3, 1.8, { k: 'open' }),
      hd(3.2, 3.9, 0.8),
      hd(3.2, 5.3, 1.6, { k: 'open' }),
      vd(3.0, 4.4, 2.4, { k: 'open' }),
    ],
  },
  {
    id: 3,
    short: '3F',
    name: 'Floor 3 · Parking + entry',
    tag: 'Road level, drive straight in',
    color: 0xe8b34b,
    base: 6,
    winWalls: ['S', 'W', 'E'],
    desc: 'The mountain floor. The road meets this slab flat: drive into a one-car garage and step into the foyer. No ramp, no stairs with groceries.',
    rooms: [
      R('Parking · 1 Car', 0, 0, 3.2, 4.8, 'car', 'car'),
      R('Foyer', 3.2, 0, 2.0, 3.2, 'circ', 'foyer'),
      R('Stair', 5.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Bath', 3.2, 3.2, 2.0, 1.6, 'wet', 'bath'),
      R('Storage', 5.2, 3.2, 1.8, 1.6, 'service', 'storage'),
      R('Flex / Office', 0, 4.8, 7, 2.4, 'work', 'desk'),
    ],
    doors: [
      hd(0, 3.75, 0.9, { k: 'entry', s: 1 }),
      hd(0, 0.25, 2.7, { k: 'garage' }),
      hd(4.8, 0.6, 0.9, { s: 1 }),
      vd(3.2, 1.2, 0.9),
      hd(3.2, 3.55, 0.8, { s: 1 }),
      hd(4.8, 5.6, 0.8, { s: 1 }),
      vd(5.2, 2.0, 1.0, { k: 'open' }),
    ],
  },
  {
    id: 4,
    short: '4F',
    name: 'Floor 4 · Laundry + tambayan',
    tag: 'Water tank, laundry, half-open hangout',
    color: 0xef7d54,
    base: 9,
    winWalls: ['N', 'S', 'W', 'E'],
    desc: 'Top floor, above the road. Water tank and laundry on the uphill side. The tambayan is half open: an enclosed lounge on the east, an uncovered terrace on the west for fresh air and drying clothes.',
    rooms: [
      R('Water Tank', 0, 0, 2.0, 3.2, 'service', 'tank'),
      R('Laundry', 2.0, 0, 3.2, 3.2, 'service', 'laundry'),
      R('Stair', 5.2, 0, 1.8, 3.2, 'stair', 'stair'),
      R('Open Terrace', 0, 3.2, 3.5, 4.0, 'outdoor', 'terrace'),
      R('Tambayan', 3.5, 3.2, 3.5, 4.0, 'living', 'lounge'),
    ],
    doors: [
      hd(3.2, 0.6, 0.8),
      hd(3.2, 2.2, 1.2, { k: 'slider' }),
      hd(3.2, 4.0, 0.9),
      hd(3.2, 5.3, 1.6, { k: 'open' }),
      vd(3.5, 4.4, 2.4, { k: 'slider' }),
    ],
  },
];

export const FLOORS = IS_COMPACT ? FLOORS_50 : FLOORS_70;

export const OPEN_H = {
  door: [0, 2.1],
  open: [0, WH],
  window: [1.0, 2.2],
  slider: [0, 2.3],
  garage: [0, 2.3],
  entry: [0, 2.2],
};

/* ---------- stair (U-shaped, 10 risers per storey) ---------- */
export const STAIR = { x: W - 1.8, z: 0, w: 1.8, d: 3.2 };
/* the two flights + landing sit in these lanes (west lane, centre stringer, east lane) */
export const LANES = { x0: rn(STAIR.x + 0.1), mid: rn(STAIR.x + 0.9), x1: rn(STAIR.x + 1.7) };
/* openings through the slab above (lower flight headroom) */
export const STAIR_VOID = [
  { x0: LANES.x0, x1: LANES.x1, z0: 0.1, z1: 2.1 },
  { x0: rn(LANES.mid + 0.05), x1: LANES.x1, z0: 2.1, z1: 3.0 },
];
/* roof is an L: everything except the covered-terrace corner */
const TERRACE_X = FLOORS[3].rooms.find((r) => r.type === 'terrace').x + FLOORS[3].rooms.find((r) => r.type === 'terrace').w;
export const ROOF_RECTS = [
  { x0: -0.3, x1: W + 0.3, z0: -0.3, z1: 3.2 },
  { x0: TERRACE_X, x1: W + 0.3, z0: 3.2, z1: D + 0.3 },
];
export const SLAB_RECT = { x0: -0.2, x1: W + 0.2, z0: -0.2, z1: D + 0.2 };
export const ROOF_OUTLINE = [
  [-0.3, -0.3],
  [W + 0.3, -0.3],
  [W + 0.3, D + 0.3],
  [TERRACE_X, D + 0.3],
  [TERRACE_X, 3.2],
  [-0.3, 3.2],
];

export function subtractRects(rects, voids) {
  let list = rects;
  for (const v of voids) {
    const next = [];
    for (const r of list) {
      if (v.x1 <= r.x0 || v.x0 >= r.x1 || v.z1 <= r.z0 || v.z0 >= r.z1) {
        next.push(r);
        continue;
      }
      if (v.x0 > r.x0) next.push({ x0: r.x0, x1: v.x0, z0: r.z0, z1: r.z1 });
      if (v.x1 < r.x1) next.push({ x0: v.x1, x1: r.x1, z0: r.z0, z1: r.z1 });
      const mx0 = Math.max(r.x0, v.x0),
        mx1 = Math.min(r.x1, v.x1);
      if (v.z0 > r.z0) next.push({ x0: mx0, x1: mx1, z0: r.z0, z1: v.z0 });
      if (v.z1 < r.z1) next.push({ x0: mx0, x1: mx1, z0: v.z1, z1: r.z1 });
    }
    list = next;
  }
  return list;
}

/* ---------- totals (derived, never hand-typed) ---------- */
const sumArea = (pred) =>
  rn(FLOORS.reduce((t, f) => t + f.rooms.filter(pred).reduce((s, r) => s + r.area, 0), 0));
export const TOTALS = {
  perFloor: rn(W * D),
  gross: sumArea(() => true),
  garage: sumArea((r) => r.type === 'car'),
  terrace: sumArea((r) => r.type === 'terrace'),
  interior: sumArea((r) => r.type !== 'car' && r.type !== 'terrace'),
};

/* ---------- walls + openings ---------- */
const sideOf = (o, at) => (o === 'H' ? (at === 0 ? 'N' : at === D ? 'S' : 'I') : at === 0 ? 'W' : at === W ? 'E' : 'I');

const WIN_TYPES = new Set(['bed', 'sofa', 'table', 'kitchen', 'desk', 'gym', 'bath', 'laundry', 'lounge']);

function windowsFor(f) {
  const out = [];
  const clash = (o, at, a, w) =>
    f.doors.some((d) => d.o === o && d.at === at && a < d.a + d.w && a + w > d.a);
  const push = (o, at, a, w, wall) => {
    a = rn(a);
    if (!clash(o, at, a, w)) out.push({ o, at, a, w: rn(w), k: 'window', wall });
  };
  for (const r of f.rooms) {
    if (!WIN_TYPES.has(r.type)) continue;
    const small = r.type === 'bath';
    if (f.winWalls.includes('S') && rn(r.z + r.d) === D) {
      const w = small ? 0.7 : Math.min(r.w * 0.6, 2.4);
      push('H', D, r.x + (r.w - w) / 2, w, 'S');
    }
    if (f.winWalls.includes('N') && r.z === 0) {
      const w = small ? 0.7 : Math.min(r.w * 0.6, 2.0);
      push('H', 0, r.x + (r.w - w) / 2, w, 'N');
    }
    if (f.winWalls.includes('W') && r.x === 0) {
      const w = small ? 0.7 : Math.min(r.d * 0.5, 1.8);
      push('V', 0, r.z + (r.d - w) / 2, w, 'W');
    }
    if (f.winWalls.includes('E') && rn(r.x + r.w) === W) {
      const w = small ? 0.7 : Math.min(r.d * 0.5, 1.8);
      push('V', W, r.z + (r.d - w) / 2, w, 'E');
    }
  }
  return out;
}

function mergeIntervals(list) {
  const s = [...list].sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const iv of s) {
    const last = out[out.length - 1];
    if (last && iv[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], iv[1]);
    else out.push([iv[0], iv[1]]);
  }
  return out;
}

const wallCache = new Map();
export function wallModel(f) {
  if (wallCache.has(f.id)) return wallCache.get(f.id);
  const lines = { H: new Map(), V: new Map() };
  const add = (o, at, a, b) => {
    const m = lines[o];
    if (!m.has(at)) m.set(at, []);
    m.get(at).push([a, b]);
  };
  for (const r of f.rooms) {
    const x0 = r.x,
      x1 = rn(r.x + r.w),
      z0 = r.z,
      z1 = rn(r.z + r.d);
    const edges = [
      ['H', z0, x0, x1],
      ['H', z1, x0, x1],
      ['V', x0, z0, z1],
      ['V', x1, z0, z1],
    ];
    for (const [o, at, a, b] of edges) {
      const boundary = (o === 'H' && (at === 0 || at === D)) || (o === 'V' && (at === 0 || at === W));
      if (r.type === 'terrace' && boundary) continue;
      add(o, at, a, b);
    }
  }
  const segments = [];
  for (const o of ['H', 'V'])
    for (const [at, ivs] of lines[o])
      for (const [a, b] of mergeIntervals(ivs)) segments.push({ o, at, a, b, side: sideOf(o, at) });
  const openings = [
    ...f.doors.map((d) => ({ ...d, wall: sideOf(d.o, d.at) })),
    ...windowsFor(f),
  ];
  const model = { segments, openings };
  wallCache.set(f.id, model);
  return model;
}

/* ---------- furniture (plan-space boxes, shared by 2D + 3D) ---------- */
const it = (x, z, w, d, y, h, c, extra) => ({ x: rn(x), z: rn(z), w, d, y, h, c, ...extra });

function bed(r) {
  const bw = Math.min(1.8, r.w - 0.7),
    bl = Math.min(2.1, r.d - 0.5),
    cx = r.x + r.w / 2,
    head = r.z + r.d - 0.12,
    zc = head - bl / 2;
  const o = [
    it(cx, zc, bw + 0.1, bl + 0.04, 0, 0.3, WOOD),
    it(cx, zc - 0.02, bw, bl - 0.05, 0.3, 0.22, LINEN),
    it(cx - bw * 0.24, head - 0.32, bw * 0.42, 0.34, 0.52, 0.12, WHITE),
    it(cx + bw * 0.24, head - 0.32, bw * 0.42, 0.34, 0.52, 0.12, WHITE),
    it(cx, zc - bl * 0.22, bw + 0.02, bl * 0.52, 0.52, 0.05, 0x6f8fa8),
  ];
  if (r.w >= bw + 1.3) for (const s of [-1, 1]) o.push(it(cx + s * (bw / 2 + 0.4), head - 0.25, 0.42, 0.4, 0, 0.5, WOOD));
  return o;
}
function sofa(r) {
  const sw = Math.min(2.4, r.w * 0.5),
    cx = r.x + r.w * 0.5,
    sz = r.z + Math.min(1.1, r.d * 0.3);
  const o = [
    it(cx, sz + 0.7, sw + 0.5, 2.0, 0, 0.02, 0x8a8f94),
    it(cx, sz, sw, 0.9, 0, 0.42, SOFA),
    it(cx, sz - 0.4, sw, 0.16, 0.42, 0.42, SOFA2),
    it(cx - (sw / 2 - 0.09), sz, 0.18, 0.9, 0.42, 0.18, SOFA2),
    it(cx + (sw / 2 - 0.09), sz, 0.18, 0.9, 0.42, 0.18, SOFA2),
    it(cx, sz + 1.15, 1.1, 0.55, 0, 0.4, WOOD),
  ];
  if (r.w >= 5) o.push(it(cx + sw / 2 + 0.85, sz + 1.0, 0.8, 0.8, 0, 0.45, 0x7a6a55));
  return o;
}
function dining(r) {
  const tw = Math.min(1.7, r.w - 0.9),
    cx = r.x + r.w / 2,
    cz = r.z + r.d / 2 + 0.1;
  const o = [it(cx, cz, tw, 0.9, 0.7, 0.06, WOOD), it(cx, cz, tw - 0.25, 0.65, 0, 0.7, WOOD2, { plan: false })];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) o.push(it(cx + sx * tw * 0.25, cz + sz * 0.68, 0.42, 0.42, 0, 0.45, DARK));
  return o;
}
function kitchen(r) {
  const o = [];
  const L = r.w - 0.2;
  o.push(it(r.x + r.w / 2, r.z + 0.33, L, 0.6, 0, 0.88, DARK));
  o.push(it(r.x + r.w / 2, r.z + 0.33, L, 0.64, 0.88, 0.04, STONE));
  o.push(it(r.x + 0.5, r.z + 0.45, 0.7, 0.7, 0, 1.85, 0xe4e6e8));
  o.push(it(r.x + r.w * 0.55, r.z + 0.33, 0.6, 0.5, 0.92, 0.02, BLACK));
  if (r.d >= 3 && r.w >= 3) {
    const iw = Math.min(2.0, r.w - 1.2),
      cx = r.x + r.w * 0.5;
    o.push(it(cx, r.z + 2.0, iw, 0.8, 0, 0.9, DARK));
    o.push(it(cx, r.z + 2.0, iw + 0.04, 0.86, 0.9, 0.04, STONE));
    for (const s of [-0.5, 0.5]) o.push(it(cx + s, r.z + 2.62, 0.34, 0.34, 0, 0.65, WOOD, { shape: 'cyl' }));
  }
  return o;
}
function bath(r) {
  const o = [];
  const tx = r.x + r.w - 0.42;
  o.push(it(tx, r.z + 0.62, 0.36, 0.5, 0, 0.4, WHITE));
  o.push(it(tx, r.z + 0.28, 0.4, 0.2, 0.4, 0.38, WHITE));
  const vw = Math.min(0.8, r.w - 0.95);
  o.push(it(r.x + 0.45, r.z + 0.3, vw, 0.5, 0, 0.85, WOOD));
  o.push(it(r.x + 0.45, r.z + 0.3, vw + 0.02, 0.52, 0.85, 0.04, WHITE));
  const sw = Math.min(1.0, r.w - 0.3, r.d < 2 ? 0.85 : 1.0);
  o.push(it(r.x + r.w / 2, r.z + r.d - 0.52, sw, 0.95, 0, 0.06, STONE));
  o.push(it(r.x + r.w / 2, r.z + r.d - 1.0, sw, 0.04, 0.06, 1.9, GLASS, { glass: true, plan: false }));
  return o;
}
function desk(r) {
  const dw = Math.min(1.5, r.w - 0.5),
    cx = r.x + r.w / 2,
    north = r.z === 0,
    z = north ? r.z + 0.4 : r.z + r.d - 0.4,
    dir = north ? 1 : -1;
  const o = [
    it(cx, z, dw, 0.6, 0.7, 0.05, WOOD),
    it(cx - (dw / 2 - 0.04), z, 0.08, 0.55, 0, 0.7, WOOD2, { plan: false }),
    it(cx + (dw / 2 - 0.04), z, 0.08, 0.55, 0, 0.7, WOOD2, { plan: false }),
    it(cx, z + dir * 0.7, 0.45, 0.45, 0, 0.46, BLACK),
    it(cx, z - dir * 0.05, 0.55, 0.05, 0.78, 0.32, BLACK, { plan: false }),
  ];
  if (r.w >= 4) o.push(it(r.x + 0.25, r.z + r.d / 2, 0.4, r.d - 0.6, 0, 1.8, SHELF));
  return o;
}
function gym(r) {
  const cx = r.x + r.w / 2,
    cz = r.z + r.d / 2;
  return [
    it(cx, cz, Math.min(2.0, r.w - 0.8), Math.min(2.4, r.d - 0.8), 0, 0.03, 0x2f3338),
    it(cx, cz + 0.2, 0.5, 1.2, 0.03, 0.4, 0x444b52),
    it(r.x + r.w - 0.4, r.z + 0.4, 0.4, 0.3, 0, 1.1, 0x3c444c),
  ];
}
function laundry(r) {
  return [
    it(r.x + 0.45, r.z + 0.45, 0.6, 0.62, 0, 0.85, WHITE),
    it(r.x + r.w - 0.4, r.z + 0.45, 0.6, 0.62, 0, 0.85, 0xe3e8ec),
  ];
}
/* blue poly water tank on a steel stand, with a pump beside it */
function tank(r) {
  const cx = r.x + r.w / 2,
    cz = r.z + r.d / 2 - 0.2,
    d = Math.min(1.4, r.w - 0.5);
  return [
    it(cx, cz, d + 0.1, d + 0.1, 0, 0.45, DARK),
    it(cx, cz, d, d, 0.45, 1.6, 0x3b7dd8, { shape: 'cyl' }),
    it(cx, cz, d * 0.5, d * 0.5, 2.05, 0.1, 0x2a5fa8, { shape: 'cyl' }),
    it(r.x + r.w - 0.35, r.z + r.d - 0.4, 0.4, 0.3, 0, 0.35, 0x6b7680),
  ];
}
/* tambayan: built-in L bench, rug and a low table */
function lounge(r) {
  const cx = r.x + r.w / 2,
    cz = r.z + r.d / 2;
  return [
    it(cx - 0.1, cz - 0.1, 2.3, 2.3, 0, 0.02, 0xc9b79a),
    it(r.x + r.w - 0.32, r.z + r.d / 2 + 0.2, 0.5, r.d - 1.3, 0, 0.45, SOFA),
    it(r.x + r.w - 0.09, r.z + r.d / 2 + 0.2, 0.16, r.d - 1.3, 0.45, 0.4, SOFA2),
    it(r.x + r.w / 2 - 0.4, r.z + r.d - 0.32, r.w - 1.7, 0.5, 0, 0.45, SOFA),
    it(r.x + r.w / 2 - 0.4, r.z + r.d - 0.09, r.w - 1.7, 0.16, 0.45, 0.4, SOFA2),
    it(cx - 0.1, cz - 0.1, 0.9, 0.9, 0, 0.4, WOOD),
  ];
}
function storage(r) {
  return [
    it(r.x + r.w - 0.25, r.z + r.d / 2, 0.4, r.d - 0.5, 0, 1.8, SHELF),
    it(r.x + 0.6, r.z + r.d - 0.5, 0.5, 0.5, 0, 0.4, 0xa5885f),
  ];
}
function closet(r) {
  const o = [it(r.x + 0.28, r.z + r.d / 2, 0.5, r.d - 0.7, 0, 2.1, SHELF)];
  if (r.w >= 2) o.push(it(r.x + r.w - 0.28, r.z + r.d / 2, 0.5, r.d - 0.7, 0, 2.1, SHELF));
  return o;
}
function hall(r) {
  return [it(r.x + r.w / 2, r.z + r.d / 2, r.w - 1.6, 0.5, 0, 0.02, 0xa7524a)];
}
function foyer(r) {
  return [
    it(r.x + r.w - 0.3, r.z + 0.35, 0.34, 0.34, 0, 0.3, WOOD2, { shape: 'cyl' }),
    it(r.x + r.w - 0.3, r.z + 0.35, 0.5, 0.5, 0.3, 0.7, GREEN, { shape: 'cyl' }),
  ];
}
function cars(r) {
  const o = [];
  const spec =
    r.w >= 6
      ? [
          [r.x + r.w / 4, 0xf2c230],
          [r.x + (r.w * 3) / 4, 0x4a90d9],
        ]
      : [[r.x + r.w / 2, 0xf2c230]];
  for (const [cx, col] of spec) {
    const L = 4.1,
      zc = r.z + 0.3 + L / 2;
    o.push(it(cx, zc, 1.8, L, 0.22, 0.5, col));
    o.push(it(cx, zc + 0.15, 1.6, L * 0.45, 0.72, 0.42, 0x1f272d));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        o.push(it(cx + sx * 0.9, zc + sz * 1.3, 0.2, 0.66, 0, 0.66, 0x151515, { shape: 'wheel', plan: false }));
  }
  return o;
}
function terrace(r) {
  const o = [];
  const n = Math.floor(r.d / 0.5);
  for (let i = 0; i < n; i++)
    o.push(it(r.x + r.w / 2, r.z + 0.25 + i * 0.5, r.w - 0.06, 0.46, 0, 0.05, i % 2 ? 0x9a6b3f : 0x8f6238));
  const rail = (x, z, w, d) => {
    o.push(it(x, z, w, d, 0.1, 0.95, GLASS, { glass: true, plan: false }));
    o.push(it(x, z, Math.max(w, 0.07), Math.max(d, 0.07), 1.05, 0.05, 0x5d4a33, { plan: false }));
  };
  if (r.x === 0) rail(0.05, r.z + r.d / 2, 0.05, r.d - 0.1);
  if (rn(r.z + r.d) === D) rail(r.x + r.w / 2, D - 0.05, r.w - 0.1, 0.05);
  if (rn(r.x + r.w) === W) rail(W - 0.05, r.z + r.d / 2, 0.05, r.d - 0.1);
  if (r.w >= 4) {
    o.push(it(r.x + 1.0, r.z + 2.3, 0.7, 1.7, 0.05, 0.35, 0xe6e0d0));
    o.push(it(r.x + 2.1, r.z + 2.3, 0.7, 1.7, 0.05, 0.35, 0xe6e0d0));
    o.push(it(r.x + 3.3, r.z + 2.7, 0.7, 0.7, 0.05, 0.5, WHITE, { shape: 'cyl' }));
  } else {
    o.push(it(r.x + 0.8, r.z + 2.5, 0.7, 1.7, 0.05, 0.35, 0xe6e0d0));
    o.push(it(r.x + 1.7, r.z + 3.0, 0.55, 0.55, 0.05, 0.5, WHITE, { shape: 'cyl' }));
  }
  o.push(it(r.x + 0.4, r.z + 0.4, 0.5, 0.5, 0.05, 0.45, WOOD2));
  o.push(it(r.x + 0.4, r.z + 0.4, 0.5, 0.5, 0.5, 0.45, GREEN, { shape: 'cyl' }));
  for (const [px, pz] of [
    [r.x + 0.12, r.z + 0.12],
    [r.x + r.w - 0.12, r.z + 0.12],
    [r.x + 0.12, r.z + r.d - 0.12],
    [r.x + r.w - 0.12, r.z + r.d - 0.12],
  ])
    o.push(it(px, pz, 0.1, 0.1, 0, 2.5, WOOD2, { plan: false }));
  for (let i = 0; i < 9; i++) o.push(it(r.x + r.w / 2, r.z + 0.2 + i * 0.42, r.w + 0.1, 0.1, 2.5, 0.08, WOOD2, { plan: false }));
  return o;
}

const BY_TYPE = {
  bed,
  sofa,
  table: dining,
  kitchen,
  bath,
  desk,
  gym,
  laundry,
  tank,
  lounge,
  storage,
  closet,
  hall,
  foyer,
  car: cars,
  terrace,
};

const furnCache = new Map();
export function furnish(f) {
  if (furnCache.has(f.id)) return furnCache.get(f.id);
  const items = [];
  f.rooms.forEach((r, ri) => {
    const fn = BY_TYPE[r.type];
    if (fn) for (const item of fn(r)) items.push({ ...item, room: ri });
  });
  furnCache.set(f.id, items);
  return items;
}

/* ---------- terrain (shared by 3D mesh + section drawing) ---------- */
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (x, z) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function vnoise(x, z) {
  const xi = Math.floor(x),
    zi = Math.floor(z),
    xf = x - xi,
    zf = z - zi;
  const u = xf * xf * (3 - 2 * xf),
    v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi),
    b = hash(xi + 1, zi),
    c = hash(xi, zi + 1),
    d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export const PIT = { x: W / 2 + 0.6, zN: -4.25, zS: D - 3.5 + 0.7, sideBlend: 2.5, southBlend: 3.0 };

export function baseHeight(x, z) {
  let y, amp;
  if (z < -4.3) {
    if (z > -11) {
      y = PLATEAU;
      amp = 0;
    } else {
      const d = -11 - z;
      y = PLATEAU + 17 * Math.tanh((0.5 * d) / 17);
      amp = smooth(0, 6, d);
    }
  } else {
    const t = z + 4.3;
    y = PLATEAU - 15 * Math.tanh((0.62 * t) / 15);
    y += 0.02 * Math.pow(Math.max(0, Math.abs(x) - 12), 1.5) * smooth(-4.3, 6, z);
    amp = smooth(1, 12, z) * (0.3 + 0.7 * smooth(6, 20, Math.abs(x)));
  }
  y += ((vnoise(x * 0.12 + 10, z * 0.12) - 0.5) * 3.2 + (vnoise(x * 0.35, z * 0.35) - 0.5) * 0.9) * amp;
  return y;
}

export function terrainHeight(x, z) {
  const b = baseHeight(x, z);
  if (z < PIT.zN) return b;
  const dx = Math.max(Math.abs(x) - PIT.x, 0) / PIT.sideBlend;
  const dz = Math.max(z - PIT.zS, 0) / PIT.southBlend;
  const m = 1 - smooth(0, 1, Math.hypot(dx, dz));
  return b + (PIT_Y - b) * m;
}
