import { FLOORS, TOTALS, css, ZONE, W, D, VARIANT } from './data.js';
import { icon } from './icons.js';
import { planSVG, sectionSVG } from './plan.js';

const $ = (s) => document.querySelector(s);
const state = { floor: 0, stage: '3d', explode: 0.18, mode: 'cutaway', time: 'day', roof: false, labels: true, env: true, spin: false, hl: -1 };
let api = null;

const f1 = (n) => n.toFixed(1);
const floorById = (id) => FLOORS.find((f) => f.id === id);

/* ---------- static UI ---------- */
const nCars = VARIANT.cars;
document.title = `Mountain House · ${VARIANT.title} · parking on 3F`;
$('#sizeLabel').textContent = VARIANT.title;
$('#sizeSeg').innerHTML = [
  ['70', 'Standard', '70 sqm · 2 cars'],
  ['50', 'Compact', '50 sqm · 1 car'],
]
  .map(
    ([k, t, s]) =>
      `<a role="button" href="?plan=${k}${location.hash}" aria-pressed="${VARIANT.key === k}" data-size="${k}"><b>${t}</b><small>${s}</small></a>`,
  )
  .join('');
$('#stats').innerHTML = [
  [`${+W.toFixed(1)} × ${+D.toFixed(1)} m`, 'Footprint'],
  [f1(TOTALS.perFloor) + ' m²', 'Per floor'],
  [f1(TOTALS.gross) + ' m²', 'Gross, 4 floors'],
  [f1(TOTALS.garage) + ` m²`, `Garage, ${nCars} car${nCars > 1 ? 's' : ''}`],
  [f1(TOTALS.terrace) + ' m²', 'View terrace'],
  [f1(TOTALS.interior) + ' m²', 'Interior'],
]
  .map(([v, k]) => `<div><dd>${v}</dd><dt>${k}</dt></div>`)
  .join('');

$('#floorBtns').innerHTML =
  `<button type="button" class="floor-btn" data-floor="0" aria-pressed="true"><span class="badge" style="--c:#eef3ec">ALL</span><span><b>Whole house</b><small>Stacked cutaway with the mountain</small></span></button>` +
  FLOORS.map(
    (f) =>
      `<button type="button" class="floor-btn" data-floor="${f.id}" aria-pressed="false"><span class="badge" style="--c:${css(f.color)}">${f.short}</span><span><b>${f.name.split('·')[1].trim()}</b><small>${f.tag}</small></span></button>`,
  ).join('');

$('#chips').innerHTML = [
  ['roof', 'house', 'Roof'],
  ['labels', 'tag', 'Labels'],
  ['env', 'mountain', 'Terrain'],
  ['spin', 'rotate', 'Auto-rotate'],
]
  .map(([k, ic, t]) => `<button type="button" class="chip" data-chip="${k}" aria-pressed="${state[k]}">${icon(ic, 15)}${t}</button>`)
  .join('');

$('#stageTabs').innerHTML = [
  ['3d', 'cube', '3D model'],
  ['plan', 'plan', 'Plan'],
  ['section', 'section', 'Section'],
]
  .map(([k, ic, t]) => `<button type="button" role="tab" data-stage="${k}" aria-selected="${k === '3d'}">${icon(ic, 16)}${t}</button>`)
  .join('');

$('#viewBtns').innerHTML = [['iso', 'Iso'], ['top', 'Top'], ['road', 'Road'], ['valley', 'Valley']]
  .map(([k, t]) => `<button type="button" data-view="${k}">${t}</button>`)
  .join('');

$('#timeBtns').innerHTML = [['day', 'sun', 'Day'], ['sunset', 'sunset', 'Sunset'], ['night', 'moon', 'Night']]
  .map(([k, ic, t]) => `<button type="button" data-time="${k}" aria-pressed="${k === 'day'}" aria-label="${t}" title="${t}">${icon(ic, 17)}</button>`)
  .join('');

$('#snap').innerHTML = `${icon('camera', 16)}Snapshot`;

$('#hud').innerHTML = `
  <div class="compass">
    <span>${icon('up', 15)}<b>North, uphill:</b> mountain road, level with 3F</span>
    <span>${icon('car', 15)}Garage doors face the road</span>
    <span>${icon('down', 15)}<b>South, downhill:</b> valley view and terraces</span>
  </div>
  <div class="hint"><b>Drag</b> orbit · <b>Scroll</b> zoom · <b>Right-drag</b> pan<br>Click a floor to isolate it · keys <b>0–4</b></div>`;

