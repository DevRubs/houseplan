import {
  FLOORS,
  W,
  D,
  ZONE,
  css,
  rn,
  wallModel,
  furnish,
  LANES,
  terrainHeight,
  ROAD_Y,
  PIT_Y,
} from './data.js';

const S = 52; // px per metre
const MX = 52;
const MY = 58;
const VW = MX * 2 + W * S;
const VH = MY + D * S + 64;
const px = (x) => rn(MX + x * S);
const py = (z) => rn(MY + z * S);
const f1 = (n) => n.toFixed(1);

/* wrap a room name to fit its width */
function wrap(text, maxChars) {
  const words = text.replace(' · ', ' ').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/* subtract opening ranges from a wall run */
function wallPieces(seg, ops) {
  const inside = ops
    .filter((o) => o.o === seg.o && o.at === seg.at && o.a >= seg.a - 1e-6 && o.a + o.w <= seg.b + 1e-6)
    .sort((p, q) => p.a - q.a);
  const out = [];
  let cur = seg.a;
  for (const o of inside) {
    if (o.a > cur) out.push([cur, o.a]);
    cur = o.a + o.w;
  }
  if (cur < seg.b) out.push([cur, seg.b]);
  return out;
}

const line = (x1, y1, x2, y2, cls, extra = '') =>
  `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;

function doorGlyph(op) {
  const { o, at, a, w, s, f, k } = op;
  let hx, hz, cx, cz, tx, tz, cross;
  if (o === 'H') {
    hx = f === 1 ? a : a + w;
    hz = at;
    cx = hx + (f === 1 ? w : -w);
    cz = at;
    tx = hx;
    tz = at + s * w;
    cross = f * s;
  } else {
    hx = at;
    hz = f === 1 ? a : a + w;
    cx = at;
    cz = hz + (f === 1 ? w : -w);
    tx = at + s * w;
    tz = hz;
    cross = -(f * s);
  }
  const r = w * S;
  const cls = k === 'entry' ? 'door-leaf entry' : 'door-leaf';
  return (
    line(px(hx), py(hz), px(tx), py(tz), cls) +
    `<path class="door-arc" d="M${px(cx)} ${py(cz)} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${px(tx)} ${py(tz)}"/>`
  );
}

function openingGlyph(op) {
  const { o, at, a, w, k } = op;
  const x1 = o === 'H' ? px(a) : px(at);
  const y1 = o === 'H' ? py(at) : py(a);
  const x2 = o === 'H' ? px(a + w) : px(at);
  const y2 = o === 'H' ? py(at) : py(a + w);
  if (k === 'window') return line(x1, y1, x2, y2, 'win-glass') + line(x1, y1, x2, y2, 'win-core');
  if (k === 'slider') {
    const d = 3;
    const [ox, oy] = o === 'H' ? [0, d] : [d, 0];
    return (
      line(x1, y1, x2, y2, 'win-glass') +
      line(x1 - ox, y1 - oy, x2 - ox, y2 - oy, 'slide') +
      line(x1 + ox, y1 + oy, x2 + ox, y2 + oy, 'slide')
    );
  }
  if (k === 'garage') return line(x1, y1, x2, y2, 'garage-door');
  if (k === 'door' || k === 'entry') return doorGlyph(op);
  return '';
}

function stairGlyph(r) {
  const { x0, mid, x1 } = LANES;
  let h = `<rect class="stair-bg" x="${px(x0)}" y="${py(0.1)}" width="${rn((x1 - x0) * S)}" height="${rn(2.9 * S)}"/>`;
  for (let i = 0; i <= 5; i++) {
    const z = 3.0 - i * 0.3;
    h += line(px(x0), py(z), px(mid - 0.05), py(z), 'tread');
    h += line(px(mid + 0.05), py(z), px(x1), py(z), 'tread');
  }
  h += line(px(mid), py(0.1), px(mid), py(3.0), 'tread stringer');
  const ax = px((x0 + mid) / 2);
  h += `<path class="stair-arrow" d="M${ax} ${py(2.9)} V${py(1.2)} M${ax - 5} ${py(1.6)} L${ax} ${py(1.2)} L${ax + 5} ${py(1.6)}"/>`;
  const bx = px((mid + x1) / 2);
  h += `<path class="stair-arrow dim" d="M${bx} ${py(0.4)} V${py(1.9)}"/>`;
  return h;
}

function item2d(it) {
  const fill = css(it.c);
  if (it.shape === 'cyl')
    return `<circle class="fx" cx="${px(it.x)}" cy="${py(it.z)}" r="${rn((it.w / 2) * S)}" fill="${fill}"/>`;
  return `<rect class="fx" x="${px(it.x - it.w / 2)}" y="${py(it.z - it.d / 2)}" width="${rn(it.w * S)}" height="${rn(it.d * S)}" fill="${fill}" rx="${it.h < 0.1 ? 0 : 3}"/>`;
}

export function planSVG(floor, { compact = false, highlight = -1 } = {}) {
  const model = wallModel(floor);
  let h = '';

  /* rooms */
  floor.rooms.forEach((r, i) => {
    h += `<rect class="room${i === highlight ? ' hl' : ''}" data-room="${i}" x="${px(r.x)}" y="${py(r.z)}" width="${rn(r.w * S)}" height="${rn(r.d * S)}" fill="${css(ZONE[r.zone])}"/>`;
  });

  /* furniture */
  for (const it of furnish(floor)) if (it.plan !== false) h += item2d(it);
  floor.rooms.forEach((r) => {
    if (r.type === 'stair') h += stairGlyph(r);
  });

  /* walls */
  for (const seg of model.segments) {
    const cls = seg.side === 'I' ? 'wall-int' : 'wall-ext';
    for (const [a, b] of wallPieces(seg, model.openings)) {
      if (seg.o === 'H') h += line(px(a), py(seg.at), px(b), py(seg.at), cls);
      else h += line(px(seg.at), py(a), px(seg.at), py(b), cls);
    }
  }
  /* terrace edge */
  floor.rooms.forEach((r) => {
    if (r.type !== 'terrace') return;
    const e = (x1, z1, x2, z2) => line(px(x1), py(z1), px(x2), py(z2), 'rail');
    if (r.x === 0) h += e(0, r.z, 0, r.z + r.d);
    if (rn(r.z + r.d) === D) h += e(r.x, D, r.x + r.w, D);
    if (rn(r.x + r.w) === W) h += e(W, r.z, W, r.z + r.d);
  });

  /* openings */
  for (const op of model.openings) h += openingGlyph(op);

  /* labels */
  floor.rooms.forEach((r) => {
    if (r.type === 'stair') {
      h += `<text class="lbl small" x="${px(r.x + r.w / 2)}" y="${py(r.z + r.d) + 15}" text-anchor="middle">STAIR</text>`;
      return;
    }
    const wpx = r.w * S,
      small = r.w < 1.9 || r.d < 1.6;
    const fs = small ? 11.5 : 14;
    const lines = wrap(r.name, Math.max(6, Math.floor(wpx / (fs * 0.56))));
    const showArea = !compact && !small && r.d >= 1.6;
    const total = lines.length + (showArea ? 0.9 : 0);
    const cx = px(r.x + r.w / 2);
    let cy = py(r.z + r.d / 2) - (total - 1) * fs * 0.55 + (r.type === 'car' || r.type === 'terrace' ? 0 : 0);
    if (r.type === 'car') cy = py(r.z) + 18;
    if (r.type === 'terrace') cy = py(r.z + r.d) - 18 - (lines.length - 1) * fs * 1.1 - (showArea ? 14 : 0);
    lines.forEach((t, li) => {
      h += `<text class="lbl${small ? ' small' : ''}" x="${cx}" y="${rn(cy + li * fs * 1.1)}" text-anchor="middle">${t}</text>`;
    });
    if (showArea)
      h += `<text class="lbl area" x="${cx}" y="${rn(cy + lines.length * fs * 1.1 + 2)}" text-anchor="middle">${f1(r.area)} m²</text>`;
  });

  /* dimensions */
  const dy = MY - 26,
    dx = MX - 28;
  h += line(px(0), dy, px(W), dy, 'dim');
  h += line(px(0), dy - 5, px(0), dy + 5, 'dim') + line(px(W), dy - 5, px(W), dy + 5, 'dim');
  h += `<text class="dim-t" x="${W < 8 ? px(0) : px(W / 2)}" y="${dy - 6}" text-anchor="${W < 8 ? 'start' : 'middle'}">${f1(W)} m</text>`;
  h += line(dx, py(0), dx, py(D), 'dim');
  h += line(dx - 5, py(0), dx + 5, py(0), 'dim') + line(dx - 5, py(D), dx + 5, py(D), 'dim');
  h += `<text class="dim-t" transform="translate(${dx - 7} ${py(D / 2)}) rotate(-90)" text-anchor="middle">${f1(D)} m</text>`;

  /* orientation */
  const road = floor.id === 3;
  h += `<text class="orient${road ? ' road' : ''}" x="${px(W) }" y="${dy - 6}" text-anchor="end">${road ? 'N · ROAD LEVEL, ENTER HERE' : 'N · UPHILL'}</text>`;
  h += `<text class="orient" x="${px(W)}" y="${py(D) + 22}" text-anchor="end">S · VALLEY VIEW</text>`;

  /* scale bar */
  const sx = px(0),
    sy = py(D) + 22;
  h += line(sx, sy, sx + 2 * S, sy, 'scalebar') + line(sx, sy - 4, sx, sy + 4, 'scalebar') + line(sx + 2 * S, sy - 4, sx + 2 * S, sy + 4, 'scalebar');
  h += `<text class="orient" x="${sx + 2 * S + 8}" y="${sy + 4}">2 m</text>`;

  return `<svg class="plan" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${floor.name} plan">${h}</svg>`;
}

