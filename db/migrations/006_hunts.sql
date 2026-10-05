-- Field notes: one row per hunt (a sit). What the hunter felt in the stand vs what the models predicted is the
-- calibration loop for wind/thermals; sightings with times and stand verdicts say whether the stand is in the right spot.
CREATE TABLE hunts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  stand_id      uuid REFERENCES features ON DELETE SET NULL,
  geom          geometry(Point, 4326) NOT NULL,
  started_at    timestamptz NOT NULL,
  ended_at      timestamptz,
  wind          jsonb NOT NULL DEFAULT '[]',  -- in-stand readings [{time "HH:MM", from, strength, note}]
  sightings     jsonb NOT NULL DEFAULT '[]',  -- [{time, count, what, mature, age, points, behavior, from, to, yards, outcome, note}]
  activity      text,                         -- none | slow | steady | hot
  stand_verdict text CHECK (stand_verdict IN ('right', 'close', 'wrong')),
  move          jsonb NOT NULL DEFAULT '{}',  -- {toward, yards, why} when the stand is not in the right spot
  notes         text NOT NULL DEFAULT '',
  conditions    jsonb NOT NULL DEFAULT '{}',  -- server: weather at start + forecast wind by hour; browser: site.readings
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX hunts_user ON hunts (user_id, started_at);
