-- Outputs of pipeline/terrain.py. Each run replaces the rows for its area.
CREATE TABLE terrain_features (
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  area  text NOT NULL,
  kind  text NOT NULL,     -- saddle | hub | point | bench | pinch | inside_corner | crossing | bed_buck | bed_doe
  score real NOT NULL,     -- 0..1 within its kind
  props jsonb NOT NULL DEFAULT '{}',
  geom  geometry(Point, 4326) NOT NULL
);
CREATE INDEX terrain_features_geom ON terrain_features USING gist (geom);
CREATE INDEX terrain_features_area ON terrain_features (area);

CREATE TABLE deer_trails (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  area   text NOT NULL,
  kind   text NOT NULL,    -- feed (bed <-> food) | rut (bed <-> bed)
  weight real NOT NULL,
  geom   geometry(LineString, 4326) NOT NULL
);
CREATE INDEX deer_trails_geom ON deer_trails USING gist (geom);

CREATE TABLE food_areas (
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  area  text NOT NULL,
  crop  text NOT NULL,     -- corn | soybeans | wheat | alfalfa | hay | sorghum
  cdl   int  NOT NULL,     -- USDA Cropland Data Layer class
  year  int  NOT NULL,
  acres real NOT NULL,
  geom  geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX food_areas_geom ON food_areas USING gist (geom);

CREATE TABLE terrain_runs (
  area     text PRIMARY KEY,
  run_at   timestamptz NOT NULL DEFAULT now(),
  zoom     int NOT NULL,
  settings jsonb NOT NULL
);
