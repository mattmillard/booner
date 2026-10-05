-- Which pinches the map shows: strong (score >= 250) and the strongest within ~180 m, so each stretch of ground shows
-- its best pinch (~6 per square mile in Callaway; the quarry's "Pinch Entrance" stays in). Set by pipeline/pinches.py.
ALTER TABLE pinches ADD COLUMN show boolean NOT NULL DEFAULT false;
UPDATE pinches a SET show = true WHERE score >= 250 AND NOT EXISTS (
  SELECT 1 FROM pinches b WHERE b.geom && ST_Expand(a.geom, 0.0018) AND ST_DWithin(a.geom, b.geom, 0.0018) AND b.score > a.score);
