-- Hunt journal: what the hunter saw or did, where and when. `conditions` is filled by the server
-- (historical weather, fronts, moon, sun) and the browser (terrain, thermals, model values at the spot).
CREATE TABLE observations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('sighting', 'kill', 'sit', 'sign', 'story')),
  observed_at timestamptz NOT NULL,
  geom        geometry(Point, 4326) NOT NULL,
  stand_id    uuid REFERENCES features ON DELETE SET NULL,
  buck        jsonb NOT NULL DEFAULT '{}',    -- {mature, age, points, name}
  deer_count  int,
  behavior    text,                           -- cruising, chasing, feeding, bedding, scent-checking, ...
  travel_dir  text,                           -- compass direction the deer moved toward
  notes       text NOT NULL DEFAULT '',       -- the story, in the hunter's words
  conditions  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX observations_user ON observations (user_id, observed_at);
CREATE INDEX observations_geom ON observations USING gist (geom);

-- What the analyst (Claude) learned from the journal. Proposed until the hunter accepts or rejects.
CREATE TABLE brain_insights (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('pattern', 'rule', 'spot', 'question')),
  title      text NOT NULL,
  body       text NOT NULL,
  evidence   jsonb NOT NULL DEFAULT '[]',     -- observation ids
  confidence real NOT NULL DEFAULT 0.5,
  status     text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected')),
  data       jsonb NOT NULL DEFAULT '{}',     -- spot radius / best conditions, rule planner hints
  geom       geometry(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_insights_user ON brain_insights (user_id, status);
