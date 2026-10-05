-- Forced-path pinches (field-knowledge L10), written by pipeline/pinches.py: busy, narrow lanes squeezed between hard
-- barriers (cliffs/steep banks, water). Separate from the older terrain_features 'pinch' markers, which stay as they are.
CREATE TABLE pinches (
  id     bigserial PRIMARY KEY,
  area   text NOT NULL,
  score  real NOT NULL,     -- trips forced through x narrowness (higher = stronger pinch)
  lane_m real NOT NULL,     -- walkable width at the pinch (DEM ~1.9 m resolution)
  slope  real NOT NULL,     -- degrees; steep = a climb through a bank, flat = a lane around an obstacle
  elev   real NOT NULL,
  geom   geometry(Point, 4326) NOT NULL
);
CREATE INDEX pinches_geom ON pinches USING gist (geom);
