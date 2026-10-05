-- Trail-camera photos, each tied to the camera pin it came from. Files live in data/photos/<id>.jpg (resized) and
-- <id>_t.jpg (thumbnail). Tags are his: what's in the picture. conditions = weather/moon/sun the server looked up.
CREATE TABLE camera_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  camera_id   uuid NOT NULL REFERENCES features ON DELETE CASCADE,
  taken_at    timestamptz NOT NULL,
  time_source text NOT NULL DEFAULT 'exif' CHECK (time_source IN ('exif', 'file')),
  orig_name   text NOT NULL,
  width       int,
  height      int,
  tag         text CHECK (tag IN ('empty', 'doe', 'buck', 'target buck', 'other')),
  deer_count  int,
  mature      boolean,
  note        text NOT NULL DEFAULT '',
  conditions  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (camera_id, orig_name, taken_at)
);
CREATE INDEX camera_photos_cam ON camera_photos (camera_id, taken_at);