$('#note').innerHTML = `${icon('warn', 16)}<span>Layout concept only, not for construction. A real build on a slope needs a soil test, a structural engineer, retaining walls and drainage design.</span>`;

$('#flow').innerHTML = [
  ['car', '<b>Arrive on 3F.</b> Road, garage, foyer. All flat.'],
  ['up', '<b>Up one flight (4F).</b> Kitchen, dining, living, terrace.'],
  ['down', '<b>Down one flight (2F).</b> All bedrooms, away from road noise.'],
  ['down', `<b>Down again (1F).</b> ${VARIANT.cars > 1 ? 'Family room, guest suite, gym, laundry.' : 'Family room, guest room, laundry, storage.'}`],
  ['stairs', 'One U-shaped stair in the north-east corner of every floor, so plumbing and structure stack.'],
]
  .map(([ic, t]) => `<li>${icon(ic, 17)}<span>${t}</span></li>`)
  .join('');

/* ---------- render ---------- */
function renderInfo() {
  const f = floorById(state.floor);
  const planFloor = f || floorById(3);
  if (f) {
    $('#infoTag').textContent = f.tag;
    $('#infoTitle').textContent = f.name;
    $('#infoDesc').textContent = f.desc;
    $('#roomList').innerHTML = f.rooms
      .map((r, i) => `<li data-room="${i}"><span><i class="dot" style="--c:${css(ZONE[r.zone])}"></i>${r.name}</span><span class="m">${f1(r.area)} m²</span></li>`)
      .join('');
    $('#floorTotal').textContent = f1(f.rooms.reduce((s, r) => s + r.area, 0)) + ' m²';
  } else {
    $('#infoTag').textContent = 'Overview';
    $('#infoTitle').textContent = 'Four floors · ' + f1(TOTALS.gross) + ' m² gross';
    $('#infoDesc').textContent = 'Road level is Floor 3. Two floors sit below the road, one above it. Showing the road-level plan; pick a floor to switch.';
    $('#roomList').innerHTML = FLOORS.map(
      (x) => `<li data-pick="${x.id}"><span><i class="dot" style="--c:${css(x.color)}"></i>${x.short} · ${x.name.split('·')[1].trim()}</span><span class="m">${x.rooms.length} rooms</span></li>`,
    ).join('');
    $('#floorTotal').textContent = f1(TOTALS.gross) + ' m²';
  }
  $('#miniPlan').innerHTML = planSVG(planFloor, { compact: true, highlight: state.hl });
  $('#miniSection').innerHTML = sectionSVG(state.floor);
}

function renderPlanStage() {
  const host = $('#planStage');
  if (state.stage === 'plan') {
    if (state.floor) host.innerHTML = `<div class="single">${planSVG(floorById(state.floor), { highlight: state.hl })}</div>`;
    else
      host.innerHTML = `<div class="grid">${[...FLOORS]
        .reverse()
        .map((f) => `<figure data-fig="${f.id}"><figcaption>${icon(f.id === 3 ? 'car' : 'layers', 16)}${f.name}</figcaption>${planSVG(f, { compact: true })}</figure>`)
        .join('')}</div>`;
  } else if (state.stage === 'section') {
    host.innerHTML = `<div class="section-wrap">${sectionSVG(state.floor)}</div>`;
  }
}

function syncPressed() {
  document.querySelectorAll('[data-floor].floor-btn').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.floor === state.floor)));
  document.querySelectorAll('[data-stage]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.stage === state.stage)));
  document.querySelectorAll('#modeSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  document.querySelectorAll('[data-time]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.time === state.time)));
  document.querySelectorAll('[data-chip]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.chip])));
  const is3d = state.stage === '3d';
  $('#viewBtns').hidden = !is3d;
  $('#timeBtns').hidden = !is3d;
  $('#snap').hidden = !is3d;
  $('#hud').hidden = !is3d;
  $('#scene').hidden = !is3d;
  $('#planStage').hidden = is3d;
  if (api) api.pause(!is3d);
}

