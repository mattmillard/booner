# Phased Build Plan

Each phase ends with something you can open and use. Later phases build on earlier ones and never force a rewrite. Research backing for each decision: `research/01`–`05`.

---

## Guiding decisions

| Decision | Choice | Why |
|---|---|---|
| Map renderer | **MapLibre GL JS** | Free, open, 3D terrain, PMTiles, native SDKs for mobile later |
| Frontend | **Vite + React + TypeScript** (SPA) | Static build → Vercel today, Capacitor (Android/iOS) later, same code |
| API | **Node + Hono** | Tiny, TypeScript, runs on a VPS/home box or as Vercel functions |
| Database | **PostgreSQL + PostGIS**, self-hosted. Local dev uses the machine's existing PostgreSQL 18.6 + PostGIS 3.6.2 (Docker Desktop is broken on this machine and WSL isn't installed); the deploy box can use Docker | Only full-featured free spatial DB. libSQL has no spatial support and its server has seen no release since Feb 2025 (see 04 §7) |
| On-device DB (mobile phase) | **SQLite** via `@capacitor-community/sqlite` + our own sync API | Offline pins/journal. Last-write-wins sync |
| Vector tiles | **API serves PostGIS layers directly** (`ST_AsMVT`, `/api/land/tiles/...`), behind login; owner names only at z15+. **PMTiles** built with tippecanoe arrive with offline (phase 9) | No extra service to run; auth and zoom rules live in one place |
| Data pipeline / terrain AI | **Python venv** (numpy, scipy, numba, rasterio, scikit-image) in `pipeline/`; vector ingest stays in `api/scripts/ingest.ts` | Heavy raster math runs offline once per county; the output is tiles + PostGIS rows. No GDAL install needed (rasterio wheels bundle it) |
| Imagery | **MSDIS 6″ leaf-off statewide 2023–24** (default) + MSDIS NAIP 2024 30 cm + USGS national. USGS fills in below z12 because the MSDIS services are slow when zoomed far out. Esri skipped: the 6″ layer is sharper | Free public Missouri data; leaf-off shows terrain and sign through the timber |
| Topo / terrain | USGSTopo; roads/labels overlay from **OpenFreeMap** (swap to self-hosted Protomaps for offline); **Mapterhorn** terrain (z16) drives 3D, hillshade and contours; 3DEP slope | Free, highest resolution available |
| Weather | **NWS api.weather.gov** + **Open-Meteo** (forecast + 1940→ archive) | Free, no key. Open-Meteo is non-commercial only; self-host it if the app is ever monetized |
| Sun / moon / solunar | **astronomy-engine** (offline JS) | No API; computes moon transits |
| Migrations | Plain SQL files in `db/migrations`, applied by `api/scripts/migrate.ts` (about 25 lines) | No extra binary, no ORM lock-in |
| Auth | Built in: email + password (scrypt), 30-day httpOnly session cookie, only a SHA-256 hash of the token stored | Small, no third party, enough until groups/sharing |

**Cost: $0**, as long as the app has no ads or subscriptions (several free tiers forbid commercial use; see 04 TL;DR). A nonprofit, non-monetized app is fine.

### Repo layout
```
hunt-app/
  web/                Vite React TS app (MapLibre)
  api/                Hono API (TypeScript) → PostGIS
  pipeline/           Python: ingest, tile builds, terrain analysis
  db/migrations/      SQL migrations (api/scripts/migrate.ts)
  db/setup.local.sql  gitignored one-time role/db/postgis setup
  data/               gitignored: raw downloads, built .pmtiles
  docs/               this folder
```

---

## Phase 0: Foundation ✅ done 2026-09-26

- `git init`, `.gitignore` (`data/`, `.env`), README.
- Scaffold `web/` (Vite React TS) and `api/` (Hono), with one `.env.example` for both.
- First migration: `CREATE EXTENSION postgis;`.
- **Done when:** `npm run dev` in web/ and api/, and `/health` confirms the API can reach the DB. ✅

## Phase 1: The map ✅ done 2026-09-26

