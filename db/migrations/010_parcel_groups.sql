-- Named groups of parcels (e.g. every KRAMER parcel in Cooper County) to analyze and plan as one property.
-- Private per user, like pins.
CREATE TABLE parcel_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  name       text NOT NULL,
  county     text NOT NULL,
  parcel_ids bigint[] NOT NULL,   -- parcels.id
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX parcel_groups_user ON parcel_groups (user_id, created_at);
