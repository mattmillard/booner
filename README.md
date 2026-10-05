# hunt-app (working name)

A self-hosted, free-data hunting map for Missouri (Callaway + Cooper counties first). It combines onX's land data with Spartan Forge's deer intelligence, and adds wind/thermal scent modeling and an AI stand-and-route planner.

**Status:** phases 0–7 of the [build plan](docs/07-build-plan.md) are done: 3D map, parcels and public land, pins/tracks, weather and hunt ratings (Intel), scent cones and thermals, AI terrain layers (bedding, corridors, saddles, pinch points…) for Callaway, Cooper, Boone and Cole counties, the 🎯 Plan my hunt planner (stands, walk-in/out routes, timeline), and the 📓 hunt journal with a 🧠 Claude analyst (see `CLAUDE.md` and `docs/brain/`).

## Run it locally

Needs Node 24+ and PostgreSQL with PostGIS (dev machine: PostgreSQL 18 + PostGIS 3.6).

1. One-time DB setup. `.env` and `db/setup.local.sql` are gitignored and hold the app's DB password; copy `.env.example` → `.env` on a new machine and write a matching setup file.
   ```bash
   "/c/Program Files/PostgreSQL/18/bin/psql.exe" -U postgres -h localhost -f db/setup.local.sql
   ```
2. Install, migrate and load data:
   ```bash
   cd api && npm install && npm run migrate && npm run ingest
   ```
   `npm run ingest -- mdc plss` refreshes only those sources. Available sources: `callaway_parcels cooper_parcels cole_parcels boone_parcels mdc usfs usfws counties plss harvest`. How each county's parcels were found, and how to add the next one: `docs/research/08-county-parcel-sources.md`.
   Counties without an open parcel service (e.g. Cooper): get the file from the assessor or Regrid (see `docs/requests/cooper-county-parcels.md`), then `pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper <file>`.
3. Terrain AI layers (about 7 min for both counties; downloads are cached in `data/cache`):
   ```bash
   python -m venv pipeline/.venv && pipeline/.venv/Scripts/python -m pip install -r pipeline/requirements.txt
   ```
   ```bash
   pipeline/.venv/Scripts/python pipeline/terrain.py Callaway Cooper
   ```
4. Run the API (port 8787) and web (port 5173) in two terminals:
   ```bash
   cd api && npm run dev
   ```
   ```bash
   cd web && npm install && npm run dev
   ```
5. Open http://localhost:5173 and create an account.
   One-click alternative on Windows: `start.ps1` (the "Hunt App" desktop shortcut) builds the web app, starts the API
   and a production preview on http://localhost:4173, and opens the default browser.
6. The 🧠 analyst in the Journal panel runs the Claude Code CLI installed on this PC under your own login (no API
   key). If it isn't at the default npm location, set `CLAUDE_BIN` in `.env`.

## Layout
- `web/`: Vite + React + TS.
  - Map: `src/config.ts` (layer sources, icons), `src/map.ts` (MapLibre style), `src/App.tsx` (map + tools), `src/panels.tsx` (side panels).
  - Weather and ratings: `src/intel.tsx` (Intel panel), `src/rating.ts` (hunt rating), `src/season.ts` (MO calendar), `src/astro.ts` (sun/moon).
  - Scent: `src/terrain.ts` (DEM sampling), `src/scent.ts` (thermals, effective wind, plume), `src/stands.ts` (per-stand analysis).
  - AI layers: `src/terrainai.ts` (legend, food weights, tile sampling).
  - Planner: `src/planner.ts` (candidates, scoring, routing), `src/plan.tsx` (panel).
- `api/`: Hono on Node (TypeScript runs natively, no build step).
  - `src/auth.ts`: accounts and sessions.
  - `src/features.ts`: user data CRUD.
  - `src/land.ts`: vector tiles and tap lookup.
  - `src/weather.ts`: Open-Meteo, NWS, normals, harvest.
  - `src/tiles.ts`: AI raster tiles and the slope proxy.
  - `scripts/ingest.ts`, `scripts/migrate.ts`.
- `pipeline/`: Python terrain AI. `sources.py` (DEM/CDL/OSM fetchers, grid math), `analysis.py` (hydrology, landforms, bedding, corridors), `terrain.py` (CLI, tiles, PostGIS).
- `db/migrations/`: SQL, applied in name order.

## Docs
- [Spartan Forge research](docs/research/01-spartan-forge.md)
- [onX Hunt research](docs/research/02-onx-hunt.md)
- [Missouri GIS data (parcels, public land, LiDAR, crops)](docs/research/03-missouri-gis-data.md)
- [Free tech stack (maps, imagery, terrain, DB, weather)](docs/research/04-free-tech-stack.md)
- [Bowhunting expertise → algorithms](docs/research/05-bowhunting-expertise.md)
- [Pressured-land pro bowhunters (Eberhart, Infalt, THP…)](docs/research/06-pro-bowhunters.md)
- [Seasonal patterns Sep→Jan: food, rut, stand moves](docs/research/07-seasonal-patterns.md)
- [County parcel sources + how to add a county](docs/research/08-county-parcel-sources.md)
- [Hunting brain: knowledge core + field knowledge](docs/brain/)
- [Name ideas](docs/06-app-names.md)
- [Phased build plan](docs/07-build-plan.md)

## Data sources
MSDIS 6″ imagery 2023–24 and NAIP 2024 · Open-Meteo (ERA5 normals) + NWS · NEXRAD via Iowa State Mesonet · USDA Cropland Data Layer 2025 · MDC harvest · USGS National Map (imagery, topo, 3DEP) · Mapterhorn terrain · OpenStreetMap via OpenFreeMap · Callaway County Assessor parcels · MDC, USFS, USFWS public land · MSDIS counties + PLSS. Written permission from Callaway County for parcel reuse is still an open item (see plan).
