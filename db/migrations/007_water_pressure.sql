-- Field notes in his own words: the wind is a free-text note (the app works out the weather itself), plus what he saw
-- of other hunters (the only pressure evidence the planner trusts; a public lot alone means little).
ALTER TABLE hunts DROP COLUMN wind;
ALTER TABLE hunts ADD COLUMN wind_note text NOT NULL DEFAULT '';
ALTER TABLE hunts ADD COLUMN pressure jsonb NOT NULL DEFAULT '{}';  -- {trucks, hunters, shots}

-- Lakes big enough that deer walk around instead of crossing (field-knowledge L7). Written by pipeline/terrain.py.
CREATE TABLE big_water (
  id    bigserial PRIMARY KEY,
  area  text NOT NULL,
  acres real NOT NULL,
  geom  geometry(Polygon, 4326) NOT NULL
);
CREATE INDEX big_water_geom ON big_water USING gist (geom);
