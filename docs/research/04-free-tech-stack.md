# 04 — Free Tech Stack (zero-cost, self-hostable)

Researched 2026-09-25. Scope: hunting map web app (then Android/iOS) with high-accuracy aerial imagery, 2D topo, 3D terrain, parcel/public-land overlays, weather, astronomy, offline.

**Evidence markers**
- **[V]** verified today: endpoint hit with curl (HTTP 200 + correct content type) or metadata read from the service itself.
- **[S]** source-stated: from the vendor's docs, terms page, or a 2026 search result. Not tested.
- **[A]** assumed or inferred. Check before you depend on it.

---

## 0. TL;DR stack

| Layer | Pick | Why |
|---|---|---|
| Renderer | **MapLibre GL JS 6.x** (6.11.2, BSD-3) [V npm] | Free and vendor-neutral. Covers raster-dem terrain, hillshade (incl. multidirectional), globe, PMTiles protocol, and the native SDKs used for mobile. |
| Imagery (primary) | **USGS NAIP Plus ImageServer** (0.3–1 m, public domain) plus **USGSImageryOnly** cached tiles (z≤16) | Public domain. No key, no quota terms. |
| Imagery (fallback/sharpest) | **Esri World Imagery** through a free ArcGIS Location Platform key (2M tiles/mo, then hard stop) | 30 cm HD across the US. Proprietary, so keep it optional and behind a toggle. |
| Topo | **USGSTopo** tiles (z≤16) plus a self-hosted **Protomaps PMTiles** OSM basemap | Public domain / ODbL. Self-hosted, so there is no quota. |
| Terrain / 3D | **Mapterhorn** terrarium tiles (includes 3DEP 1 m where available, 10 m US-wide). AWS Terrain Tiles as fallback. Our own 3DEP PMTiles for hunt regions. | Free and open. Works directly with MapLibre `raster-dem`. |
| Contours / slope | `maplibre-contour` (client-side from DEM) plus 3DEP ImageServer slope/aspect/hillshade renders | No server needed. |
| Parcels / public land | State open-data parcels + PAD-US 4.x + BLM PLSS → tippecanoe → **PMTiles** on R2 / self-hosted **Martin** | Static tiles, no per-request cost. |
| DB | **PostgreSQL + PostGIS** (self-hosted Docker) on the server. **SQLite** on device (`@capacitor-community/sqlite`) with a custom sync API. | The user refuses hosted DBs. PostGIS is the only full-featured free spatial DB. |
| Weather | **NWS api.weather.gov** (forecast, alerts) + **Open-Meteo** (hourly incl. pressure, ERA5 archive back to 1940) | Both free with no key. Open-Meteo is free only for non-commercial use (see §7). |
| Astronomy | **astronomy-engine** (MIT) for moon transits (solunar majors) plus SunCalc 2.x as a lightweight option | Fully offline. No API calls. |
| App | **Vite + React + TypeScript SPA**, then **Capacitor 8** with `@capawesome/capacitor-maplibre` (native) or MapLibre GL JS in the WebView | One codebase, static build, Capacitor-ready. |
| Hosting | Static SPA + PMTiles on **Cloudflare R2** (10 GB free, $0 egress). API + PostGIS + Martin on a home server or **Oracle Always Free ARM** (now 2 OCPU/12 GB). | $0/month if we stay inside the limits. |

**The biggest cross-cutting risk is "free = non-commercial".** Open-Meteo (hosted), MapTiler free, Stadia free, Protomaps hosted API, EOX s2cloudless 2018+, and Vercel Hobby all forbid commercial use. Open-Meteo explicitly counts ads or subscriptions as commercial. A nonprofit app with no ads and no subscriptions qualifies. If the app is ever monetized, the core of this stack is still legal because it rests on public-domain data (USGS/USDA/NOAA) and self-hosted OSM. What would have to change: the Open-Meteo hosted API (self-host it, AGPL code), Esri (paid), and Vercel (move to R2/Pages).

---

## 1. Map rendering libraries

