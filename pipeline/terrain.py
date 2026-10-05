"""Terrain-intelligence pipeline (docs/07-build-plan.md, phase 6).

    pipeline/.venv/Scripts/python pipeline/terrain.py Callaway [Cooper ...] [--workers 3]
    pipeline/.venv/Scripts/python pipeline/terrain.py Callaway --calibrate     # one block, print logit quantiles

Per county: DEM (Mapterhorn/3DEP) + USDA Cropland Data Layer + OSM roads/buildings -> bedding (buck per wind,
doe), travel corridors, landforms (raster tiles in data/tiles/<layer>/z/x/y.png) and point features, predicted
trails and crop fields (PostGIS).
"""
import argparse
import json
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sources as S  # noqa: E402  (sets PROJ env before rasterio loads)
import numpy as np  # noqa: E402
import psycopg  # noqa: E402
import rasterio  # noqa: E402
from PIL import Image  # noqa: E402
from psycopg.types.json import Jsonb  # noqa: E402
from rasterio import features as rfeatures  # noqa: E402
from rasterio.warp import transform_geom  # noqa: E402

from analysis import CROPS, analyze  # noqa: E402

TILES = S.DATA / 'tiles'
MIN_ZOOM = 10
RAMPS = {  # low colour, high colour, floor below which pixels are transparent. Alpha = value × 255.
    'bed_buck': ((112, 72, 232), (230, 73, 128), 0.3),
    'bed_doe': ((28, 126, 214), (34, 184, 207), 0.3),
    'corridor': ((253, 126, 20), (250, 82, 82), 0.12),
}
LANDFORM_COLORS = [  # later entries win. Ridges and points are left out: they cover whole hillsides; points ship as features.
    ('cold_pool', (165, 216, 255, 110)), ('bench', (59, 201, 219, 210)), ('draw', (116, 192, 252, 190)),
    ('creek', (51, 154, 240, 220)),
]
LAYERS = [f'bed_buck_{k}' for k in range(8)] + ['bed_doe', 'corridor', 'landform']


def ramp(v, key):
    lo, hi, floor = RAMPS[key]
    t = np.clip((v - floor) / (1 - floor), 0, 1)[..., None]
    rgb = np.asarray(lo) * (1 - t) + np.asarray(hi) * t
    a = np.where(v >= floor, np.round(np.clip(v, 0, 1) * 255), 0)
    return np.dstack([rgb, a]).astype(np.uint8)


def landform_rgba(lf):
    shape = next(iter(lf.values())).shape
    out = np.zeros((*shape, 4), np.uint8)
    for name, col in LANDFORM_COLORS:
        out[lf[name]] = col
    return out


def write_tile(layer, z, x, y, rgba, mask):
    """Write inside `mask`; keep whatever another area already wrote outside it."""
    path = TILES / layer / str(z) / str(x) / f'{y}.png'
    if path.exists():
        rgba = np.where(mask[..., None], rgba, np.asarray(Image.open(path).convert('RGBA')))
    if not rgba[..., 3].any():
        path.unlink(missing_ok=True)
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, 'RGBA').save(path, compress_level=6)


def _grid_bbox(grid):
    w, n = S.merc_to_lnglat(grid.x0, grid.y0)
    e, s_ = S.merc_to_lnglat(grid.x0 + grid.shape[1] * grid.px, grid.y0 - grid.shape[0] * grid.px)
    return float(w), float(s_), float(e), float(n)


