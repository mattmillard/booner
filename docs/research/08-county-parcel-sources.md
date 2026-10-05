# 08 — County parcel (landowner) sources: how each was found, and how to add the next county

Verified live 2026-09-27. Every county below is loaded by `api/scripts/ingest.ts` (`npm run ingest -- <source>`),
lands in the `parcels` table, and shows up immediately as map lines, owner labels (zoom 15+) and the tap card.

| County | Platform | Source | Access | Parcels | Owner data | Ingest source |
|---|---|---|---|---|---|---|
| Callaway | ArcGIS Online (county org `k5ZxPyOENfo6kVaE`) | `services3.arcgis.com/k5ZxPyOENfo6kVaE/arcgis/rest/services/Assessor_Data/FeatureServer/11` | open | 26,644 | in layer | `callaway_parcels` |
| Cooper | Integrity GIS + Geocortex viewer | `services2.integritygis.com/arcgis/rest/Services/MO/Cooper_Assessor_Data/MapServer/11` ("Parcel") | public viewer token | 12,418 | in layer | `cooper_parcels` |
| Cole | Mid-Missouri GIS (City of Jefferson, ArcGIS Enterprise) | `www.midmogis.org/server/rest/services/ColeCO/Public_Parcel/MapServer/0` | open | 35,735 | in layer | `cole_parcels` |
| Boone | County ArcGIS Server + m-Power report API | shapes: `gis.boonemo.gov/arcgis/rest/services/BC_Basemap_MSD_V2/MapServer/7`; owners: `report.boonemo.gov/mrcjava/rest/REST_MP/I01130s/get` | open | 73,869 | per-parcel API (on tap, cached) | `boone_parcels` + `booneOwner()` in `api/src/land.ts` |

## Cooper County (Integrity GIS)

- Public viewer: https://coopergis.integritygis.com/H5/Index.html?viewer=cooper (Geocortex Essentials).
- The viewer's site config is public JSON with no login:
  `https://coopergis.integritygis.com/Geocortex/Essentials/REST/sites/Cooper_County_MO/map?f=json`.
  Each `mapServices[].connectionString` carries the service URL **plus a token that the county issues to every anonymous
  visitor** (`url=…/Cooper_Assessor_Data/MapServer;token=…`). The bare service returns `499 Token Required`. With the
  viewer's token it answers normally: that is how the county's own public map works.
- The ingest reads the token fresh from that JSON on every run (`viewerToken()`); tokens rotate, so never hard-code one.
- Parcel layer **11 "Parcel"**, polygon, pagination supported, `f=geojson`, max 2,000 per page, native CRS
  NAD83 State Plane MO Central ft (queried with `outSR=4326`).
- Fields: `parcel_no`, `PID`, `name` (owner), `name2` (often "% care-of"), `name3`, `address1/2`, `city`, `state`,
  `zip`, `acres` (deeded), `GIS_ACRES`, `section`/`twn`/`rng`, `leg_des`, `date_acquire` (epoch ms), `deed_bkpg`,
  `sit_stno`/`sit_stnm`/`sit_city` (situs), ag-land acres by grade, appraised and assessed values, `prev_owner`.
- The same service also has roads, Katy Trail, sections/quarter sections, subdivisions, easements, streams, contours,
  flood zones and a soil-grade-by-parcel layer. Aerial photos 2011/2015/2020/2023/2026 are ImageServers on
  `images*.integritygis.com` (same token pattern).
- Use: personal, rate-limited paged queries identified as `hunt-app`, the same data any visitor sees. No terms of use
  are published on the viewer. If the county or Integrity objects, fall back to a records request
  (`docs/requests/cooper-county-parcels.md`).
- Dead ends checked: ArcGIS Online "Cooper_Co_Parcels" (a consultant's editable 2,608-parcel corridor copy, not the
  county's, don't use); "Cooper_Parcels" (Cooper City, FL).

## Cole County (Mid-Missouri GIS)

