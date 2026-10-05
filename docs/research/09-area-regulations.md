# 09 — Public-area hunting zones and special rules

Some public areas allow hunting on only part of the ground, or limit methods. MDC publishes **no GIS layer** for these
sub-zones (checked gisblue.mdc.mo.gov, the test server and MDC ArcGIS Online, 2026-10). The only source is the area
map PDF plus the brochure, so zones are traced by hand into `area_zones` (migration per area) with ~±50 m accuracy.
The planner never places a stand in a `no_hunting` or `restricted` zone; the map draws them red, the land card shows
the rules.

## How to add an area
1. Area page: `https://mdc.mo.gov/discover-nature/places/<slug>`; regulations: `.../places/area-regs/<Area_ID>`.
2. Brochure `https://mdc.mo.gov/sites/default/files/<date>/<Area_ID>.pdf` (rules text) and area map
   `https://mdc.mo.gov/media/area/map/<Area_ID>` (zones: "Hunting Zone", "Refuge", "Restricted Area", "Closed to hunting").
3. Official boundary (matches our `public_lands`):
   `https://gisblue.mdc.mo.gov/arcgis/rest/services/Boundaries/MDC_Administrative_Boundaries/FeatureServer/0/query?where=Area_ID=<id>&outFields=*&outSR=4326&f=geojson`
4. Trace each zone line against the boundary's bbox (the map's scale bar checks it), write it as a cut line and
   intersect/difference with the area polygon in SQL (see `db/migrations/008_area_zones.sql`).
5. Put the plain-language rules on the zone row.

## Little Dixie Lake CA (Area 5904, Callaway) — loaded
- 733 ac (745 GIS); lake 205 ac (195 GIS).
- Map 12/23/2022 (`2022-12/5904map_0.pdf`), brochure 12/2021 (`2022-04/5904.pdf`), regs page `area-regs/5904`.
- "Hunting is only allowed in the hunting zone. This area is marked with signs and shown on the map."
- **Hunting zone:** the northern block, including the north lake arm. South edge, west to east:
  - along lat ≈38.9198 from the west boundary to the west shore by the Breezy Oak Ln lot;
  - diagonally across the lake to mid-lake (≈ −92.1224, 38.9163);
  - then east along lat ≈38.9162 to the boundary.
  - Size: ≈388 ac.
- **No hunting:** the rest of the area, ≈354 ac. That covers the southern lake and shores, the Route J strip, the
  CR 248 parcel, and the dam and boat ramp at Route RA.
- **Restricted area:** a rectangle below the dam on the Owl Creek outflow (−92.1236…−92.1208, 38.9007…38.9054). The
  map doesn't explain it.
- **Deer:** "Area is closed to firearms deer hunting. Deer may be hunted by archery methods only." The hunter's
  "archery only on the northern part" is because hunting is only allowed there at all, and deer are archery-only.
- **Other rules:**
  - No single-projectile firearms.
  - Portable stands only, Sep 1–Jan 31, labeled with your name and address or Conservation number, removed by Feb 1;
    no nails or screw-in steps.
  - **Trail and game cameras prohibited.**
  - No target shooting.
  - Area hours 4 am–10 pm.
