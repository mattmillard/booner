# 03 — Missouri GIS Data Sources (Callaway + Cooper first, then statewide)

Researched 2026-09-25. **V** = verified by live probe that day (REST `?f=json`, query, HEAD, or API call). **W** = from web pages/search, not probed. **A** = assumption / needs confirmation.

County FIPS: Callaway `29027`, Cooper `29053`. Approx bboxes (WGS84): Callaway `-92.14,38.56,-91.41,39.17`; Cooper `-93.05,38.66,-92.49,39.08` (bbox queries bleed into Boone/Howard/Moniteau; clip to county polygon).

---

## 0. TL;DR

| Need | Callaway | Cooper | Statewide |
|---|---|---|---|
| Parcels + owner + mailing addr | **Open ArcGIS FeatureServer, anonymous query, paging, GeoJSON/PBF (V)** | **Token-locked Integrity GIS service (V)** — buy from county or use Regrid/ReportAll | No state parcel layer (V: none on MSDIS). 54/115 counties use Integrity GIS (V). Buy statewide from Regrid/ReportAll. |
| Owner phone | Not in any assessor data (V: no phone field) | same | Only data brokers; see §2 |
| Public land | MDC Lands REST (V), Mark Twain NF Cedar Creek (V), no MRAP (V) | MDC Lands (V), Big Muddy NFWR Overton Bottoms (V), no MRAP (V) | MDC + PAD-US 4.1 + USFS EDW + USFWS hunt units (V) |
| Harvest | MDC Telecheck JSON endpoint, per county per year, 2006–2025 (V) | same | same (114 counties) |
| Elevation | 1 m DEM + LiDAR, MO_FEMANRCS_2020 (V) | same (V) | 3DEP 1 m statewide-ish; MSDIS DEM ImageServers (V) |
| Crops | CDL 2025 county GeoTIFF via CropScape API (V) | same (V) | same |

---

## 1. Parcel data

### 1.1 Callaway County — open ArcGIS Online service (best case)

- Owner org: `tkling_CallawayMOGIS` (AGOL). Hub: `https://callaway-county-assessor-gis-CallawayMOGIS.hub.arcgis.com` and `https://gis-callaway.hub.arcgis.com`. Viewer: Experience Builder item `873ae7f4e707444ca2cb2d6f88f811f1`; CAMA (Vanguard Appraisals / CAMAvision) at `https://callaway.missouriassessors.com/`, mapper `https://maps.camavision.com/callawaymo`. Assessor Jody Paschal, (573) 642-0766, 10 E. Fifth St, Fulton. (V)
- **Service:** `https://services3.arcgis.com/k5ZxPyOENfo6kVaE/arcgis/rest/services/Assessor_Data/FeatureServer` — item `605d814c2d644877b265be5d034a67cf`, access `public`. (V)
  - Service caps: `Query` only (no `Extract`/sync → no "create replica" bulk export; page with `resultOffset`). maxRecordCount **2000**, `supportsPagination=true`, formats `JSON, geoJSON, PBF`. Native SR **102697** (NAD83 StatePlane MO Central, US ft) → always pass `outSR=4326`. (V)
  - **Layer 11 `Parcel`: 26,644 features** (V). Paging tested: `resultOffset=26000&resultRecordCount=2000&f=geojson` → 644 features (V).
  - Fields (V): `parcelid` (e.g. `27-01.0-01.0-00-000-064.000`), `PIN`, `GIS_NUM`, `OWNERNAME`, `ADDRESS/CITY/STATE/ZIP_CODE` (situs), `ATTENTION`, `MAILTO_ADD, MAILTO_ADD2, MAILTO_CITY, MAILTO_STATE, MAILTO_ZIP`, `ACRES` (deeded), `LEGAL`, `PLS_SECT/PLS_TWP/PLS_RNG`, `PCLCLASS` (Residential / Ag Dwelling / …), `TOTALAPPRAISEDVALUE`, `TOTALASSESSEDVALUE`, `PY_TOTALAGVAL` etc., `SALE_DATE, SALE_AMOUNT, SELLER, BUYER, RECORDING`, `RESYEARBLT, RESSTYLE, RESTLA`, `SCHOOL_DIST, FIRE_DIST, TAXDISTRICTCODE`, `SUBDIV`, `PRIOR_YEAR` (=2026), `GIS_ACRES`.
  - **Gotcha:** `GIS_ACRES` is actually area in **ft²** (equals `Shape__Area`); use `ACRES` or compute `ST_Area(geom::geography)/4046.86`. (V)
  - Other useful layers in the same service (V): 2 Situs Address, 3 Assessor Road, 4 Master Roads, 6 Road ROW, 9 Driveway, 16 Subdivision, 19 NHD Lake Pond, 18 NHD Major Rivers, 21 Soils, 23 Section, 24 Quarter Section, 25 Qtr Qtr Section, 26 US Survey Land Grant, 27 Township Range, 28 County Boundary, 29 Corporate Limit Poly.