| Lib | Version (npm, 2026-09-25) [V] | License | 3D terrain | Hillshade | Globe | PMTiles | Mobile path | Verdict |
|---|---|---|---|---|---|---|---|---|
| **MapLibre GL JS** | 6.11.2 | BSD-3 | Yes (`raster-dem` terrain, exaggeration, sky) | Yes. Methods: standard/basic/combined/igor/multidirectional (since 5.5) [S] | Yes (since v5) | `pmtiles` protocol plugin | MapLibre Native (Android/iOS). Capacitor plugin. React Native. | **Pick** |
| deck.gl | 9.4.0 | MIT | TerrainLayer (mesh), heavier | No (DIY) | GlobeView (beta-ish) [A] | via loaders | WebView only | Add-on only: `MapboxOverlay` interleaved with MapLibre for heatmaps and big point clouds (harvest/sighting density) |
| CesiumJS | 1.145.0 | Apache-2.0 | Best true-3D (quantized-mesh, 3D Tiles) | Via imagery | Native globe | No (needs quantized-mesh or ion) | WebView only, heavy | Overkill. Cesium ion free tier is for non-commercial use [A]. Self-hosting terrain needs quantized-mesh tooling. |
| OpenLayers | 10.10.0 | BSD-2 | No real 3D (ol-cesium bridge) | Via raster ops | No | Yes | WebView | Strong for WMS/WFS/projections. Weak for 3D. |
| Leaflet | 1.9.4 | BSD-2 | No | Plugins | No | Plugin | WebView | 2D raster only. Not sufficient here. |

**Recommendation: MapLibre GL JS.** It is the only option that does 2D vector, raster imagery, 3D terrain, and globe in one renderer and has matching native SDKs (MapLibre Native Android 11.x / iOS) with built-in `pmtiles://` support [S]. React binding: `@vis.gl/react-maplibre` 8.1.3 / `react-map-gl/maplibre` [V npm].

---

## 2. Imagery (ranked for a free US hunting app)

| # | Source | Resolution / coverage | Cost | Limits | License / attribution | Self-host? |
|---|---|---|---|---|---|---|
| 1 | **USGS NAIP Plus** ImageServer (NAIP + state/local HRO) | 0.3 m pixel size reported [V]. Sources range 15 cm to 1 m. CONUS. Service dated 2025-03-12 [V]. | $0 | No published quota [A]. Dynamic `exportImage` is slower than cached tiles. | Public domain. Credit "USGS, USDA, The National Map" [V copyrightText] | Yes: download JP2/COG, then TiTiler or PMTiles |
| 2 | **USGSImageryOnly** / **USGSImageryTopo** (cached) | NAIP-based, 6 in to 1 m source. **Cached to z16 only** (z17+ returns 404) [V]. "Data refreshed June 2024" [V]. | $0 | None published [A] | Public domain. "USGS The National Map: Orthoimagery" [V] | Tiles are PD, so caching/prefetch is legal [A] |
| 3 | **USDA NAIP COGs** (Planetary Computer STAC, AWS) | 0.6 m (recent), 4-band. PC collection covers 2010–2023 [V] | $0 (PC SAS token). AWS `naip-*` buckets are requester-pays [A]. | PC data API rate limits unstated [A] | PD (FSA policy). PC labels it "proprietary" in STAC but links FSA PD policy [V] | Yes. Best source for our own PMTiles/COG pipeline. |
| 4 | **Esri World Imagery** | Vantor (ex-Maxar) Vivid: **30 cm HD across US**. 15 cm metros. Community 3–30 cm [V item description]. Tiles to z18+ [V]. | Free tier: **2M basemap tiles/mo**, then $0.15/1k. No card needed. Service is **disabled** at the cap unless you enable pay-as-you-go [S]. | Esri Master License. "Not intended to export tiles for offline" [V licenseInfo]. The "for Export" layer allows ≤150k tiles/request, ArcGIS apps only [V]. | Proprietary. Attribution "Esri, Vantor, Earthstar Geographics, GIS User Community" + Powered by Esri [V] | No |
| 5 | EOX Sentinel-2 cloudless | 10 m, global, yearly 2016–2025 [V tiles 200] | $0 | — | **2016 = CC BY 4.0. 2018–2025 = CC BY-NC-SA 4.0** [S] | Commercial use needs a paid license |
| 6 | MapTiler Satellite (free plan) | ~high-res, global | $0 | 5k sessions, 100k API req/mo. Pauses when exceeded. **Non-commercial or R&D only** [S] | Proprietary | No |
| 7 | Mapbox Satellite | high-res | 50k web map loads free (GL JS v2+ proprietary). Raster Tiles API billed per tile [S] | User excluded Mapbox | Proprietary | No |
| — | Bing Maps | — | **Basic (free) accounts retired 2025-06-30.** Enterprise until 2028-06-30. Successor is Azure Maps (paid) [S]. | — | — | Not an option |

