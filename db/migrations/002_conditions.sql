-- Server-side cache for third-party APIs (weather, normals). Stale rows are served if the upstream fails.
CREATE TABLE api_cache (
  key        text PRIMARY KEY,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  data       jsonb NOT NULL
);

-- MDC Telecheck deer harvest by county and year.
CREATE TABLE harvest (
  year     int  NOT NULL,
  county   text NOT NULL,
  total    int  NOT NULL,
  archery  int  NOT NULL,
  firearms int  NOT NULL,    -- November portion
  antlered int  NOT NULL,
  data     jsonb NOT NULL,   -- full MDC record (per portion / sex)
  PRIMARY KEY (county, year)
);