- Imagery: `https://tiles.arcgis.com/tiles/k5ZxPyOENfo6kVaE/arcgis/rest/services/CALLAWAY2025_IMAGERY/MapServer` and `Callaway_Photography_2025` (public cached tiles) (V listing; resolution not checked).
- License: AGOL item `licenseInfo` is empty, no terms (V). MSDIS county-resources table says hub download "REQUIRES LOGIN" (V) — but the REST service is anonymous (V). RSMo 67.1850 lets counties license GIS data and charge cost-recovery fees (W). **Action (A):** email the county/assessor for written OK for commercial redistribution before shipping; ingest is technically unblocked today.

### 1.2 Cooper County — Integrity GIS (token-protected)

- Viewer: `https://coopergis.integritygis.com/H5/Index.html?viewer=cooper` (Geocortex Essentials 4.14). Geocortex site JSON: `https://coopergis.integritygis.com/Geocortex/Essentials/REST/sites/Cooper_County_MO/map?f=json` (V).
- Backing services (V): `https://services2.integritygis.com/arcgis/rest/Services/MO/Cooper_Assessor_Data/MapServer` → anonymous request returns **`499 Token Required`** (V). The viewer config embeds a short-lived token; **do not harvest with it** (circumvents access control; likely violates vendor/county terms).
  - Layer names seen in site config (V): 11 Parcel, 12 Parcel Number/Acres, 14 Owner Name, 16 Situs Address, 38 Contour, 39 Stream, 42 Soil Grade by Parcel, 43–46 Section/Qtr Section/Township Range, 47 County Boundary, 50 Flood Zone, 57 School District, etc. Field schema not visible without token (A: similar to other Integrity counties: parcel no., owner, mailing addr, acres).
  - Imagery ImageServers 2011/2015/2020/2023/**2026** on `images3.integritygis.com` — also tokened (V).
- Assessor: Gayle Linneman, 200 Main St Rm 22, Boonville; (660) 882-2646 (V via MSDIS table). No data-sale info online (W). **Action:** request shapefile/GDB + tax-roll CSV (owner, mailing address, acres) under Sunshine Law / RSMo 67.1850 license; expect a fee and a license agreement (A). Fallback: Regrid/ReportAll.

### 1.3 Statewide parcels

| Source | URL / endpoint | Format | Fields | License / cost | Ingest | Status |
|---|---|---|---|---|---|---|
| MSDIS (state clearinghouse) | `https://msdis.missouri.edu/`, open data `https://data-msdis.opendata.arcgis.com/`, vector REST `https://services2.arcgis.com/kNS2ppBA4rwAQQZy/ArcGIS/rest/services` | — | **No parcel layer** (hub search "parcel" → 0; no parcel service in listing) | — | — | V |
| MSDIS `Missouri_County_GIS_Resources` | `…/kNS2ppBA4rwAQQZy/ArcGIS/rest/services/Missouri_County_GIS_Resources/FeatureServer/0` | FeatureServer | `COUNTYNAME, Interactive_Mapper, Data_Download, Contact_Info, Address` for all 115 counties | free | Use as the statewide acquisition checklist. Vendor tally (V): **54 Integrity GIS**, 7 ArcGIS, 5 CAMAvision, 4 Beacon (Schneider), 9 BreezeMaps/GISCloud/other, 25 none; only 17 list a download link | V |
| Regrid | `https://app.regrid.com/us/mo/callaway`, `…/cooper`; store `https://regrid.com/missouri-parcel-data`; API `https://regrid.com/api` | GPKG/SHP/CSV bulk, API, MVT tiles, Feature Service | Standardized schema: parcel no., owner, mailing address, acres, land use, value, building footprints (add-on) | Paid. Self-serve API plans + 1-week trial (W); per-county/state price not public (W). Nonprofit/academic "Data with Purpose" program exists (W) — relevant since user org is a nonprofit | Bulk GPKG → PostGIS → PMTiles | W |
| ReportAll USA | `https://reportallusa.com/products/api` | API, tiles, Esri Feature Service | parcel, owner, mailing addr, acres | 30-day trial: 1,000 parcel + 20,000 tile transactions; national data from ~$1,000 prepaid (W) | API on-demand or bulk | W |
| OpenStreetMap | Geofabrik `missouri-latest.osm.pbf` | PBF | **No parcels/ownership** in OSM; useful for roads, tracks, trails, POIs | ODbL (share-alike on derived DB) | osmium/ogr2ogr → PostGIS | A |
| Consumer apps (onX, Acres, AcreValue, LandGlide) | — | — | — | TOS prohibit scraping | don't | W |

---

## 2. Owner phone numbers

- **No public government source.** Callaway parcel schema has no phone field (V). Missouri assessor/CAMA and recorder data carry name + mailing address only (W/A). Integrity/Beacon viewers likewise (A).
- Phone numbers only come from **data brokers / skip-trace vendors** (e.g., BatchData, Whitepages Pro, TLO, LexisNexis) (W). Their TOS usually forbid republishing in a consumer app; accuracy on rural landowners is mediocre (A).
- Legal constraints:
  - **TCPA (federal):** autodialed/prerecorded calls or texts to cell phones need prior express consent; per-violation statutory damages. App-initiated or bulk texting to scraped numbers is high-risk (W/A).
  - **Missouri No-Call law RSMo 407.1098:** covers calls/SMS/MMS "for the purpose of encouraging the purchase or rental of… property, goods or services" to registered residential numbers (W). A hunter asking permission isn't a sale, but a lease-brokering or paid-access feature would be (A).
  - **RSMo 67.1850:** county GIS data access shouldn't become a "special benefit to one person"; counties may license and charge (W). Use county data per whatever license is signed.
  - Owner names/mailing addresses are public record under Sunshine Law (Ch. 610) (W), but bulk-baking them into public vector tiles invites scraping; serve owner detail on click via authenticated API (recommendation).
- **Recommended product approach:**
  1. Show owner name + **mailing address** from assessor data.
  2. "Request permission" flow → generate a letter/postcard (mail API such as Lob; A) addressed to `MAILTO_*`, with a reply URL/QR code.
  3. **Opt-in landowner registry:** landowners claim their parcel (verify via mailed code), then publish contact prefs (phone/email/"no hunting"). Only opt-in phones ever shown.
  4. No broker phone data in v1.
- Also relevant: Missouri **purple-paint** trespass-posting statute (RSMo 569.145, W) — worth an in-app legend note.

---

## 3. Public hunting land & regulations

### 3.1 Sources

| Source | Endpoint | Format | Key fields | License/cost | Ingest | Status |
|---|---|---|---|---|---|---|
| **MDC Lands** (conservation areas, accesses) | `https://gisblue.mdc.mo.gov/arcgis/rest/services/Boundaries/MDC_Administrative_Boundaries/MapServer/0` (also `/FeatureServer/0`) | ArcGIS 11.5, Query, max 1000, paging, JSON/geoJSON/PBF | `Area_ID, Area_Name, OFF_Name, County, Acreage, Acres_GIS, Public_Site, Region, Sum_Link, Map_Link, Brochure_Link, Reg_Link` | free, no license text (A: public gov data, attribute MDC) | ogr2ogr paging → PostGIS; 1,054 features statewide | V |
| MDC Conservation Area Boundaries (Discover Nature) | `…/Discover_Nature/MDC_Administrative_Areas/FeatureServer/5` (+ `/4` centroids) | FeatureServer, Query+**Extract**, max 3500 | same + `Display, GIS_Display` | free | alt. source; Extract may allow replica download | V |
| **MRAP Lands** (private walk-in) | `…/Boundaries/MDC_Administrative_Boundaries/MapServer/2` (parking: `/1`) | as above | `Area_Name, County, Acres, Access_Typ, Enrolled_A, Map_Link` | free | same | V — **36 properties, 18 counties, none in Callaway/Cooper**; nearest Cole, Moniteau, Saline |
| MDC area facilities | `…/Discover_Nature/Area_Feature_Layers/FeatureServer` — 9 Entry Points, 12 Offices, 17 Boat Ramps, 25 Shooting Ranges, 26 Parking Lots, 27 Camping, 29 Trails, 30 MDC Roads | FeatureServer, Query+Extract, max 3500 | — | free | same | V |
| MDC dove fields, prairies | `…/Discover_Nature/Habitat_Management/MapServer` — 31 Dove Fields All Hunters, 13 Public Prairies, 11 Quail Restoration Landscapes | MapServer | — | free | same | V |
| MDC hunting zones | `…/Boundaries/Hunting_Zones/MapServer` — 0 Bear Mgmt Zones, 1 Waterfowl Zones | MapServer | — | free | same | V. **Missouri has no deer management units — the county is the deer unit** (permits/harvest by county) (W) |
| MDC CWD | `…/Terrestrial/CWD_Services/MapServer` — 0 Sampling Stations, 2 CWD Mgmt Zone, 3/5 Positive Sections, 10 Mandatory Sampling Counties (Callaway yes, Cooper no — legacy 2025 data) | MapServer | — | free | same | V (layer), but see 2026 changes below |
| MDC forestry stands (MDC land only) | `…/Forestry/Forestry_Stands_Prod/MapServer/0` | MapServer | `Area_ID, Compart_Number, Stand_Number, Stand_Acre, Cutting_Block` (no species/age) | free | low value | V |
| MSDIS mirror of MDC lands | `…/kNS2ppBA4rwAQQZy/…/MO_Missouri_Department_of_Conservation_Lands/FeatureServer` | FeatureServer | — | free | backup | V (listed) |
| **USFS Mark Twain NF** ownership | `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_BasicOwnership_02/MapServer/0` (also `EDW_SurfaceOwnership_01`, `EDW_MVUM_01/02`, `EDW_TrailNFSPublish_01`, `EDW_RoadBasic_01`) | MapServer, Query, max 2000 | `ownerclassification, forestname` | public domain | spatial query by county → PostGIS | V — USFS polygons intersect Callaway (Cedar Creek unit, ~16,000 ac Boone+Callaway, W) |
| **USFWS hunt units** | `https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/FWS_National_Hunt_Units_2025-2026/FeatureServer/0` | FeatureServer | `Hunt_Unit_Name, Acreage, Huntable, Permit_Required, Hunting_Website, Youth_Hunting_Opportunity` | public domain | same | V — Big Muddy NFWR "Refuge" unit 20,671 ac, "Special Regulations Apply", no permit. Overton Bottoms N/S units are in Cooper/Moniteau (W) |
| **PAD-US 4.1** (all public/protected land) | `https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/Fee_Managers_PADUS/FeatureServer/0` (USGS) | FeatureServer, max 2000 | `Unit_Nm, Mang_Name, Mang_Type, Own_Type, Pub_Access (OA/RA/XA/UK), GIS_Acres, Des_Tp` | public domain | fill gaps (state parks, city, USACE) | V — in both bboxes: MDC areas, USFS, FWS, Katy Trail (SPR), city parks; **no USACE-managed fee land** (Missouri River mitigation tracts show up as MDC/FWS) |

### 3.2 Confirmed public areas (MDC Lands layer, V)

- **Callaway:** Whetstone Creek CA (5,208 ac), Reform CA (3,580), Prairie Fork CA (920), Little Dixie Lake CA (733), Tate Island CA (422), Moores Mill Access (101), Earthquake Hollow CA (87), Hams Prairie Access (28), Mokane Access, + small city lakes. Plus Mark Twain NF Cedar Creek (USFS).
- **Cooper:** Lamine River CA (6,071, Cooper/Morgan), Prairie Home CA (1,461, **Cooper/Moniteau — confirmed**), Harriman Hill Access (37), Swinging Bridge Access (25), Taylors Landing Access (19), Roberts Bluff, Blackwater Bridge, De Bourgmont accesses. Plus Big Muddy NFWR Overton Bottoms (USFWS).
- Every MDC record links per-area regs (`Reg_Link`, e.g. `https://mdc.mo.gov/discover-nature/places/area-regs/7601`) — scrape/cache these for area-specific rules (managed hunts, method restrictions).

### 3.3 Harvest data — MDC Telecheck (V)

- Endpoint (undocumented, used by `https://extra.mdc.mo.gov/widgets/harvest_table/`):
  `POST https://extra.mdc.mo.gov/widgets/harvest_table/dataJSONservice.php` body `paravalue=Deer?year=2025` → JSON array, 114 counties.
  - Other `paravalue`s (from `harvesttable_form.js`, V): `Subseason?species=Deer&season=Fall&method=Firearm&subseason=November&year=Y` (also `Early%20Antlerless`, `Antlerless`, `Early%20Youth`, `Late%20Youth`, `Alternative%20Methods`, `Urban`, `CWD`), `FallTurkey?year=Y`, `SpringTurkey?year=Y` (V 2026).
  - Fields: `Year, County`, and `{AntleredBuck|ButtonBuck|Doe}{Archery|November|EarlyAntlerless|Antlerless|Managed|AltMethods|EarlyYouth|LateYouth|Urban|CWD}`.
  - Years available: **2006–2025** return data; 2004 returns zeros (V).
  - Totals (V): Callaway 2025 **5,346** (matches MDC press release: #3 county statewide), 2020 4,988, 2012 5,379, 2006 6,414. Cooper 2025 **2,323**, 2020 2,265, 2012 2,622.
  - Official final summaries: `https://mdc.mo.gov/hunting-trapping/species/deer/deer-reports` (W). Undocumented endpoint → cache yearly into a `harvest` table, don't hit live.
- Ingest: nightly/annual Python job → `harvest(county_fips, year, season, sex_class, n)`; choropleth join on county polygons; per-km² density using county area.

### 3.4 Regulations / seasons 2026-27 (W — MDC pages 403 to our fetcher; sourced from MDC newsroom via press)

- **CWD Management Zone eliminated for 2026**; CWD firearms portion removed; **antler-point restriction removed statewide**; feeding/mineral ban continues in counties within 10 mi of a CWD detection (county list: A — pull from MDC CWD hub `https://cwd-interactive-maps-mdcgis.hub.arcgis.com/`). Nonresident antlered-buck limit 2→1. Free CWD landowner-permit minimum 5→20 ac.
- Deer 2026-27: Archery Sep 15–Nov 13 & Nov 25–Jan 15; Early Antlerless Oct 9–11; Early Youth Oct 24–25; **November portion Nov 14–24**; Late Youth Nov 27–29; Late Antlerless Dec 5–13; Alt Methods Dec 26–Jan 5. Turkey: Spring Youth Apr 11–12, Spring Apr 20–May 10, Fall Firearms Oct 1–31.
- No machine-readable regs feed exists (A). Hand-maintain a `seasons` table per year from the MDC "Fall Deer & Turkey Hunting Regulations" booklet.

---

## 4. Elevation / LiDAR

| Source | Endpoint | Format | Coverage | License | Ingest | Status |
|---|---|---|---|---|---|---|
| **USGS 3DEP 1 m DEM** | TNM API `https://tnmaccess.nationalmap.gov/api/v1/products?datasets=Digital%20Elevation%20Model%20(DEM)%201%20meter&bbox=…` → `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/<proj>/TIFF/USGS_1M_15_x..y.._<proj>.tif` | GeoTIFF (COG), 10×10 km tiles, ~137 MB each, UTM15N | Both counties: project **MO_FEMANRCS_2020_D20** (91 tiles in combined bbox), plus older 2014/2017 projects and MO_WestCentral_2018 / MO_7County_D23 at edges (V) | public domain | download → `gdalbuildvrt` | V |
| 3DEP 1/3″ (~10 m) | TNM, `USGS_13_n39w092_*.tif`, `…n39w093…` | GeoTIFF | seamless (V) | public domain | low-zoom terrain | V |
| **3DEP LiDAR point cloud (EPT on AWS)** | `https://s3-us-west-2.amazonaws.com/usgs-lidar-public/MO_FEMANRCS_2_2020/ept.json` (72.8 B pts); also `_1_` and `_3_`; legacy `MO_CooperCo_2011`, `MO_Cole-Callaway-Osage_2010` | Entwine Point Tiles (LAZ) | `MO_FEMANRCS_2_2020` bounds cover both counties (V by bbox math; confirm with PDAL crop) | public domain | PDAL `readers.ept` with bounds → canopy height, custom DTM | V |
| LAZ tiles via TNM | TNM `datasets=Lidar Point Cloud (LPC)` | LAZ | 4,666 tiles in Callaway bbox (V) | public domain | only if EPT insufficient | V |
| **MSDIS county LiDAR zips** | `https://msdis-archive.missouri.edu/archive/Missouri_County_LiDAR/Callaway_County_MOFEMANRCS2020.zip` (**11.4 GB**), `…/Cooper_County_MOFEMANRCS2020.zip` (**8.3 GB**) (HEAD 200, 2024-07-08) | zip (DEM + likely LAS; contents A) | county-clipped | free | bulk alternative | V |
| MSDIS LiDAR index | `…/kNS2ppBA4rwAQQZy/…/MO_County_LiDAR_Index/FeatureServer/0` (`COUNTYNAME, LINK`); tile index `MO_LIDAR_TileIndex`; metadata `MissouriLiDARMetadata` | FeatureServer | statewide | free | statewide download manifest | V |
| **MSDIS DEM ImageServer** | `https://lidar.msdis.missouri.edu/arcgis/rest/services/MO_FEMANRCS_2020_D20_DEM_UTM/ImageServer` (13 project services total) | ImageServer, caps `Catalog,Image,Metadata`, 1 m F32, EPSG:26915, exportImage max 15000×4100 | project area | free | `exportImage` for ad-hoc clips; prefer S3 COGs for bulk | V |
| AWS Terrain Tiles (Terrarium) | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | PNG terrarium | global, ~z15 | open (attribution) | zero-effort 3D fallback | A |

**Derivatives (GDAL):**
```bash
gdalbuildvrt dem.vrt USGS_1M_15_*.tif
gdalwarp -t_srs EPSG:3857 -r bilinear -co COMPRESS=DEFLATE -co TILED=YES dem.vrt dem3857.tif
gdaldem hillshade -multidirectional -z 1.5 dem3857.tif hillshade.tif
gdaldem slope dem3857.tif slope.tif            # then gdaldem color-relief for slope classes (e.g. >30° = bluff)
gdal_contour -a elev_m -i 3.048 dem.vrt contours_10ft.gpkg   # 10 ft; 40 ft index = every 4th
rio rgbify -b -10000 -i 0.1 --min-z 8 --max-z 15 -j 8 dem3857.tif terrain-rgb.mbtiles   # Mapbox encoding
pmtiles convert terrain-rgb.mbtiles terrain-rgb.pmtiles
```
- MapLibre: `raster-dem` source, `encoding: "mapbox"` (or `"terrarium"`), `map.setTerrain({source, exaggeration: 1.3})`; hillshade layer from the same source.
- Sizing (A): Callaway ≈ 2,194 km² (V, LiDAR index area) → ~2.2 G px F32 ≈ 8.8 GB raw at 1 m; terrain-RGB z8–15 PMTiles likely 1–3 GB per county; hillshade PNG/WebP z10–16 similar. Consider z15 max (≈4.8 m/px) for terrain, 1 m only for hillshade.

---

## 5. Other layers

| Layer | Source / endpoint | Format | Notes / fields | License | Ingest | Status |
|---|---|---|---|---|---|---|
| **Hydrography (NHD)** | State GPKG `https://prd-tnm.s3.amazonaws.com/StagedProducts/Hydrography/NHD/State/GPKG/NHD_H_Missouri_State_GPKG.zip` (GDB 398 MB version, published 2023-12-27); REST `https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer` (6 Flowline LS, 9 Area LS, 12 Waterbody LS) | GPKG / MapServer max 2000 | NHDFlowline (FCode: perennial/intermittent), NHDWaterbody (ponds/lakes; V fields: `PERMANENT_IDENTIFIER, GNIS_NAME, AREASQKM, FTYPE, FCODE, REACHCODE`), NHDArea | public domain | ogr2ogr clip → PostGIS → tippecanoe | V (listing). REST count queries **timed out >120 s** — use bulk GPKG |
| 3DHP (NHD successor) | `https://hydro.nationalmap.gov/arcgis/rest/services/3DHP_all/FeatureServer` (50 Flowline, 60 Waterbody, 80 Catchment); CONUS GPKG FY26 (23 GB) on prd-tnm S3 | FeatureServer / GPKG | LiDAR-derived, better alignment with 1 m DEM where available | public domain | watch for MO coverage; swap later | V (listing) |
| NHDPlus HR | TNM HU4 GPKG (e.g. `NHDPLUS_H_1030_HU4_GPKG.zip`, 2018) | GPKG | flow attributes | public domain | optional | V |
| **NLCD** | Annual NLCD **Collection 1.2**, 1985–**2025**, 30 m, released 2026-08-04 (W); `https://www.mrlc.gov/data` | GeoTIFF/COG | forest/deciduous/pasture/wetland classes | public domain | clip → raster tiles or zonal stats per parcel | W |
| **Cropland Data Layer** | CropScape API `https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLFile?year=2025&fips=29027` → returns `https://nassgeodata.gmu.edu/webservice/nass_data_cache/byfips/CDL_2025_29027.tif` (3.2 MB); stats `GetCDLStat?year=2025&fips=29053&format=csv` | GeoTIFF 30 m, CSV | Crop class codes (1 Corn, 5 Soybeans, 26 Dbl WinWht/Soy, 176 Grass/Pasture, 141 Deciduous Forest…) | public domain | per-county tif → reclass to "food source" (corn/soy/wheat/alfalfa/clover) → `gdal_polygonize` → tippecanoe; or raster PMTiles | V. Cooper 2025 (V): pasture 111,744 ac, deciduous forest 74,192, soy 64,486, corn 57,898, dbl-crop wheat/soy 11,869 |
| **NAIP** | MSDIS `https://imagery.msdis.missouri.edu/arcgis/rest/services/NAIP/NAIP2024/ImageServer` (also 2002–2022) | ImageServer, **0.3 m, 5 bands**, EPSG:26915, exportImage max 15000×4100 | 2024 MO flown at 30 cm (V) | public domain | download COGs (USDA/Planetary Computer STAC, A) → gdal → WebP raster PMTiles | V. USDA APFO `gis.apfo.usda.gov` did not respond (V) |
| **MO statewide 6-inch imagery 2023–24** | `https://stateimagery.msdis.missouri.edu/arcgis/rest/services/Missouri_6inch_Statewide_2023_2024_Cached/ImageServer` | cached tiles, 0.15 m, 4 band | best leaf-off basemap (A: leaf-off) | free (A: confirm redistribution) | tile proxy/cache or download from MSDIS archive | V |
| Roads | TIGERweb `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer` (8 Local Roads, 9 Railroads; max 100,000); TIGER/Line shapefiles `https://www2.census.gov/geo/tiger/TIGER2025/ROADS/tl_2025_29027_roads.zip` (A path); MSDIS `MO_MoDOT_Roads_Arcs`, `MO_TIGER_Roads`; MDC roads `…/Area_Feature_Layers/FeatureServer/30`; OSM for tracks | FeatureServer/SHP | name, MTFCC | public domain / ODbL | ogr2ogr | V (services) |
| **PLSS** | MSDIS `…/kNS2ppBA4rwAQQZy/…/MO_Public_Land_Survey_System/FeatureServer/0` (Query+Extract, max 2000); Callaway also has Section/QQ layers (§1.1) | FeatureServer | `TWP_NUM, TWP_DIR, RNG_NUM, RNG_DIR, SEC_NUM, LABEL_, GRANT_NAME` (Spanish land grants) | free (MO Dept of Agriculture, no-warranty) | ogr2ogr | V |
| County / township boundaries | MSDIS `MO_County_Boundaries`, `MO_TIGER_County_Boundaries`, `MO_Townships_Boundaries` | FeatureServer | — | free | ogr2ogr | V |
| **Soils (SSURGO)** | SDA REST `POST https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest` (JSON body `{"query": "...", "format":"JSON+COLUMNNAME"}`); areas **MO027** & **MO053**, saved 2025-09-02 (V); spatial via SDA `SDA_Get_Mupolygonkey_from_intersection_with_WktWgs84` or Web Soil Survey download | JSON / SHP | mukey, musym, muname, drainage class, slope, forage/ag capability | public domain | per survey area zip → PostGIS; join `muaggatt` | V |
| Timber / forest type | NLCD forest classes (above); USFS TreeMap / FIA forest-type rasters (A); MDC `Land_Cover/CCS` & `Community_Conservation_Tiers` MapServers (V listed) | raster | no stand-level private timber data exists publicly (A) | public domain | raster tiles | A |
| Watersheds | MSDIS `MO_USGS_HUC8/10/12_Watershed_Boundaries` | FeatureServer | — | free | optional | V |

---

## 6. Ingestion pipeline recommendation

### 6.1 Stack
- **PostGIS** as system of record (EPSG:4326 storage, `geography` for area/distance); **GPKG** as intermediate/offline format.
- **GDAL/OGR** (ESRIJSON driver auto-pages ArcGIS REST via `resultOffset`/`resultRecordCount` when `supportsPagination=true`; open option `FEATURE_SERVER_PAGING=YES`).
- **tippecanoe → PMTiles** for vectors; **rio-rgbify / gdal2tiles → `pmtiles convert`** for rasters; serve PMTiles from object storage (R2/S3) with HTTP range requests; MapLibre client (web + mobile offline packs = county PMTiles).
- Owner PII: **not** in public tiles. Tiles carry `parcel_uid`, `acres`, `class`; owner/mailing address fetched from API on tap (auth + rate-limited).

### 6.2 Phase 1 — Callaway + Cooper

```bash
# 1. Callaway parcels (26,644, 2000/page → 14 requests)
ogr2ogr -f GPKG callaway.gpkg \
  "https://services3.arcgis.com/k5ZxPyOENfo6kVaE/arcgis/rest/services/Assessor_Data/FeatureServer/11/query?where=1%3D1&outFields=*&outSR=4326&f=json&resultRecordCount=2000" \
  -nln parcels -nlt PROMOTE_TO_MULTI -oo FEATURE_SERVER_PAGING=YES
ogr2ogr -f PostgreSQL PG:"dbname=hunt" callaway.gpkg parcels -nln raw.callaway_parcels -lco GEOMETRY_NAME=geom -overwrite
# repeat for layers 23-25 (sections/QQ), 28 (county), 4 (roads), 9 (driveways)

# 2. MDC lands / MRAP / facilities (statewide, small) — MapServer max 1000
ogr2ogr -f PostgreSQL PG:"dbname=hunt" \
  "https://gisblue.mdc.mo.gov/arcgis/rest/services/Boundaries/MDC_Administrative_Boundaries/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json" \
  -nln raw.mdc_lands -nlt PROMOTE_TO_MULTI -overwrite
# + MRAP (/2), Area_Feature_Layers (9,17,25,26,29,30), Habitat_Management/31, USFS EDW (spatial filter), FWS hunt units, PAD-US (spatial filter:
#   append &geometry=<bbox>&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects)

# 3. Cooper parcels: licensed file from county (or Regrid county GPKG) → same normalize step

# 4. Elevation: TNM API list (MO_FEMANRCS_2020_D20 tiles intersecting county) → aria2c from prd-tnm S3 → VRT → derivatives (§4)

# 5. CDL/NLCD: CropScape GetCDLFile per fips/year (last 3 yrs for rotation), NLCD 2025 clip

# 6. NHD: NHD_H_Missouri_State_GPKG → clip to counties (+1 km buffer)

# 7. SSURGO: WSS/SDA for MO027, MO053

# 8. Harvest: POST dataJSONservice.php for 2006..2025 → harvest table
```

Normalize to a common parcel schema in SQL:
`parcels(parcel_uid text pk = '29027:'||parcelid, county_fips, apn, owner_name, mail_addr1, mail_addr2, mail_city, mail_state, mail_zip, situs_addr, acres_deeded, acres_gis, land_class, legal, plss_sec, plss_twp, plss_rng, source, source_date, geom geometry(MultiPolygon,4326))`.

Tiles:
```bash
ogr2ogr -f GeoJSONSeq parcels.geojsonl PG:"dbname=hunt" -sql "select parcel_uid, round(acres_deeded::numeric,1) acres, land_class, geom from parcels"
tippecanoe -o parcels.pmtiles -l parcels -Z11 -z16 --no-feature-limit --no-tile-size-limit --coalesce-densest-as-needed --detect-shared-borders parcels.geojsonl
tippecanoe -o public.pmtiles -l public -Z6 -z15 public_land.geojsonl    # MDC+USFS+FWS+PAD-US merged, with access/regs link
tile-join -o overlays.pmtiles parcels.pmtiles public.pmtiles hydro.pmtiles plss.pmtiles
```
Refresh: parcels monthly (Callaway `PRIOR_YEAR`/`SALE_DATE` change detection; AGOL item `modified` timestamp), MDC lands monthly, harvest yearly (Feb), CDL yearly (CDL releases ~Jan–Feb, A), NLCD yearly, DEM once.

### 6.3 Phase 2 — statewide

1. **Parcels:** open ArcGIS counties (~7 ArcGIS + some BreezeMaps/Beacon) can use the Callaway recipe, but Integrity GIS (54 counties) and Beacon are token/TOS-restricted → **license statewide from Regrid (apply to nonprofit program first) or ReportAll**; keep direct county feeds only where open + permitted. Drive the acquisition list from MSDIS `Missouri_County_GIS_Resources`.
2. **Public land:** already statewide (MDC 1,054 areas, MRAP 36, PAD-US MO, USFS Mark Twain full forest, FWS refuges).
3. **Elevation:** loop MSDIS `MO_County_LiDAR_Index` + TNM API per county; process per county in parallel (cloud batch); output per-county terrain/hillshade PMTiles + a statewide 10 m (1/3″) low-zoom layer. Budget storage: ~115 × 1–3 GB (A).
4. **CDL/NLCD:** state-level downloads (CDL `fips=29`), one raster PMTiles per product-year.
5. **NHD:** already statewide GPKG. **SSURGO:** gSSURGO Missouri state GDB (A) instead of per-county.
6. **Harvest:** endpoint already returns all 114 counties per call.
7. Offline: per-county PMTiles bundles (parcels + public + hydro + contours + hillshade + terrain) downloadable in the app.

---

## 7. Open questions / risks

- Callaway commercial-use permission (no license published) — get it in writing.
- Cooper data cost/license — call assessor (660-882-2646).
- Regrid/ReportAll pricing — request quotes; nonprofit eligibility.
- MDC terms of use page blocked our fetch (403); MDC harvest endpoint is undocumented → cache, attribute, and ask MDC for a sanctioned feed.
- 2026 CWD feeding-ban county list not yet captured from MDC hub.
- MSDIS statewide imagery redistribution terms (tile hotlinking vs. download).

## 8. Source links

- Callaway: https://callawaycounty.org/gis/ · https://callaway.missouriassessors.com/ · https://gis-callaway.hub.arcgis.com/
- Cooper: https://www.coopercountymo.gov/assessors.html · https://coopergis.integritygis.com/H5/Index.html
- MSDIS: https://msdis.missouri.edu/ · https://data-msdis.opendata.arcgis.com/ · https://msdis-archive.missouri.edu/archive/
- MDC GIS: https://gisblue.mdc.mo.gov/arcgis/rest/services · MRAP: https://mdc.mo.gov/discover-nature/places/mrap-missouri-outdoor-recreational-access-program
- MDC harvest: https://extra.mdc.mo.gov/widgets/harvest_table/ · https://mdc.mo.gov/newsroom/mdc-reports-final-deer-harvest-season-301954
- 2026 regs: https://www.newstribune.com/news/2025/dec/20/mdc-announces-dates-regulation-changes-for-2026/ · https://www.semissourian.com/news/antler-point-restriction-and-cwd-management-zones-end-for-2026-deer-season-05f6e0d2
- USFS Cedar Creek: https://www.fs.usda.gov/r09/marktwain/recreation/houston-rolla-cedar-creek-area · Big Muddy NFWR: https://www.fws.gov/refuge/big-muddy/visit-us/activities/hunting
- 3DEP/TNM: https://tnmaccess.nationalmap.gov/api/v1/products · EPT: https://s3-us-west-2.amazonaws.com/usgs-lidar-public/
- CropScape: https://nassgeodata.gmu.edu/CropScape/ · NLCD: https://www.mrlc.gov/data/project/annual-nlcd · SDA: https://sdmdataaccess.sc.egov.usda.gov/
- Regrid: https://regrid.com/missouri-parcel-data · ReportAll: https://reportallusa.com/products/api
- Statutes: RSMo 67.1850 https://revisor.mo.gov/main/OneSection.aspx?section=67.1850 · RSMo 407.1098 https://revisor.mo.gov/main/OneSection.aspx?section=407.1098