**Ranking for resolution × legality:** NAIP Plus (PD, up to 0.3 m) > USGSImageryOnly (PD, capped z16) > self-tiled NAIP COGs > Esri (sharper and more current, but proprietary and quota-capped) > s2cloudless (10 m, useful only as a zoomed-out fill).

**Plan:** default layer = USGSImageryOnly for z≤16, handing off to NAIP Plus `exportImage` at z≥15 (or our own pre-tiled NAIP PMTiles for core hunt regions). Offer "Esri HD" as an optional layer with a free key, and hard-stop at the quota. Never cache Esri tiles for offline use.

### Verified imagery URL templates
```
# USGS cached (ArcGIS order = z/y/x). maxzoom 16, overzoom beyond. [V]
https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}
https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}

# NAIP Plus dynamic, as a MapLibre raster source (tileSize 256) [V exportImage 200 image/jpeg]
https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=jpgpng&f=image
# NAIP-only variant (supports CIR/NDVI raster functions) [V metadata]
https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer

# Esri World Imagery (requires ArcGIS Location Platform API key per terms; the endpoint answers without one [V], but keyless use isn't licensed)
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
#   licensed route: ArcGIS Basemap Styles / static basemap tiles service with ?token=<API_KEY> [S]

# EOX s2cloudless (years 2016–2025 live) [V]
https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg

# NAIP STAC [V]
https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip
```
USDA APFO WMTS (`gis.apfo.usda.gov/.../USDA_CONUS_PRIME/ImageServer`) and `naip.imagery1.arcgis.com` did not respond from this network. Treat both as **unverified**.

---

## 3. Topo / basemaps

| Source | Type / zoom | Cost | Limits | License | Self-host |
|---|---|---|---|---|---|
| **USGSTopo** (cached) | Raster, **z≤16** [V]. Refreshed 2026-09-04 [V]. Includes 3DEP contours, NHD, USFS roads, GNIS. | $0 | None published [A] | Public domain | PD, so it can be cached |
| USGSShadedReliefOnly / USGSHydroCached | Raster overlays. Shaded relief tops out below z16 (z16 = 404) [V]. | $0 | — | PD | — |
| **Protomaps basemap (PMTiles)** | OSM vector, z0–15. Planet ~120 GB. `pmtiles extract` for a bbox or state [S]. Daily builds at maps.protomaps.com/builds [S]. | $0 self-hosted. Hosted API is free only for non-commercial use (commercial = GitHub Sponsor) [S]. | Don't hotlink builds [S] | ODbL produced work: "© OpenStreetMap" [S] | **Yes. Primary vector basemap.** |
| **OpenFreeMap** | OSM vector (OpenMapTiles schema). Styles liberty/bright/positron [V style 200]. | $0, no key, no request limits [S] | ToS: no warranty, may be discontinued, **no automated bulk collection** (so no offline scraping) [S] | "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" [S] | Yes (full-planet Btrfs images, open source) |
| OpenTopoMap | Raster topo, CC-BY-SA | $0 | Original server moved to "survival mode" in 2025 (plan: stop serving above z13, data frozen Jan 2023). Community mirror openmaps.fr: <400k tiles/mo, free projects only [S]. z15 still returns 200 today [V]. | CC-BY-SA, © OSM + SRTM | Yes (repo), heavy |
| Stadia Maps | Vector/raster styles | 200k credits/mo free, **non-commercial only**. Bulk download/proxy forbidden [S]. | — | Proprietary styles + OSM | No |
| MapTiler free | Vector/topo/outdoor | 5k sessions, 100k req/mo. Non-commercial or R&D. Pauses at cap. [S] | — | Proprietary | No (MapTiler Server is paid) |
| OSM tile.openstreetmap.org | Raster | $0 | OSMF tile usage policy: no heavy use, no offline bulk [S] | ODbL | — |

**Pick:** USGSTopo raster for the classic topo look, plus a self-hosted Protomaps PMTiles extract (US or target states) styled with `@protomaps/basemaps` 5.7.2 [V npm] for labels, roads, and trails. Use OpenFreeMap as a zero-effort dev/fallback style.

```
https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}              [V]
https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}  [V]
https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}       [V png]
https://tiles.openfreemap.org/styles/liberty     (also /bright, /positron)                             [V]
pmtiles://https://<our-r2-domain>/basemap-us.pmtiles                                                   (self-hosted)
```