def run_block(job):
    z, bx, by, n, margin, tile_range, area_geojson, cdl_path, osm_path = job
    t0 = time.time()
    grid = S.Grid(z, bx - margin, by - margin, n + 2 * margin, n + 2 * margin)
    in_area = S.rasterize_area(grid, area_geojson)
    core = (margin * 256, (margin + n) * 256, margin * 256, (margin + n) * 256)
    if not in_area[core[0]:core[1], core[2]:core[3]].any():
        return None
    osm = json.loads(Path(osm_path).read_text())
    res = analyze(grid, S.dem(grid), S.cdl_on_grid(grid, cdl_path), S.rasterize_roads(grid, osm),
                  S.rasterize_points(grid, S.buildings(osm, _grid_bbox(grid))), in_area, core, S.rasterize_water(grid, osm.get('water', [])),
                  S.rasterize_parcels(grid), S.rasterize_highways(grid, osm))
    (x0, x1), (y0, y1) = tile_range
    tiles = []
    for i in range(n):
        for j in range(n):
            tx, ty = bx + i, by + j
            if not (x0 <= tx <= x1 and y0 <= ty <= y1):
                continue
            r, c = (margin + j) * 256, (margin + i) * 256
            sl = (slice(r, r + 256), slice(c, c + 256))
            m = in_area[sl]
            if not m.any():
                continue
            for k in range(8):
                write_tile(f'bed_buck_{k}', z, tx, ty, ramp(res['bed_buck'][k][sl], 'bed_buck'), m)
            write_tile('bed_doe', z, tx, ty, ramp(res['bed_doe'][sl], 'bed_doe'), m)
            # Curved so weak travel reads faint and the strong lanes stand out (his call, 2026-10-04).
            write_tile('corridor', z, tx, ty, ramp(res['corridor'][sl] ** 1.6, 'corridor'), m)
            write_tile('landform', z, tx, ty, landform_rgba({k: v[sl] & m for k, v in res['landform'].items()}), m)
            code, dist, flags = (a[sl] for a in res['plan'])
            write_tile('plan', z, tx, ty, np.dstack([code, dist, flags, m * np.uint8(255)]), m)  # data tile, z14 only
            tiles.append((tx, ty))
    lnglat = lambda r, c: tuple(float(v) for v in grid.rc_to_lnglat(r, c))  # noqa: E731
    feats = [(kind, *lnglat(r, c), score, props) for kind, r, c, score, props in res['features']]
    trails = []
    for kind, w, path in res['trails']:
        lng, lat = grid.rc_to_lnglat(path[:, 0], path[:, 1])
        trails.append((kind, float(w), list(zip(np.round(lng, 6).tolist(), np.round(lat, 6).tolist()))))
    print(f'  block {bx},{by}: {len(tiles)} tiles, {len(feats)} features, {len(trails)} trails, {time.time() - t0:.0f}s',
          flush=True)
    return {'tiles': tiles, 'features': feats, 'trails': trails, 'calib': res['calib']}


def pyramid(z, tiles):
    """Build zooms z-1 .. MIN_ZOOM by 2×2 premultiplied-alpha averaging of the tiles touched this run."""
    level = set(tiles)
    for zz in range(z - 1, MIN_ZOOM - 1, -1):
        parents = {(x // 2, y // 2) for x, y in level}
        for layer in LAYERS:
            for px, py in parents:
                canvas = np.zeros((512, 512, 4), np.float32)
                found = False
                for dx in (0, 1):
                    for dy in (0, 1):
                        p = TILES / layer / str(zz + 1) / str(2 * px + dx) / f'{2 * py + dy}.png'
                        if p.exists():
                            canvas[dy * 256:(dy + 1) * 256, dx * 256:(dx + 1) * 256] = np.asarray(Image.open(p).convert('RGBA'))
                            found = True
                path = TILES / layer / str(zz) / str(px) / f'{py}.png'
                if not found:
                    path.unlink(missing_ok=True)
                    continue
                a = canvas[..., 3:] / 255
                pre = np.concatenate([canvas[..., :3] * a, a], axis=2).reshape(256, 2, 256, 2, 4).mean(axis=(1, 3))
                rgb = np.where(pre[..., 3:] > 0, pre[..., :3] / np.maximum(pre[..., 3:], 1e-6), 0)
                img = np.concatenate([rgb, pre[..., 3:] * 255], axis=2).round().clip(0, 255).astype(np.uint8)
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(img, 'RGBA').save(path, compress_level=6)
        level = parents


def food_polygons(cdl_path):
    crop_of = {code: crop for crop, codes in CROPS.items() for code in codes}
    out = []
    with rasterio.open(cdl_path) as src:
        arr = src.read(1)
        mask = np.isin(arr, list(crop_of))
        for geom, val in rfeatures.shapes(arr.astype(np.int32), mask=mask, transform=src.transform, connectivity=8):
            rings = geom['coordinates']
            shoelace = lambda r: 0.5 * abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(r, r[1:])))  # noqa: E731
            acres = (shoelace(rings[0]) - sum(shoelace(h) for h in rings[1:])) / 4046.8564224  # EPSG:5070 is equal-area
            if acres >= 1:
                out.append((crop_of[int(val)], int(val), acres, transform_geom(src.crs, 'EPSG:4326', geom)))
    return out