function setFloor(id, { fromHash = false } = {}) {
  state.floor = id;
  state.hl = -1;
  if (api) api.setFloor(id);
  syncPressed();
  renderInfo();
  renderPlanStage();
  if (!fromHash) history.replaceState(null, '', id ? '#f' + id : location.pathname + location.search);
}
function setStage(s) {
  state.stage = s;
  syncPressed();
  renderPlanStage();
  if (s === '3d') window.dispatchEvent(new Event('resize'));
}
function setHighlight(ri) {
  if (ri === state.hl) return;
  state.hl = ri;
  const f = floorById(state.floor) || floorById(3);
  document.querySelectorAll('.plan .room').forEach((el) => el.classList.toggle('hl', +el.dataset.room === ri));
  document.querySelectorAll('#roomList li').forEach((el) => el.classList.toggle('hl', el.dataset.room !== undefined && +el.dataset.room === ri));
  if (api) api.highlightRoom(f.id, ri);
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  const fb = t.closest('[data-floor].floor-btn');
  if (fb) return setFloor(+fb.dataset.floor);
  const sf = t.closest('.sec-floor');
  if (sf) return setFloor(+sf.dataset.floor === state.floor ? 0 : +sf.dataset.floor);
  const pk = t.closest('[data-pick]');
  if (pk) return setFloor(+pk.dataset.pick);
  const fig = t.closest('[data-fig]');
  if (fig) return setFloor(+fig.dataset.fig);
  const st = t.closest('[data-stage]');
  if (st) return setStage(st.dataset.stage);
  const vw = t.closest('[data-view]');
  if (vw && api) return api.setView(vw.dataset.view);
  const tm = t.closest('[data-time]');
  if (tm) {
    state.time = tm.dataset.time;
    if (api) api.setTime(state.time);
    return syncPressed();
  }
  const md = t.closest('#modeSeg button');
  if (md) {
    state.mode = md.dataset.mode;
    state.roof = state.mode === 'exterior';
    if (api) { api.setMode(state.mode); api.setRoof(state.roof); }
    return syncPressed();
  }
  const ch = t.closest('[data-chip]');
  if (ch) {
    const k = ch.dataset.chip;
    state[k] = !state[k];
    if (api) ({ roof: api.setRoof, labels: api.setLabels, env: api.setEnv, spin: api.setSpin })[k](state[k]);
    return syncPressed();
  }
  if (t.closest('#miniPlan')) return setStage('plan');
  if (t.closest('#snap') && api) {
    const a = document.createElement('a');
    a.href = api.snapshot();
    a.download = `mountain-house-${state.floor ? FLOORS[state.floor - 1].short : 'all'}.png`;
    a.click();
  }
});

document.addEventListener('mouseover', (e) => {
  const r = e.target.closest('.plan .room, #roomList li[data-room]');
  setHighlight(r ? +r.dataset.room : -1);
});

$('#explode').addEventListener('input', (e) => {
  state.explode = e.target.value / 100;
  $('#explodeVal').textContent = e.target.value + '%';
  if (api) api.setExplode(state.explode);
});

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[0-4]$/.test(e.key)) setFloor(+e.key);
  else if (e.key === 'Enter' || e.key === ' ') {
    const sf = e.target.closest && e.target.closest('.sec-floor');
    if (sf) { e.preventDefault(); setFloor(+sf.dataset.floor === state.floor ? 0 : +sf.dataset.floor); }
  }
});

window.addEventListener('hashchange', () => {
  const m = /^#f([0-4])$/.exec(location.hash);
  setFloor(m ? +m[1] : 0, { fromHash: true });
});

/* ---------- boot ---------- */
(function initState() {
  const m = /^#f([0-4])$/.exec(location.hash);
  if (m) state.floor = +m[1];
})();
syncPressed();
renderInfo();
renderPlanStage();

function showFallback(msg) {
  const fb = $('#fallback');
  fb.hidden = false;
  fb.innerHTML = `<strong>3D view is not available here</strong><span>${msg}</span><span>The floor plans and section still work. Switch to Plan or Section.</span>`;
  setStage('plan');
}

(async function boot3d() {
  const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
  if (!gl) return showFallback('This browser or device has WebGL turned off.');
  try {
    const { createScene } = await import('./scene.js');
    api = createScene($('#scene'), { onPick: (id) => setFloor(id) });
    api.setExplode(state.explode);
    if (state.floor) api.setFloor(state.floor);
    api.setMode(state.mode);
    api.setRoof(state.roof);
    syncPressed();
  } catch (err) {
    console.error(err);
    showFallback('The 3D engine failed to load. Check the console for details.');
  }
})();