---

## 4. Terrain / elevation

| Source | Resolution | Encoding / max z | Cost / limits | License | Notes |
|---|---|---|---|---|---|
| **Mapterhorn** | US 10 m country-wide, **3DEP 1 m in part** (attribution.json lists USGS 3DEP 1 m, PD) [V]. Global Copernicus GLO-30. | Terrarium WebP, 512 px. z16 exists, z17 = 404 [V]. Planet PMTiles **355 GB** (updated 2026-09-11) [V]. | Free public tiles. No published quota/ToS [A]. Donation/NLnet-funded. | Code BSD-3. Data per-source (US = PD) | **Primary.** Drop-in for MapLibre `raster-dem`. `pmtiles extract` the planet file for self-hosting or offline. |
| **AWS Terrain Tiles** (Tilezen/Joerd) | US from 3DEP/NED (~10 m, some 3 m). Frozen dataset. | Terrarium PNG 256 px, **max z15** (z16 = 404) [V] | $0 (AWS Open Data) | Attribution: "3DEP data courtesy of the U.S. Geological Survey" + SRTM/GMTED/ETOPO1 [S] | Stable fallback |
| **USGS 3DEP ImageServer** | **1 m** pixel [V] (seamless 1/3″ + 1 m where available) | Dynamic `exportImage`. Raster functions [V]: Hillshade Gray / Multidirectional / Elevation Tinted, Slope Map/Degrees, Aspect, Contour 25, Preset 2/5/10 ft contours | $0. **Flaky**: 504 on first try, 200 on retry [V]. | PD | Good for slope/aspect/contour overlays at high zoom. Put a cache (Cloudflare/Martin/TiTiler) in front. |
| USGS EPQS point elevation | 3DEP | JSON | $0. Timed out today [V] | PD | Use only for single-point lookups, with retry. |
| MapTiler Terrain | ~30 m global, better in some areas | Terrain-RGB | Free plan: non-commercial, 2k 3D sessions [S] | Proprietary | Skip |
| **Own 3DEP terrain PMTiles** | 1 m (resampled to z16–17) | `rio-rgbify` → MBTiles (Mapbox terrain-RGB) → `pmtiles convert`. Or run Mapterhorn's open pipeline (terrarium). | $0 compute. Storage: a few GB per state at z16 [A] | PD | Do this only for core hunting regions where Mapterhorn is at 10 m. Source: TNM 1 m DEM downloads (`prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/...`) [A] |

**Contours:** `maplibre-contour` 0.1.1 (BSD-3) [V npm] builds isolines in a Web Worker from any `raster-dem` source (Mapterhorn/AWS/own), with feet/meters and zoom-dependent intervals. No tile server needed.
**LiDAR-derived layers:** hillshade (MapLibre `hillshade-method: multidirectional`, client-side from the DEM), slope/aspect (3DEP ImageServer raster functions, or precomputed with `gdaldem slope/aspect` → PMTiles for our regions). Raw LiDAR point clouds (3DEP on AWS `usgs-lidar-public`, Entwine EPT) are a later option for canopy height models [A].

```
# Mapterhorn (terrarium, tileSize 512) [V tilejson]
https://tiles.mapterhorn.com/tilejson.json
https://tiles.mapterhorn.com/{z}/{x}/{y}.webp
https://download.mapterhorn.com/planet.pmtiles   (355 GB; extract regions)
# AWS Terrain Tiles (terrarium, 256, maxzoom 15) [V]
https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
# 3DEP hillshade as a MapLibre raster source [V 200 image/png]
https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&renderingRule=%7B%22rasterFunction%22%3A%22Hillshade%20Multidirectional%22%7D&f=image
#   swap rasterFunction for: Slope%20Map | Aspect%20Map | Preset%2010ft%20Contour%20Interval
```

---

## 5. Tiling & self-hosted serving