- MapLibre full-screen map centered on Callaway/Cooper.
- Basemap switcher: **Aerial (NAIP Plus)**, **Hybrid** (aerial + roads/labels), **Topo (USGS)**, **Street (Protomaps)**, optional **Esri HD**.
- **3D terrain** (Mapterhorn raster-dem), pitch/rotate, exaggeration slider.
- Hillshade and **contours** (`maplibre-contour`, 10 ft / 2 ft options), slope and aspect shading from 3DEP.
- GPS locate, compass, scale bar, coordinates readout (lat/lng + USNG), required attribution.
- Layer panel with opacity sliders; every layer shows its **data date** (fixes a top complaint about both competitors).
- **Done when:** you can fly around Whetstone Creek CA in 3D over 30 cm imagery with contours. ✅ (6″ imagery)
- Deferred: Esri HD toggle, Protomaps self-hosting (phase 9), aspect shading (phase 6), 2 ft contours.

## Phase 2: Land data (Callaway first) ✅ done 2026-09-26

- `pipeline/ingest_*.py` (or `ogr2ogr` scripts) → PostGIS:
  - **Callaway parcels**: public FeatureServer `services3.arcgis.com/k5ZxPyOENfo6kVaE/.../Assessor_Data/FeatureServer/11`, 26,644 parcels. Note that `GIS_ACRES` actually holds square feet.
  - **MDC conservation areas** (1,054 statewide, each linked to its area regulations), USFS Cedar Creek unit, USFWS Big Muddy refuge, PAD-US.
  - County lines, PLSS sections, TIGER roads, NHD streams/ponds, Katy Trail.
