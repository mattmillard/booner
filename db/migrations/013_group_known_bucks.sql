-- What the hunter knows about a group's area: mature bucks (130"+) he confirmed were around, per year, e.g.
-- {"2024": 3, "2025": 2}. Compared against the deer estimate and used to calibrate it.
ALTER TABLE parcel_groups ADD COLUMN known jsonb NOT NULL DEFAULT '{}';