| Tool | Version [V GitHub/npm] | Role | Notes |
|---|---|---|---|
| **PMTiles** (spec + `pmtiles` JS 4.5.0, go-pmtiles CLI v1.31.2) | 2026-07 | Single-file tile archive served over HTTP range requests | Works on static hosting: R2, S3, GitHub Pages (1 GB repo cap [A]), Vercel (Hobby is non-commercial only, 100 GB/mo, project pauses at the cap [S]). `pmtiles extract` cuts a bbox. `pmtiles convert` turns MBTiles into PMTiles. |
| **tippecanoe** (felt) | 2.79.0 | GeoJSON/FlatGeobuf → vector MBTiles/PMTiles | Parcels, PAD-US, PLSS, MVUM roads. Use `-zg --drop-densest-as-needed --extend-zooms-if-still-dropping`. |
| **Martin** (MapLibre) | v1.16.1 (2026-09-09) | Rust tile server: PostGIS tables/functions → MVT, and serves PMTiles/MBTiles | Use for dynamic layers (user-shared pins, filtered parcels). Serves the static PMTiles too if not on R2. |
| pg_tileserv | v1.0.11 (2024-02) | PostGIS → MVT | Stale (no release in 2.5 yrs). Prefer Martin. |
| **TiTiler** | 2.4.0 (2026-09-21) | COG → XYZ raster tiles (FastAPI) | Serves NAIP/3DEP COGs on the fly (slope, hillshade via rio-tiler algorithms). Put a CDN cache in front. |
| rio-rgbify / rio-pmtiles / GDAL | — | DEM → terrain-RGB. Raster → PMTiles. | GDAL PMTiles driver writes vector only [A]. For rasters: `gdal_translate -of MBTILES` + `gdaladdo`, then `pmtiles convert`. |
| Cloudflare R2 | — | Object store for PMTiles + SPA | **10 GB-month, 10M Class B reads, $0 egress, no expiry** [S]. A Worker in front gives z/x/y URLs [S]. National parcels won't fit in 10 GB, so shard by state or serve from the VPS. |
| Oracle Cloud Always Free | — | VPS for PostGIS/Martin/TiTiler/API | **Cut to 2 OCPU / 12 GB ARM on 2026-06-15** (was 4/24) [S]. Alternative: a home server behind a Cloudflare Tunnel. |

---

## 6. Parcels & public-land data (all free)

| Dataset | Coverage | Access | License |
|---|---|---|---|
| **PAD-US 4.x** (USGS GAP) | All federal/state/local/NGO protected and public land, incl. `Pub_Access` field | GDB/SHP/KMZ national or per-state download. ArcGIS feature services on org `v01gqwM5QqNysAAi` (e.g. `Fee_Managers_PADUS`, `PADUS_Public_Access`, `Manager_Name`) [V reachable] | Public domain [S] |
| BLM PLSS CadNSDI | Township/range/section | `https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer` [V] | PD |
| USFS MVUM roads/trails | National forests | `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_01/MapServer` [V] | PD |
| **State parcel portals** | e.g. WA (updated Apr 2026), NC (all 100 counties, GPKG), NY (36 counties), WI statewide [S]. Coverage varies by state. Some states or counties charge or restrict. | Download → PostGIS → tippecanoe → PMTiles | Varies. Check each state's terms. Owner names can be restricted (e.g. WI judicial privacy law) [S]. |
| Regrid | National parcels + owners | Paid API/tiles. 30-day sandbox. "Data With Purpose" nonprofit program (propose your budget) [S] | Proprietary. **Worth applying via the nonprofit program.** |

---

## 7. Database

| Option | Spatial capability | Ops burden | Mobile/offline fit | Verdict |
|---|---|---|---|---|
| **PostgreSQL + PostGIS** (Docker `postgis/postgis`) | Full: GiST indexes, ST_Intersects/ST_AsMVT, topology, raster, geography type | One container, pg_dump backups | Server-side source of truth. Martin reads it directly. | **Pick (server)** |
| SQLite + SpatiaLite | Good subset (R*Tree, GEOS functions) | Zero-server | Ships easily on desktop. On iOS/Android you must bundle a custom SQLite build. | Not needed. Plain SQLite + built-in R*Tree handles pins by bbox. |
| libSQL self-hosted `sqld` | No native spatial. Extension loading possible but awkward [A]. | Last server release libsql-server-v0.24.32 (**Feb 2025**) [V]. Vendor focus has moved to the Rust rewrite "Turso" (beta) [S]. | Embedded replicas/sync are attractive, but the project is stagnating and not spatial. | **Reject** |

**Design:** PostGIS holds parcels metadata (for attribute lookup), public land, and users/pins/tracks/harvest logs (`geography(Point,4326)`). The device holds SQLite (`@capacitor-community/sqlite` 8.1.1 [V npm]) with the same pins/tracks tables plus `updated_at`, `deleted` (tombstone), and `client_id`. Sync = a REST endpoint doing last-write-wins per row with a server clock cursor. Heavy geometry (parcels) stays in PMTiles and is never synced row-by-row.

