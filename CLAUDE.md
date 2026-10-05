# hunt-app — instructions for Claude

A self-hosted, free-data whitetail hunting map for Missouri (Callaway + Cooper first): parcels, 3D terrain, weather,
scent/thermal modeling, AI terrain layers, a stand/route planner, and a hunt journal with a Claude analyst.
Run/build steps: README.md. Plan and status: docs/07-build-plan.md.

## The hunting brain — standing orders

This app is only as good as what it knows about mature bucks on *this hunter's* ground. Book research is the starting
point, not the answer. Everything the hunter tells you is data to learn from.

1. **Capture every piece of field knowledge.** When the hunter shares anything about deer, sign, stands, wind,
   thermals, weather, pressure, a sighting or a kill story, add it to `docs/brain/field-knowledge.md` as an [H] entry:
   what he said, the date, the **mechanism** (why a mature buck does that), and what the app does or should do about it.
2. **Ask why.** If he stresses something (he raised thermals unprompted), treat it as a signal: work out the mechanism,
   check whether the models handle it, and ask the follow-up that would make it encodable (add it under "Open questions").
3. **When he says the app is wrong, it's a lesson.** Add an L-entry with root cause → fix → the general rule, then fix
   the code (pipeline/planner/scent) in the same change. Example: L1, a stand planned over Little Dixie Lake.
4. **Evidence order:** his repeated field record [H] > proven pressured/public-land hunters [E] (Eberhart, Infalt, The
   Hunting Public's public-land hunts; not farm/outfitter TV) > research [R] for population-level effects > model output
   > folklore [F]. Say when data is thin; never invent certainty.
5. **Turn knowledge into behavior.** Findings should end up as planner rules/weights, pipeline changes, or journal
   fields — not just prose. Keep `docs/brain/knowledge.md` (the expert core the analyst reads) current and compact.
6. **Update these instructions and the agents** (`.claude/agents/`) when a finding changes how work should be done.
7. **Keep his spots private.** Exact coordinates of proven spots, kills and stand sites live only in the database
   (journal, brain_insights, features). Committed docs get the generalized lesson, never the coordinates — the repo may
   go to GitHub someday.
8. **Don't learn from his pins unless he says so.** Map pins are private notes. Never draw conclusions from them
   or use them as evidence unless he marks a pin as knowledge (field-knowledge L6); then use exactly what he said.
   Refer to pins by number (#133).

Use the `hunt-brain` agent (`.claude/agents/hunt-brain.md`) to digest a batch of stories/sightings or to review the
journal and update the brain files.

## Counties
Loaded: Callaway, Cooper, Cole, Boone (parcels + terrain AI). Adding a county: follow the playbook in
`docs/research/08-county-parcel-sources.md` and record what you find there.

## Architecture pointers
- `web/` Vite + React + MapLibre. Planner `src/planner.ts`; scent/thermals `src/scent.ts`; terrain sampling
  `src/terrain.ts`; journal + analyst UI `src/journal.tsx`;
  field notes (hunt log in his words, sightings by time, other hunters, stand verdicts) `src/fieldnotes.tsx` + `api/src/hunts.ts`;
  trail cameras (photos on camera pins, tagged per visit, weather per photo) `src/cameras.tsx` + `api/src/cameras.ts`,
  files in `data/photos/` (gitignored).
  Parcel groups (owner last name per county, union analysis, saved per user, "Plan this group") `src/groups.tsx` + `api/src/groups.ts`.
- `api/` Hono on Node 24 (TS runs natively). Journal enrichment `src/journal.ts` (Open-Meteo ERA5 history, fronts,
  normals, moon/sun); analyst `src/brain.ts` runs the local Claude Code CLI (`claude -p`, no tools, JSON schema) under
  his subscription. No API key: he won't pay for the API, and the app is local and his alone. It reads the journal,
  field notes, tagged camera visits, marked pins and `docs/brain/*.md`.
- Forced-path pinches: `pipeline/pinches.py <Counties>` (resumable, per-window cache in `data/cache/pinches/`) →
  `pinches` table → "Pinches (forced paths)" overlay.
- `pipeline/` Python terrain model → `data/tiles` + PostGIS. Re-run after model changes:
  `pipeline/.venv/Scripts/python pipeline/terrain.py Callaway Cooper Cole Boone`.
- Public-area hunting zones (`area_zones`, e.g. Little Dixie Lake CA) are traced from MDC area maps:
  `docs/research/09-area-regulations.md`. The planner never puts a stand in a closed zone.
- DB: native PostgreSQL 18 + PostGIS (Docker is broken on this machine). Migrations in `db/migrations`, `npm run migrate`.

## Running it / remote access
- One server: the API (port 8787) also serves the built app (`web/dist`). `start.ps1` (desktop shortcut "Hunt App")
  builds, starts it and opens http://localhost:8787. The old `vite preview` on 4173 is retired.
- Remote use: Tailscale Funnel proxies https://asus-tuf.tailf5a72a.ts.net to 127.0.0.1:8787 (`tailscale funnel --bg
  8787`; it persists across reboots, but the app must be running). `isLocal()` in `api/src/auth.ts` (Host header) gates
  the internet side: no sign-ups, login throttled (8 per 15 min per address), secure cookies, and `/imagery` needs a
  login. Never weaken these. Same login and data as on the PC.

## Map loading (keep it fast)
- MSDIS aerials take 4–7 s per tile upstream (their cache is UTM). They're served by the API's public `/imagery`
  route, cached in `data/cache/<basemap>/` forever, and fetched from the *other* local host name (127.0.0.1 vs
  localhost) so slow first-time tiles get their own browser connections. Esri World Imagery (fast CDN, pre-cut
  tiles) sits underneath at every zoom and is also a base map on its own. It's never disk-cached (Esri terms).
- USGS topo and the Mapterhorn DEM go through the same `/imagery` disk cache, and the preloader fills them
  around pins and the last view, so a slow or dropped connection doesn't blank areas already seen.
- Slope is computed in the browser from the Mapterhorn DEM (`slope://` protocol in `terrainai.ts`, ~3 m baseline).
  USGS's slope service took ~13 s per tile and stalled everything else.
- Overlays load from zoom 14.5 (`DETAIL_MINZOOM`); property lines 13.5, markers, slope and pinches 14 (`START_ZOOM`).
- Background preloading (`startPrefetch` in `api/src/tiles.ts`): two workers fill the aerial cache around every pin
  (z14–17 within 1.5 km, z18 within 400 m) and around wherever the map sat still for 3 s. They pause whenever the
  map requested a tile in the last 4 s. The readout at the top shows the zoom level.
- AI terrain features and landforms have per-kind switches (`prefs.tfOff`, `prefs.landformOff`); landform classes
  are cleared per tile in the browser (`landform://` protocol).
- Overlay layers start hidden in `buildStyle`. The app applies his layer choices on `style.load`, never `load`:
  `load` waits for every first tile. The Layers panel has a "Clear map" button.

## Environment quirks
- System `PROJ_LIB` points at PostGIS's old proj.db; `pipeline/sources.py` overrides it for rasterio.
- The Claude browser pane pauses MapLibre when hidden (no requestAnimationFrame) — reopen it with preview_start before
  visual checks; dev servers are `hunt-api` / `hunt-web` in `DEV/.claude/launch.json`.
- Stay free/self-hosted (no Turso/Supabase/Neon). The analyst uses his Claude Code subscription, no API key.