/* ---------- section A–A: looking east, road on the left ---------- */
export function sectionSVG(active = 0) {
  const SC = 15,
    ox = 14,
    oy = 14,
    z0 = -14,
    z1 = 14,
    ymax = 14.5,
    ymin = -3.2;
  const X = (z) => rn(ox + (z - z0) * SC);
  const Y = (y) => rn(oy + (ymax - y) * SC);
  const vw = ox * 2 + (z1 - z0) * SC,
    vh = oy * 2 + (ymax - ymin) * SC;

  let t = `M${X(z0)} ${Y(ymin)}`;
  for (let z = z0; z <= z1 + 1e-6; z += 0.25) t += ` L${X(z)} ${Y(Math.min(terrainHeight(0, z), ymax))}`;
  t += ` L${X(z1)} ${Y(ymin)} Z`;

  let h = `<path class="earth" d="${t}"/>`;
  h += `<rect class="wall-c" x="${X(-4.25)}" y="${Y(6.2)}" width="${rn(0.5 * SC)}" height="${rn((6.2 - PIT_Y) * SC)}"/>`;
  h += `<rect class="road" x="${X(-10.3)}" y="${Y(ROAD_Y)}" width="${rn(3.6 * SC)}" height="${rn(0.3 * SC)}"/>`;
  h += `<rect class="road apron" x="${X(-6.7)}" y="${Y(ROAD_Y)}" width="${rn(3 * SC)}" height="${rn(0.14 * SC)}"/>`;

  for (const f of FLOORS) {
    const dim = active && active !== f.id;
    h += `<g class="sec-floor${dim ? ' dim' : ''}${active === f.id ? ' on' : ''}" data-floor="${f.id}" tabindex="0" role="button" aria-label="${f.name}">`;
    h += `<rect x="${X(-3.7)}" y="${Y(f.base + 3)}" width="${rn((D + 0.4) * SC)}" height="${rn(3 * SC)}" fill="${css(f.color)}"/>`;
    h += `<rect class="slab" x="${X(-3.9)}" y="${Y(f.base + 0.28)}" width="${rn((D + 0.8) * SC)}" height="${rn(0.28 * SC)}"/>`;
    h += `<text class="sec-t" x="${X((D - 7) / 2)}" y="${Y(f.base + 1.45)}" text-anchor="middle">${f.short} · ${f.name.split('·')[1].trim()}</text>`;
    h += `</g>`;
  }
  h += `<rect class="slab roof" x="${X(-3.9)}" y="${Y(12.28)}" width="${rn((D + 0.8) * SC)}" height="${rn(0.28 * SC)}"/>`;

  /* road-level datum */
  h += `<line class="datum" x1="${X(-13.2)}" y1="${Y(ROAD_Y)}" x2="${X(D - 3.5 + 0.4)}" y2="${Y(ROAD_Y)}"/>`;
  h += `<text class="sec-n" x="${X(-13.2)}" y="${Y(ROAD_Y) - 8}">ROAD = 3F LEVEL</text>`;
  h += `<text class="sec-n" x="${X(-13.2)}" y="${Y(ROAD_Y) - 22}">UPHILL</text>`;
  h += `<text class="sec-n" x="${X(13.2)}" y="${Y(-1.2)}" text-anchor="end">VALLEY</text>`;
  h += `<text class="sec-n" x="${X(13.6)}" y="${Y(14)}" text-anchor="end">SECTION A–A · LOOKING EAST</text>`;

  return `<svg class="section" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="Section through the slope">${h}</svg>`;
}