---

## 8. Weather APIs

| API | Coverage / data | Cost / limits | Key? | License / commercial | Hunt-relevant fields |
|---|---|---|---|---|---|
| **NWS api.weather.gov** | US. `/points/{lat},{lon}` → `forecastHourly`, `forecastGridData`. Alerts. Obs stations. | $0. ~5,000 req/hr guidance [S]. **User-Agent with contact is required** [S]. | No | US Gov, PD | Gridpoints [V]: temperature, dewpoint, windSpeed, windDirection, windGust, skyCover, probabilityOfPrecipitation, quantitativePrecipitation, relativeHumidity, `pressure` (often sparse [A]), snowfall, visibility |
| **Open-Meteo** | Global forecast (incl. HRRR 3 km for US via `models=gfs_hrrr` [V]). **Historical ERA5 0.25° from 1940, ERA5-Land 0.1° from 1950** [S]. Historical-forecast archive. | Free tier: <10k/day, 5k/hr, 600/min [S] | No | **Non-commercial only on the free API.** Ads or subscriptions = commercial [S]. Data CC BY 4.0. Server code **AGPLv3**, self-hostable (Docker) [S]. | `pressure_msl`, `surface_pressure`, `temperature_2m`, `dew_point_2m`, `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `cloud_cover`, `precipitation` (all verified on the 1985 archive query) [V]. Daily sunrise/sunset [V]. |
| OpenWeatherMap One Call 3.0 | Global | 1,000 calls/day free, **card required** [S] | Yes | Proprietary | Pressure, wind, dew point |
| Pirate Weather | Global (NOAA models, Dark Sky-compatible) | ~20k calls/mo free [S, one source] | Yes | Open source, self-hostable [S] | Pressure, wind, gusts |
| Meteostat | Station obs + model fill, historical | Free data. JSON API via RapidAPI [S] | Yes (API) | **CC BY-NC 4.0** [S] | Measured station pressure (ground truth) |
| NOAA HRRR / RTMA / URMA | CONUS 3 km / 2.5 km grids | $0 on AWS Open Data (`noaa-hrrr-bdp-pds` etc.) [A] | No | PD | Raw GRIB2. Use Python `herbie` in a nightly job. Heavy. |
| Radar tiles | IEM NEXRAD n0q [V 200]. RainViewer v2 JSON [V]. NOAA nowCOAST WMS [V]. | $0 | No | PD (IEM/NOAA) | `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png` |

**Pick:** NWS for the official US forecast, alerts, and wind. Open-Meteo for a consistent hourly model including pressure and 3-hr pressure trend, and for the **ERA5 archive to correlate logged sightings/harvests with weather**. That fits the free tier as a nonprofit with no ads. Cache per ~0.1° grid cell per hour server-side to stay under 10k/day. If the app is monetized, self-host Open-Meteo (AGPL: publish modifications if you change the server) or query ERA5 directly from Copernicus CDS [A].

```
https://api.weather.gov/points/44.0,-90.0                         → forecastGridData, forecastHourly [V]
https://api.weather.gov/gridpoints/ARX/105,72/forecast/hourly     [V]
https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=pressure_msl,wind_gusts_10m&models=gfs_hrrr   [V]
https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=YYYY-MM-DD&end_date=..&hourly=temperature_2m,dew_point_2m,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,precipitation&timezone=America/Chicago   [V]
```

---

## 9. Astronomy (sun, moon, solunar)

| Lib / API | Version [V npm] | License | Provides | Solunar fit |
|---|---|---|---|---|
| **astronomy-engine** | 2.1.19 | MIT | Rise/set (`SearchRiseSet`), **meridian transits** (`SearchHourAngle` 0°/180° gives moon overhead/underfoot), `MoonPhase`, `Illumination`, twilight via `SearchAltitude` | **Pick.** Majors = moon upper/lower transit ±1 h. Minors = moonrise/moonset ±30 min. Offline, accuracy about ±1 arcmin. |
| SunCalc | 2.0.2 (2.0 released 2026-06 after 4 yrs) | BSD-2 (1.x). Check 2.x license field (npm shows none) [A]. | Sun times incl. civil twilight (legal shooting light), moon times, illumination/phase | No transit function, so it can't do majors. Fine for sun times. |
| USNO API `aa.usno.navy.mil/api` | apiversion 4.0.1 | PD | `/api/rstt/oneday` (rise/set/transit, phase, fracillum) [V]. `/api/moon/phases/date` [V]. | Good for validating our computed values. Not needed at runtime. |

Legal shooting hours are usually sunrise −30 min to sunset +30 min, but rules vary by state. Compute them from astronomy-engine/SunCalc and keep per-state offsets in a config table.

---

## 10. Offline maps (mobile, later)

- **MapLibre Native** (Android ≥11.7, iOS) opens `pmtiles://file://...` with no extra code [S]. **PMTiles sources do not take part in offline-pack download/caching** [S], so our app downloads the region `.pmtiles` itself (Capacitor Filesystem or a native download manager) and points the style at the local file.
- Offline packs (`OfflineManager`) work for normal XYZ/vector sources. **Legal only for PD sources** (USGS, NAIP, 3DEP, our own tiles). Esri, Stadia, MapTiler free, and OpenFreeMap forbid bulk/offline downloads [S/V].
- Region bundle = `pmtiles extract` of basemap (z≤15) + terrain (Mapterhorn/own, z≤14 or 16) + parcels/PAD-US + optional NAIP raster PMTiles (big: roughly GBs per county at z17 [A]. Offer z≤16).
- Web/PWA offline: `makinacorpus/maplibre-offline-pmtiles` (stores PMTiles in IndexedDB) [S].
- `@capawesome/capacitor-maplibre` 0.2.0 [V npm] needs Capacitor 8 and renders native MapLibre. **v0 has no offline tile management yet** [S], and the API is limited (markers/lines/GeoJSON). Fallback: MapLibre GL JS inside the Capacitor WebView, with PMTiles read from local files through a custom protocol. Slower 3D, but full feature parity with the web.