def run_area(name, args, conn):
    area = name.lower()
    geojson, bbox = S.county_area(conn, [name])
    pad = 0.03  # ~3 km of context beyond the county for DEM, crops and roads
    wide = (bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad)
    print(f'{name}: bbox {tuple(round(v, 3) for v in bbox)}')
    cdl_path, cdl_year = S.cdl_file(wide)
    print(f'  CDL {cdl_year}: {cdl_path.name}')
    osm, osm_path = S.osm(wide)
    print(f'  OSM: {len(osm["roads"])} roads/trails, {len(osm["buildings"])} buildings')

    z, n, m = args.zoom, args.block, 1
    x0, y0 = S.tile_of(bbox[0], bbox[3], z)
    x1, y1 = S.tile_of(bbox[2], bbox[1], z)
    fetched = S.prefetch_dem(z, (x0 - m * n, x1 + m * n), (y0 - m * n, y1 + m * n))
    print(f'  DEM: {fetched} tiles downloaded (rest cached)')
    blocks = [(bx, by) for bx in range(x0, x1 + 1, n) for by in range(y0, y1 + 1, n)]
    if args.calibrate:
        cx, cy = S.tile_of((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2, z)
        blocks = [min(blocks, key=lambda b: abs(b[0] + n / 2 - cx) + abs(b[1] + n / 2 - cy))]
    jobs = [(z, bx, by, n, m, ((x0, x1), (y0, y1)), geojson, str(cdl_path), str(osm_path)) for bx, by in blocks]
    print(f'  {len(jobs)} blocks of {n}×{n} tiles at z{z} (~{S.Grid(z, x0, y0, 1, 1).g:.1f} m cells), {args.workers} workers')
    with ProcessPoolExecutor(args.workers) as ex:
        results = [r for r in ex.map(run_block, jobs) if r]
    if args.calibrate:
        print('  calibration (93rd percentile of cover-cell logits):', [r['calib'] for r in results])
        return

    tiles = [t for r in results for t in r['tiles']]
    print(f'  pyramid z{z - 1}..z{MIN_ZOOM} from {len(tiles)} tiles')
    pyramid(z, tiles)
    fields = food_polygons(cdl_path)
    feats = [f for r in results for f in r['features']]
    trails = [t for r in results for t in r['trails']]
    with conn.transaction():
        for table in ('terrain_features', 'deer_trails', 'food_areas', 'big_water'):
            conn.execute(f'DELETE FROM {table} WHERE area = %s', (area,))
        with conn.cursor() as cur:
            cur.executemany(
                'INSERT INTO terrain_features (area, kind, score, props, geom) VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))',
                [(area, k, s, Jsonb(p), lng, lat) for k, lng, lat, s, p in feats])
            cur.executemany(
                'INSERT INTO deer_trails (area, kind, weight, geom) VALUES (%s, %s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))',
                [(area, k, w, json.dumps({'type': 'LineString', 'coordinates': c})) for k, w, c in trails if len(c) > 1])
            cur.executemany(
                """INSERT INTO food_areas (area, crop, cdl, year, acres, geom)
                   SELECT %s, %s, %s, %s, %s, g FROM (
                     SELECT ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SimplifyPreserveTopology(
                       ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), 0.00008)), 3)) AS g) s WHERE NOT ST_IsEmpty(g)""",
                [(area, crop, code, cdl_year, acres, json.dumps(g)) for crop, code, acres, g in fields])
            # Lakes >= 10 acres touching the county, drawn on the map as blocked to deer (field-knowledge L7).
            cur.executemany(
                """INSERT INTO big_water (area, acres, geom)
                   SELECT %s, ST_Area(g::geography) / 4046.86, g FROM (SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)) AS g) s
                   WHERE GeometryType(g) = 'POLYGON' AND ST_Area(g::geography) >= 40468.6
                     AND ST_Intersects(g, ST_MakeEnvelope(%s, %s, %s, %s, 4326))
                     AND NOT EXISTS (SELECT 1 FROM big_water w WHERE w.area <> %s AND ST_Equals(w.geom, g))""",
                [(area, json.dumps({'type': 'Polygon', 'coordinates': [r]}), *bbox, area) for r in osm.get('water', [])])
        conn.execute(
            """INSERT INTO terrain_runs (area, zoom, settings) VALUES (%s, %s, %s)
               ON CONFLICT (area) DO UPDATE SET run_at = now(), zoom = EXCLUDED.zoom, settings = EXCLUDED.settings""",
            (area, z, Jsonb({'cdl_year': cdl_year, 'block': n, 'bbox': bbox})))
    counts = {}
    for k, *_ in feats:
        counts[k] = counts.get(k, 0) + 1
    print(f'  saved {len(feats)} features {counts}, {len(trails)} trails, {len(fields)} crop fields')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('counties', nargs='+')
    ap.add_argument('--zoom', type=int, default=14)
    ap.add_argument('--block', type=int, default=12, help='core block size in tiles')
    ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--calibrate', action='store_true')
    args = ap.parse_args()
    t0 = time.time()
    with psycopg.connect(S.database_url()) as conn:
        for name in args.counties:
            run_area(name, args, conn)
    print(f'done in {(time.time() - t0) / 60:.1f} min')


if __name__ == '__main__':
    main()