- Build PMTiles with tippecanoe. **Parcel tiles hold geometry + parcel ID only**; owner details come from `GET /api/parcels/:id` so names never ship in bulk tiles.
- **Tap-anywhere card** (onX's best UX): owner, mailing address, acres, section/township/range, public-land agency plus a link to its regulations.
- Public land colored by agency; private parcel outlines; owner-name labels at high zoom.
- **Cooper County:** its parcel service requires a login. Request the data from the county, or license it from Regrid (apply to their nonprofit program) or ReportAll. Until then, Cooper shows public land only.
- **Done when:** tapping any Callaway parcel shows its owner, and conservation areas are shaded by agency. ✅
- Built: `npm run ingest` (`api/scripts/ingest.ts`) pages the ArcGIS REST services straight into PostGIS; GDAL isn't needed yet. Loaded: 26,644 Callaway parcels, 1,054 MDC areas, the USFS Cedar Creek unit, the USFWS Big Muddy unit, 115 counties and 4,831 PLSS sections.
- Deferred: PAD-US (mostly city parks here, and it duplicates MDC), TIGER roads (OSM overlay covers them), NHD (needed for phase 6), Cooper parcels (licensing).
- Parcels for Cooper (12,418), Cole (35,735) and Boone (73,869; owners on tap) loaded 2026-09-27 from the counties' own services (`docs/research/08-county-parcel-sources.md`). File fallback: `pipeline/import_parcels.py` (tested on shapefile/zip in State Plane and a Regrid-style GeoPackage; auto field mapping); request text in `docs/requests/cooper-county-parcels.md`.

## Phase 3: Your stuff: pins, tracks, drawing ✅ done 2026-09-26

- Tables: `users`, `waypoints`, `tracks`, `shapes`, `photos` (all `geometry(…, 4326)` + `created_at/updated_at/deleted_at` so offline sync works later).
- **Pins** with hunting icons: ladder stand, hang-on, saddle, ground blind, trail camera, bed, rub, scrape, trail, crossing, food plot, water, sighting (buck/doe/turkey/other), harvest, parking, gate, other species.
- Stand pins get extra fields: type, height, facing, **good winds** (compass multi-select), notes.
- Lines and areas (food plots, bedding areas, no-go zones) with distance/area measure; snap-to measuring.
- GPS **track recording** (web first; background tracking arrives with mobile).
- Folders, color, search, GPX/KML import/export.
- Auth (Better Auth) so multiple users can have separate data.
- **Done when:** you can plan a whole property on desktop and see it on the phone browser. ✅
- Built: one `features` table (pin/line/area/track) + `folders`; drag-to-move pins; GPX/KML import; GPX/KML/GeoJSON export.
- Deferred: photos, snap-to measuring, editing vertices of lines/areas.

## Phase 4: Conditions and the crosshair Intel panel ✅ done 2026-09-26

- `api/weather`: NWS hourly forecast + alerts and Open-Meteo hourly (wind speed/direction/gusts, temperature, **temperature vs normal**, pressure + trend, dew point, precipitation, cloud cover). Cache for 15–60 min in Postgres.
- Astronomy: sunrise/sunset, civil twilight (legal shooting light: 30 min before sunrise / after sunset), moon phase/rise/set, solunar table (shown, but **weight 0** in scoring per research).
- **Intel panel follows the map crosshair** (Spartan Forge's best UX): conditions and wind arrow for the point under the center.
- Wind overlay (animated arrows) plus radar (free Iowa State Mesonet tiles).
- **Time slider**: scrub the next 72 h and the map's wind/sun/shadows update.
- MO season calendar (2026–27: archery Sep 15–Nov 13 and Nov 25–Jan 15) plus county harvest history (MDC endpoint, 2006–2025).
- **Done when:** you can see "Saturday 6 AM: NW 8 mph, 12° below normal, pressure rising" for any spot. ✅
- Built: `api/src/weather.ts` combines Open-Meteo hourly (8 days + past day), NWS text forecast and alerts, and 1991–2020 normals computed from the ERA5 archive (±7-day smoothing, cached for a year), all cached in Postgres per 0.1° cell (normals per 0.25°). Also: a multi-point wind grid and MDC harvest history 2006–2025 (`npm run ingest -- harvest`). Web: `astro.ts` (legal light, sun position, moon, solunar), `season.ts` (phases + 2026–27 portions), `rating.ts` (§9.6 hunt rating with plain-language reasons), Intel panel with a 7-day time slider, wind arrows, NEXRAD radar, and hillshade lit by the real sun.
- Deferred: animated wind particles and radar looping. The USGS slope service now goes through a retrying disk-cache proxy (`/api/tiles/proxy/slope`).

## Phase 5: Wind, scent and thermals ✅ done 2026-09-26 (the first real edge over both apps)

- **Scent cone** per stand for the hourly forecast: Gaussian plume width from atmospheric stability plus canopy wind reduction (05 §3.2), drawn as a fading cone.
- **Thermal model** (05 §2.2): sun position + slope/aspect → is this slope sunlit → thermals flow upslope (warming) or downslope (cooling), with morning/evening transition windows; combined with synoptic wind below ~5 mph.
- Cold-air pooling in creek bottoms and hollows from DEM flow accumulation.
- **Stand wind board**: every stand graded green/yellow/red for the next 72 h against its good winds and the computed thermals.
- Optional: WindNinja (free USFS terrain-wind model) run per property for terrain-adjusted wind.
- **Done when:** you tap a stand, scrub to 4:30 PM Saturday, and watch the scent cone swing with the thermal switch. ✅
- Built, all client-side: `terrain.ts` samples the DEM tiles for slope, aspect, 80 m drainage direction, terrain position at 150/400 m, and landform (cold pool / bottom / ridge / sidehill). `scent.ts` handles the sun-on-slope thermal timing with hollow lag and ramped transitions, canopy wind reduction, drainage channeling, lee eddies, plume half-angle plus forecast spread, and detection bands from `exp(−d/λ)`. `stands.ts` builds per-stand cones and 3-day AM/Mid/PM grades folded into the rating. UI: scent-cone overlay (all stands, or just the selected one), thermal-flow arrows at zoom 13+, a stand wind board in Intel, and a "Wind & scent" card in the stand editor.
- Deferred: WindNinja terrain wind; learning thermal lag per property (phase 8).

## Phase 6: Terrain intelligence (batch AI layers) ✅ done 2026-09-26

A Python pipeline runs once per county and writes raster/vector PMTiles:
- Derive from the 3DEP 1 m DEM (2020 FEMA/NRCS LiDAR covers both counties): slope, aspect, TPI (multi-scale), curvature, flow accumulation, and landforms (**benches, saddles, points/spurs, draws, ridge tops, creek crossings, ditches**).
- Cover and food: NLCD land cover, **USDA Cropland Data Layer 2025** (soybeans/corn/wheat by field), NAIP NDVI, edges, **inside corners**.
- Disturbance: distance to roads, houses, trails (Katy Trail), public-land parking.
- Outputs (05 §4.4–4.5):
  - **Bedding probability**, separate buck and doe surfaces, per wind sector.
  - **Travel corridors and pinch points** via resistance surface + least-cost paths / Circuitscape between bedding and food.
  - **Food sources active by season phase.**
- Each layer toggles on the map with a legend and a short "why this spot" explanation.
- **Done when:** a "likely bedding" heatmap and funnel lines appear over Callaway, and you can check them against real sign. ✅
- Built: `pipeline/terrain.py <County…>` (Python venv: numpy, scipy, numba, rasterio, scikit-image, psycopg). It processes z14 grids (~7.4 m cells) in 12×12-tile blocks with 1-tile margins across 3 processes; Callaway + Cooper take about 7 min. Inputs: Mapterhorn DEM (cached), the 2025 CDL clip, and OSM roads/buildings from Overpass (cached). Hydrology uses a numba priority-flood, D8 and accumulation. Outputs:
  - raster tiles z10–14 in `data/tiles/`: buck bedding × 8 wind bins, doe bedding, corridor, landform (colors baked in; alpha = value, so the app can read values back);
  - `terrain_features`: saddles, hubs, points, benches, pinch points, inside corners, creek crossings, bedding nodes with per-wind odds;
  - `deer_trails`: least-cost bed↔food and bed↔bed paths;
  - `food_areas`: CDL crop fields.
- UI: seven AI overlays. Buck bedding follows the forecast wind at the slider time, and crop fields are shaded by deer draw in the current phase. The tap card gains a "Terrain intelligence" section with values at the point and explanations for nearby features.
- Calibration: bias constants set so the top ~7% of cover cells score above 0.5 (`BIAS_BUCK` / `BIAS_DOE` in `analysis.py`).
- Deferred: Circuitscape current density (least-cost paths used instead); NLCD/NAIP texture for understory; the user-editable crop state.

## Phase 7: AI hunt planner ✅ done 2026-09-26 (the headline feature)

- **Candidate stand generation**: pinch points, corridor intersections, bench/saddle/inside-corner cells, filtered by rules (distance from bedding, shot distance, cover; 05 §8).
- **Stand score for each wind + time** (05 §9.4): corridor strength × phase-active food × scent-safety (plume must not cross predicted bedding/travel) × thermal fit × pressure penalty.
- **Entry/exit routes**: time-dependent least-cost path (05 §9.5) that penalizes scent drifting over beds/corridors, open-field skylining and noisy crossings; it prefers ditches, creeks and the downwind side. Drawn as a route line with the walking time.
- **Daily hunt rating** (05 §9.6): rut phase and time of day dominate; weather only ±25%; moon 0; plus a **plain-language "why"**.
- **"Plan my hunt"** button: pick a property and a date → the app draws its 3 best stands for that wind, the routes in and out, the expected bedding, and a timeline (walk in by X, thermal switch at Y, last light Z).
- Optional natural-language layer: local **Ollama** (free) or the Claude API (paid, opt-in) turns the computed plan into a written briefing. The numbers always come from the deterministic model, not the LLM.
- **Done when:** one tap produces a drawn, explained plan for Saturday's wind. ✅
- Built: `web/src/planner.ts` runs in the browser (~1 s) on the z14 model tiles, using a new pipeline data tile `plan` (R = cover code, G = disturbance, B = road/draw/bench/food/building flags) plus bedding for the forecast wind bin, doe bedding, corridor and the DEM.
  - Candidates: terrain features, corridor peaks in cover, your stands, and a wooded-grid fallback for small properties. Open-field spots slide to the nearest edge tree.
  - Score = opportunity (corridor passing 10–30 yd from the tree, funnel bonus with rut/season multipliers, bonuses from your scrape/rub/trail pins) × rules (distance to bedding by period, food staging, roads, cover, low-sun glare) × scent safety (plume vs real bedding/corridor/evening food across the sit hours, thermals included).
  - Routes: Dijkstra on the grid with Tobler walking time + penalties for scent downwind (entry-time wind and deer location), bedding, trails, open fields on evening exits, and leaving the property (except roads). Creek beds get a discount. It ends at your parking/gate pins, or else the nearest road.
  - Output: top 3 spaced sites with why-lists, good winds, and a timeline (leave time, settled, thermal flips, legal light, exit). "Save stand + routes" writes a stand pin with the computed good winds plus the two route lines. `plan.tsx` holds the panel.
- Deferred: an LLM-written briefing (the deterministic briefing covers it for now); time-expanded routing across a thermal flip.

## Phase 8: Journal, pressure and learning 🟡 in progress (journal + Claude analyst done 2026-09-26)

- ✅ **Hunt journal** (`observations`, 📓 Journal panel): sightings, kills, sits, sign and stories, placed at the map
  crosshair. The server adds the exact conditions from Open-Meteo (ERA5 archive back to 1940; forecast model for the
  last 6 days): temperature, 24 h swing, departure from the 1991–2020 normal, cold front / approaching front, pressure
  3 h / 12 h trends, wind and 24 h shift, rain and hours since rain, clouds, humidity, moon phase/altitude/transit
  (solunar), minutes from sunrise/sunset, rut phase. The browser adds terrain, thermal state at that moment, the buck's
  heading vs. the wind, model bedding/corridor values and nearby terrain features.
- ✅ **Claude analyst** (`api/src/brain.ts`, 🧠 button): runs the local Claude Code CLI (`claude -p`, no tools,
  JSON schema) under the hunter's own login, with no API key (2026-10-02). It reads the journal, field notes, tagged
  camera visits and marked pins, plus `docs/brain/knowledge.md` and `field-knowledge.md`. It returns patterns (with
  mechanism and evidence), planner rules, proven spots and questions, stored in `brain_insights` for him to accept or
  reject. Accepted spots and mature-buck sightings boost planner sites.
- ✅ **Pin numbers and knowledge gating** (2026-09-27): every feature has a permanent `#num`. The planner and the
  analyst ignore pins unless he marks one as knowledge (⚙️ Settings or the pin editor).
- ✅ **Field notes** (📝, `hunts` table, 2026-10-02): log each sit in plain words. It records deer seen by time
  (including "target buck" and bucks passed), deer activity, a wind note, other hunters (trucks, hunters, shots) and
  whether the stand is in the right spot (with which way and how far to move). The server looks up the weather, and the
  card describes it in sentences (temperature change vs yesterday, fronts, wind shift, moon).
- ✅ **Trail cameras** (📷, `camera_photos`, 2026-10-02): import SD-card JPEGs onto a camera pin. Photos are resized in
  the browser, the capture time comes from EXIF (falls back to file time), and weather is looked up per photo. Photos
  are grouped into 5-minute visits and tagged with keys 1–5. Each camera gets a plain-language summary: buck visits in
  shooting light, visits after temperature drops, most common hour.
- ✅ **Public-area hunting zones** (`area_zones`, research/09): Little Dixie Lake CA's hunting zone, no-hunting area
  and restricted area are traced from the MDC map. They show on the map and land card, and the planner never sets a
  stand in a closed zone.
- ✅ **Big water** (L7): lakes of 10+ acres are impassable to deer in the corridor model and shown as blocked water on
  the map. Walk-in routes never cross water.
- ✅ **Brain upkeep:** `CLAUDE.md` standing orders plus the `.claude/agents/hunt-brain.md` agent keep field knowledge
  current. Lessons so far: L1 (never over water), L2 (thermals), L3 (pressured-deer experts), L4 (water pinch + overlook), L5 (crops), L6 (pins are private), L7 (big water),
  L8 (pressure), L9 (plain words).
- ⏳ Sit log with bump outcome (none / soft / hard) → per-site sit budgets and freshness (research/06 §4.6), plus bed
  distance calibration (§4.3).
- 🟡 Hunter pressure: only from what he logs in field notes (L8: a public lot alone means little). Done: a planner
  discount near logged trucks, hunters and shots. ⏳ A map layer once there's data; weekend/opener timing.
- ⏳ Sign-pin semantics (rub lines give direction, scrape clusters give midday pre-rut sets, hot-sign decay: §4.11,
  §4.4), and personal calibration of the bedding and stand weights from field notes and camera visits.
- **Done when:** after a season of logs, the planner ranks your own stands better than the defaults do.

## Phase 9: Offline and mobile (≈3 weeks)

- **PWA** first: installable, service worker caches the app and recent tiles.
- **Region downloads**: pick an area → download extracts of imagery/topo/parcels/terrain as PMTiles. Aim for large downloads at full resolution (both competitors fall short here).
- **Capacitor** Android/iOS build from the same `web/`; device SQLite; sync API (`updated_at` + `deleted_at`, last-write-wins).
- Background GPS tracks, compass-heading cone, a "wind check" puff logger.
- Sideload/TestFlight distribution (no public store required).
- **Done when:** airplane mode at the stand still shows the map, your pins, your stand board and the scent cone.

## Phase 10: Share and scale (ongoing)

- GitHub repo + CI. Deploy **web to Vercel** (Hobby is fine while non-commercial). The **API + PostGIS + Martin** live on a home server or Oracle Always Free ARM, exposed through **Cloudflare Tunnel** (free, no open ports). Tiles go on **Cloudflare R2** (10 GB free, no egress fees).
- Nightly `pg_dump` backups to R2.
- **Groups**: shared properties, auto-shared pins inside a group boundary (Spartan Forge's Blue Force idea), live location while hunting.
- **Landowner contact, done legally**: printable permission-request letter to the assessor mailing address; opt-in landowner registry where owners share a phone or email. No scraped phone numbers (TCPA and Missouri no-call risk; see 03).
- **Statewide**: add counties as parcel data is licensed (Regrid nonprofit / ReportAll); the terrain pipeline runs per county.
- PDF map printing.

---

## Features: match vs beat

| Feature | onX | Spartan Forge | Us |
|---|---|---|---|
| Parcel owner card | Best in class | Yes (dated) | Match (county-sourced, dated) |
| LiDAR / 3D | Elite only | Yes | Free, 1 m |
| Imagery | Blurry, dated | Great (Midwest) | 30 cm NAIP 2024 + time slider |
| Offline | Good, not full resolution | Weak | Full-resolution PMTiles regions |
| Movement forecast | Trail-cam model | Collar NN model | Rut phase + time + temperature anomaly, explained |
| Scent cone / thermals | None | Sun-exposure view only | Plume + thermal model, time slider |
| Auto bedding / funnels | None | None (chat only) | Terrain AI layers |
| Stand + route planner | None | None | **Plan my hunt** |
| Pressure tracking | None | None | Per-stand cooldowns |
| Journal analytics | None | Minimal | Personal calibration |
| Regulations / harvest data | Links only | None | MDC areas + county harvest built in |
| Price | $35–100/yr | $80/yr | $0 |

---

## Open items before or during the build

1. Written permission from Callaway County for parcel use (the county publishes no license).
2. Cooper parcels: cost from the county vs a Regrid nonprofit application.
3. MDC GIS terms of use (their site blocked our automated fetch; ask directly).
4. Mapterhorn terms/quota: keep AWS Terrain Tiles plus our own 3DEP tiles as fallback.
5. Check the 2026 MDC Fall Deer & Turkey booklet: season dates, hunter-orange rules for archers during firearms portions, and whether the CWD zone/APR changes are confirmed.
6. Pick a name (`06-app-names.md`) → rename `hunt-app`.