---

## 11. App framework

| Option | Fit |
|---|---|
| **Vite 8 + React + TS (SPA)** — **Pick** | Capacitor wants a static bundle, and Vite builds one natively. Best MapLibre/deck.gl ecosystem (`@vis.gl/react-maplibre` 8.1.3). Deploys to R2/Pages/any static host. Pair with a small API (Hono 4.13 [V npm] on Node next to PostGIS). |
| Next.js 16 | SSR/RSC is wasted on a map canvas. Capacitor needs `output: 'export'`, which disables server features. It pushes you toward Vercel, whose Hobby plan is non-commercial with a 100 GB cap. Only choose it if SEO marketing pages are needed, and put those on a separate site. |
| SvelteKit 2 (`adapter-static`) | Technically excellent and smaller bundles. `svelte-maplibre-gl` 2.2.1 exists. Smaller ecosystem for deck.gl/React-based GIS components. Reasonable alternative if the team prefers Svelte. |
| **Capacitor 8** vs React Native/Expo | **Capacitor:** one web codebase, reuses MapLibre GL JS and all layer/style code, and has a native-map plugin available. **RN:** `@maplibre/maplibre-react-native` 11.4.0 [V npm] is the more mature native wrapper (offline packs, better 3D performance), but it means a second UI codebase. Start with Capacitor. Revisit RN only if WebView 3D performance or offline-pack needs become blocking. |

---

## 12. Attribution block (required in UI)

`© OpenStreetMap contributors · Protomaps · USGS The National Map (imagery, topo, 3DEP) · USDA NAIP · Mapterhorn (sources) · 3DEP data courtesy of the U.S. Geological Survey · Weather: NWS, Open-Meteo (CC BY 4.0) · [if enabled] Esri, Vantor, Earthstar Geographics, GIS User Community · Powered by Esri`

## 13. Open questions / to verify before build
1. Mapterhorn hosted tiles have no published ToS or quota [A]. For production, self-host extracts from `planet.pmtiles`.
2. NAIP Plus / 3DEP ImageServer throughput under real load is unknown, and 3DEP returned an intermittent 504. Put a caching proxy (Cloudflare Worker, or TiTiler over COGs) in front.
3. Esri: confirm that using the key with MapLibre (non-ArcGIS SDK) and on mobile falls within the Location Platform terms [A]. Esri officially documents MapLibre integration via its basemap styles service [A].
4. Per-state parcel licensing and owner-name restrictions.
5. Commercial status of the org/app decides whether Open-Meteo hosted, EOX 2018+, Stadia, and MapTiler free remain usable.
