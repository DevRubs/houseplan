// Layout sanity check, run for both sizes (70 and 50):
// every floor must tile its footprint exactly, rooms must not overlap,
// and every door / window must sit on a real wall.
let bad = 0;
const fail = (m) => {
  bad++;
  console.error('  FAIL ' + m);
};

for (const plan of ['70', '50']) {
  globalThis.__MH_PLAN__ = plan;
  const { FLOORS, W, D, TOTALS, wallModel, rn, STAIR, LANES } = await import(`../assets/data.js?plan=${plan}`);
  console.log(`\n=== Plan ${plan}: ${W} x ${D} m ===`);

  for (const f of FLOORS) {
    console.log(`${f.short} ${f.name}`);
    const area = rn(f.rooms.reduce((s, r) => s + r.w * r.d, 0));
    if (Math.abs(area - W * D) > 0.01) fail(`${f.short}: rooms sum to ${area} sqm, expected ${W * D}`);

    for (const r of f.rooms) {
      if (r.x < 0 || r.z < 0 || rn(r.x + r.w) > W || rn(r.z + r.d) > D) fail(`${f.short} ${r.name} leaves the footprint`);
    }
    for (let i = 0; i < f.rooms.length; i++)
      for (let j = i + 1; j < f.rooms.length; j++) {
        const a = f.rooms[i],
          b = f.rooms[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oz = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
        if (ox > 0.001 && oz > 0.001) fail(`${f.short} ${a.name} overlaps ${b.name}`);
      }

    const stairRoom = f.rooms.find((r) => r.type === 'stair');
    if (!stairRoom || stairRoom.x !== STAIR.x || stairRoom.w !== STAIR.w) fail(`${f.short}: stair room does not match STAIR (stacking)`);

    const { segments, openings } = wallModel(f);
    for (const op of openings) {
      const hit = segments.some(
        (s) => s.o === op.o && s.at === op.at && op.a >= s.a - 1e-6 && op.a + op.w <= s.b + 1e-6,
      );
      if (!hit) fail(`${f.short} ${op.k} at ${op.o}${op.at} a=${op.a} w=${op.w} is not on a wall`);
    }
    console.log(`  ${f.rooms.length} rooms, ${area} sqm, ${segments.length} wall runs, ${openings.length} openings`);
  }
  console.log('Totals', TOTALS, 'lanes', LANES);
}

if (bad) {
  console.error(`\n${bad} problem(s)`);
  process.exit(1);
}
console.log('\nBoth sizes tile their footprint. OK');
