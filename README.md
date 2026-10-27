# Mountain House

Interactive 3D floor plan of a four-storey mountain house. The road meets the **third floor**, so the garage is at street level, bedrooms sit one floor below and the living floor sits on top for the view.

Two sizes, switch in the sidebar or with a URL param:

| Size | URL | Footprint | Per floor | Garage |
|------|-----|-----------|-----------|--------|
| Standard | `?plan=70` (default) | 10 × 7 m | 70 m² | 2 cars |
| Compact | `?plan=50` | 7 × 7.2 m | 50.4 m² | 1 car |

Concept layout only. Not for construction: a real build on a slope needs a soil test, a structural engineer, retaining walls and drainage design.

## Run locally

It's a static site with ES modules, so it needs an HTTP server (not `file://`).

```bash
npx serve .
# or
python -m http.server 8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (the site is at the repo root).
2. Repo **Settings → Pages → Build and deployment**: source **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

All paths are relative and three.js is vendored in `vendor/`, so there is no build step and no CDN.

## Edit the layout

Everything lives in `assets/data.js`: `FLOORS_70` and `FLOORS_50` list rooms (`R(name, x, z, w, d, zone, type)`) and doors/windows. The 2D plans, section, 3D walls and furniture are all generated from it.

```bash
npm run check
```

verifies, for both sizes, that every floor tiles its footprint exactly, rooms do not overlap, the stair stacks, and every opening sits on a real wall.

## Controls

Drag to orbit, scroll to zoom, right-drag to pan. Keys `0`–`4` pick whole house or a floor. Tabs: 3D model, Plan, Section. Deep links: `#f0`–`#f4`.

## Credits

- [three.js](https://threejs.org) r160, MIT, vendored in `vendor/`
- Icons from [Lucide](https://lucide.dev), ISC
