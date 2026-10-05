CREATE EXTENSION IF NOT EXISTS postgis;

-- Auth
CREATE TABLE users (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,          -- sha256 of the cookie token; raw token never stored
  user_id    bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

-- Ingested land data (replaced wholesale per source on each ingest)
CREATE TABLE parcels (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  county       text NOT NULL,
  parcel_id    text,
  owner        text,
  mail_address text,
  acres        double precision,
  plss         text,
  legal        text,
  attrs        jsonb NOT NULL DEFAULT '{}',
  source_date  date NOT NULL,
  geom         geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX parcels_geom ON parcels USING gist (geom);
CREATE INDEX parcels_county ON parcels (county);

CREATE TABLE public_lands (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source      text NOT NULL,            -- mdc | usfs | usfws
  name        text NOT NULL,
  manager     text NOT NULL,
  acres       double precision,
  regs_url    text,
  info_url    text,
  attrs       jsonb NOT NULL DEFAULT '{}',
  source_date date NOT NULL,
  geom        geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX public_lands_geom ON public_lands USING gist (geom);

CREATE TABLE boundaries (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        text NOT NULL,            -- county | plss
  name        text NOT NULL,
  source_date date NOT NULL,
  geom        geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX boundaries_geom ON boundaries USING gist (geom);

-- User data. uuid ids + updated_at/deleted_at so offline clients can sync later.
CREATE TABLE folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  name       text NOT NULL,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE features (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  folder_id  uuid REFERENCES folders ON DELETE SET NULL,
  kind       text NOT NULL CHECK (kind IN ('pin', 'line', 'area', 'track')),
  icon       text,
  name       text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  color      text,
  props      jsonb NOT NULL DEFAULT '{}',   -- stand: {standType, height, facing, goodWinds[]}
  geom       geometry(Geometry, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX features_user ON features (user_id, updated_at);
CREATE INDEX features_geom ON features USING gist (geom);