- Found via the MSDIS county table → the Mid-MO GIS hub (https://midmogis-jeffcitymogis.hub.arcgis.com), then the
  Enterprise portal search: `https://www.midmogis.org/portal/sharing/rest/search?q=parcel&f=json` → item
  "Public_Parcel".
- Service: `https://www.midmogis.org/server/rest/services/ColeCO/Public_Parcel/MapServer/0`: open, pagination, geoJSON,
  max 1,000 per page.
- Fields: `PID_LABEL`/`ParcelNumber`/`PID`, `Owner1`, `Owner2`, `OwnerAddress1/2`, `OwnerMailCity/State/Zip`,
  `ACRES`, `Section`/`Township`/`Range`, `PropertyDesc` (legal), `Location` (situs), `Date1` (deed date),
  `Book1`/`Page1`, `DEED_HIS`/`DEED_ARCH` (deed history), land use, building details, `IMAGE` (house photo file).
- The hub's "Cole County, Missouri Parcels" download (`midmogis.org/GIS_Hyperlinks/Downloadables/CC_Parcels.zip`) was an
  **empty 22-byte zip** on 2026-09-27 (rebuilt 2026-09-25); use the service.

## Boone County

- MSDIS table → viewer https://maps.boonemo.gov/viewers/AS_ParcelMapping_v1/ → its `viewer.js` lists the services.
- Shapes: `https://gis.boonemo.gov/arcgis/rest/services/BC_Basemap_MSD_V2/MapServer/7` ("Parcel Lines", polygons):
  open, 73,869 parcels, fields `ASSESSOR` (16-digit parcel number), `LOT_NUM`. No owners in the GIS layer.
- Owners come from the assessor's m-Power report API that the viewer calls:
  `https://report.boonemo.gov/mrcjava/rest/REST_MP/I01130s/get?slnk=1&rls_PARCEL__X4=EQ&val_PARCEL__X4=<first 14 digits>`
  → JSON with `OWNER`, `MAILING1..3`, `DEEDACRES`, `CALCACRES`, `LEGAL1..4`, `PARCELID`, district and school codes.
  Owner search (viewer): `REST_MP/I01160s/get?max_rows=250&rls_OWNER=SW&val_OWNER=<name>`.
- The app looks owners up **on first tap** and caches them into the parcel row, one request per tapped parcel, like the
  viewer. Owner labels on the map appear for Boone parcels only after they've been tapped once. A bulk owner pull
  would mean ~74k API calls; don't, unless the county provides a file.
- Other open Boone services: PLSS (`AS_PLSS_FeatureData`), ag-land grades (`BC_Basemap_Data_ASSE`), historical aerials
  1939–2023 (`CachedServices/*_Aerial`, `*_Ortho`), 2023 terrain view.

## Playbook: finding any Missouri county's parcel service

1. **MSDIS county table** (every county's mapper, download link, contact):
   `https://services2.arcgis.com/kNS2ppBA4rwAQQZy/ArcGIS/rest/services/Missouri_County_GIS_Resources/FeatureServer/0/query?where=COUNTYNAME='<County>'&outFields=*&f=json`.
   About 54 of 115 counties use Integrity GIS.
2. **Identify the viewer platform** from `Interactive_Mapper` and follow its config:
   - `*.integritygis.com/H5/…?viewer=<x>` (Geocortex) → `https://<host>/Geocortex/Essentials/REST/sites/<SiteId>/map?f=json`
     (the SiteId is in the viewer's config; for Cooper it's `Cooper_County_MO`). Service URLs and public tokens are in
     `mapServices[].connectionString`. Find the polygon layer named "Parcel".
   - ArcGIS Hub (`*.hub.arcgis.com`) → `https://<hub>/api/search/v1/collections/all/items?q=parcel`; downloads, feature
     services, or links to the owning portal.
   - ArcGIS Enterprise portal (`…/portal`) → `https://<host>/portal/sharing/rest/search?q=parcel&f=json`.
   - Custom viewer → download its main `.js` and grep for `MapServer|FeatureServer` and any `rest/` report APIs.
   - Beacon/Schneider or CAMAvision viewers: no public REST; request the file.
3. **Verify** on the layer: `?f=json` (fields, `maxRecordCount`, `advancedQueryCapabilities.supportsPagination`,
   `supportedQueryFormats` includes geoJSON), `query?where=1=1&returnCountOnly=true`, one sample record.
4. **Add a source** in `api/scripts/ingest.ts` (copy `cole_parcels`; add `token: () => viewerToken(siteJsonUrl, serviceName)`
   for Integrity/Geocortex). Map `parcel_id`, `owner`, `mail_address`, `acres` (deeded if present), `plss`, `legal`,
   and put the situs address in `attrs.ADDRESS` and the deed/sale date in `attrs.SALE_DATE`. Widen `BBOX` if the county
   is outside it, then `npm run ingest -- <source> plss usfs usfws`.
5. **Terrain AI**: `pipeline/.venv/Scripts/python pipeline/terrain.py <County>` (~4 min per county).
6. **No service at all?** Get the file (assessor records request or Regrid) and run `pipeline/import_parcels.py`.
7. Record the county here: platform, URLs, fields, count, access notes, dead ends.
