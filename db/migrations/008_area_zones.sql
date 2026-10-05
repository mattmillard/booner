-- Hunting zones inside public areas, where the area map limits where you may hunt. MDC publishes no GIS for these;
-- they are traced from the official area map (docs/research/09-area-regulations.md), so lines are ~±50 m.
CREATE TABLE area_zones (
  id        bigserial PRIMARY KEY,
  area_name text NOT NULL,                  -- matches public_lands.name
  kind      text NOT NULL CHECK (kind IN ('hunting', 'no_hunting', 'restricted')),
  label     text NOT NULL,
  rules     text NOT NULL DEFAULT '',       -- plain-language summary shown on the map card
  source    text NOT NULL,
  geom      geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX area_zones_geom ON area_zones USING gist (geom);

-- Little Dixie Lake CA (MDC 5904, Callaway). Area map 5904map_0.pdf (12/23/2022): hunting only in the signed
-- northern Hunting Zone. Its south edge runs west->east: west boundary along lat 38.9198 to the west shore by the
-- Breezy Oak Ln lot, diagonally across the lake to mid-lake, then east along lat 38.9162 to the boundary.
WITH area AS (SELECT geom FROM public_lands WHERE source = 'mdc' AND name = 'Little Dixie Lake CA'),
north AS (SELECT ST_SetSRID(ST_GeomFromText('POLYGON((-92.14 38.9198, -92.1274 38.9198, -92.1224 38.9163, -92.10 38.9162,
  -92.10 38.94, -92.14 38.94, -92.14 38.9198))'), 4326) AS g),
rules AS (SELECT 'Deer: archery only (no firearms deer hunting). No single-projectile firearms. Portable stands only, '
  || 'Sep 1–Jan 31, labeled with your name/address or Conservation number, out by Feb 1; no nails or screw-in steps. '
  || 'Trail and game cameras prohibited. Area hours 4 am–10 pm.' AS t,
  'MDC Little Dixie Lake CA area map (12/23/2022) and brochure 5904 (12/2021)' AS src)
INSERT INTO area_zones (area_name, kind, label, rules, source, geom)
SELECT 'Little Dixie Lake CA', 'hunting', 'Hunting zone', rules.t, rules.src,
       ST_Multi(ST_CollectionExtract(ST_Intersection(area.geom, north.g), 3)) FROM area, north, rules
UNION ALL
SELECT 'Little Dixie Lake CA', 'no_hunting', 'No hunting', 'Closed to hunting: hunting is only allowed in the signed hunting zone on the north end.', rules.src,
       ST_Multi(ST_CollectionExtract(ST_Difference(area.geom, north.g), 3)) FROM area, north, rules
UNION ALL
SELECT 'Little Dixie Lake CA', 'restricted', 'Restricted area', 'Restricted area below the dam (shown on the MDC area map; posted on site).', rules.src,
       ST_Multi(ST_MakeEnvelope(-92.1236, 38.9007, -92.1208, 38.9054, 4326)) FROM rules;
