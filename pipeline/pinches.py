"""Forced-path pinches (field-knowledge L10): where the land squeezes deer travel into one narrow lane.

Terrain only, ~1.9 m DEM (Mapterhorn z15, 3DEP). Gentle ground is cheap to walk, steep costly, cliffs (35 deg+) nearly
impassable, water impassable. From a 250 m grid of start points, the easiest route to every cell within ~700 m is one
shortest-path tree; counting the destinations each cell carries gives terrain "betweenness". A pinch is a busy, narrow
lane with a hard barrier (cliff/steep bank 30 deg+, or water) within 20 m on two opposite sides: a gap through a bluff,
a lane around a pit, land between ponds. Validated on the McClain quarry: "Pinch Entrance" ranks #2 of its 2.8 km square.

Usage: pipeline/.venv/Scripts/python pipeline/pinches.py Callaway Cooper Cole Boone [--workers 8]
Results per window are kept in data/cache/pinches/ (resumable), then written to the `pinches` table.
"""
import argparse, io, json, math, os, sys, time, urllib.request
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from numba import njit
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.feature import peak_local_max
from skimage.graph import MCP_Geometric

sys.path.insert(0, str(Path(__file__).parent))
import sources as S  # noqa: E402

Z = 15
WIN = 4            # window = 4x4 z15 tiles (~3.8 km); results kept from the centre 2x2 (~1.9 km)
SPACING_M = 300    # start-point grid
REACH_M = 550      # trips stay local (and each start only computes ground within reach: fast)
API = 'http://127.0.0.1:8787/imagery/dem'
DEM_CACHE = S.CACHE / 'dem'
OUT = S.CACHE / 'pinches'


def tile_xy(lng, lat, z=Z):
    n = 2 ** z; r = math.radians(lat)
    return (lng + 180) / 360 * n, (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n


def dem_tile(x, y):
    f = DEM_CACHE / str(Z) / str(x) / f'{y}.img'      # the API's disk cache, filled on demand
    b = f.read_bytes() if f.exists() else None
    for i in range(6):
        if b: break
        try:
            b = urllib.request.urlopen(f'{API}/{Z}/{x}/{y}', timeout=120).read()
        except Exception:
            time.sleep(3 + 3 * i)
    if not b: raise RuntimeError(f'no DEM tile {x},{y}')
    a = np.asarray(Image.open(io.BytesIO(b)).convert('RGB')).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


@njit
def carry(order, pred, weight):
    c = weight.copy()
    for k in order:
        p = pred[k]
        if p >= 0:
            c[p] += c[k]
    return c


def flat_water(dem, m):
    # Hydro-flattened lidar: water reads as one exact height (1/16 m steps) over the whole patch.
    flat = (ndi.maximum_filter(dem, 3) - ndi.minimum_filter(dem, 3)) == 0
    flat = ndi.binary_opening(flat, iterations=1)
    lab, n = ndi.label(flat)
    if not n: return flat
    ids = np.arange(1, n + 1)
    sizes = ndi.sum(flat, lab, ids) * m * m
    # Water sits below its banks; a dead-flat field doesn't (it made fake 4-yard "lanes" mid-field, 2026-10-04).
    ring = ndi.grey_dilation(lab, size=7) * (lab == 0)
    below = (ndi.mean(dem, ring, ids) - ndi.mean(dem, lab, ids)) >= 0.3
    return np.isin(lab, ids[(sizes >= 150) & below])


def osm_water(shape, px, rings):
    img = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(img)
    for ring in rings:
        d.polygon([px(x, y)[::-1] for x, y in ring], fill=1)
    return np.asarray(img).astype(bool)


_conn = None
def owned_mask(shape, px, bbox):
    # Land somebody owns. Water outside every parcel (a long unowned strip between parcels) is a river: deer can cross
    # it at a good pinch. Water inside a parcel is a pond or lake: they walk around (field-knowledge L7, L11).
    global _conn
    import psycopg
    if _conn is None: _conn = psycopg.connect(S.database_url(), autocommit=True)
    rows = _conn.execute('SELECT ST_AsGeoJSON(geom)::json FROM parcels WHERE geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)', bbox).fetchall()
    img = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(img)
    for (g,) in rows:
        for poly in (g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]):
            d.polygon([px(x, y)[::-1] for x, y in poly[0]], fill=1)
    return np.asarray(img).astype(bool), len(rows)


PLAN = S.DATA / 'tiles' / 'plan' / '14'
def plan_codes(tx, ty):
    # The terrain model's cover code (1 timber, 2 thick, 3 crop, 4 pasture/hay, 5 developed, 6 water) for one z15 tile,
    # cut from its z14 data tile and scaled up.
    f = PLAN / str(tx // 2) / f'{ty // 2}.png'
    if not f.exists(): return np.zeros((512, 512), np.uint8)
    a = np.asarray(Image.open(f).convert('RGBA'))[..., 0]
    q = a[(ty % 2) * 128:(ty % 2) * 128 + 128, (tx % 2) * 128:(tx % 2) * 128 + 128]
    return np.kron(q, np.ones((4, 4), np.uint8))


def run_window(job):
    tx, ty, rings, keep, houses = job   # tx, ty = top-left z15 tile of the window
    done = OUT / f'{tx}_{ty}.json'
    if done.exists(): return json.loads(done.read_text())
    T = 512
    dem = np.vstack([np.hstack([dem_tile(tx + i, ty + j) for i in range(WIN)]) for j in range(WIN)])
    H, W = dem.shape
    n = 2 ** Z
    lat_c = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty + WIN / 2) / n))))
    m = 40075016.686 * math.cos(math.radians(lat_c)) / (n * T)
    def px(lng, lat):
        x, y = tile_xy(lng, lat); return (y - ty) * T, (x - tx) * T
    def ll(r, c):
        x = tx + c / T; y = ty + r / T
        return x / n * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    water = flat_water(dem, m) | osm_water(dem.shape, px, rings)
    w_lng, n_lat = ll(0, 0); e_lng, s_lat = ll(H, W)
    owned, n_parcels = owned_mask(dem.shape, px, (w_lng, s_lat, e_lng, n_lat))
    river = np.zeros_like(water)
    if n_parcels:
        lab, nl = ndi.label(water)
        if nl:
            unowned = ndi.mean(~owned, lab, range(1, nl + 1))
            river = np.isin(lab, np.flatnonzero(unowned >= 0.5) + 1)
    g = ndi.gaussian_filter(dem, 1.0)
    gy, gx = np.gradient(g, m)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    # A bank is a barrier only if it actually rises (2 m+ within ~10 m); field terraces don't stop a deer.
    relief = ndi.maximum_filter(dem, int(10 / m) | 1) - ndi.minimum_filter(dem, int(10 / m) | 1)
    barrier = ((slope >= 30) & (relief >= 2)) | water
    # Daylight soft barrier (field-knowledge L18): deer won't step into an open yard, pasture or field near a house.
    # Houses = OSM buildings + compact developed patches (farmsteads; thin road strips removed). Open ground within
    # 150 m of a house and anything within 40 m of a building count, so a timber strip between a quarry and a yard is a lane.
    code = np.vstack([np.hstack([plan_codes(tx + i, ty + j) for i in range(WIN)]) for j in range(WIN)])
    house = ndi.binary_opening(code == 5, structure=np.ones((int(37 / m) | 1,) * 2))
    bpts = np.zeros_like(house)
    for lng_b, lat_b in houses:
        r, c = px(lng_b, lat_b)
        if 0 <= r < H and 0 <= c < W: bpts[int(r), int(c)] = True
    near_house = ndi.distance_transform_edt(~(house | bpts)) * m
    near_bld = ndi.distance_transform_edt(~bpts) * m if bpts.any() else np.full(bpts.shape, np.inf)
    soft = ((np.isin(code, (3, 4, 5)) & (near_house < 150)) | (near_bld < 40)) & ~water
    hard = barrier.copy()
    barrier |= soft
    centre = (slice(T, 3 * T), slice(T, 3 * T))
    out = []
    if hard[centre].mean() > 0.002 and keep:           # flat farmland with no cliffs or water can't pinch
        cost = 1 + (slope / 18) ** 4
        cost[slope >= 35] = 500
        cost[water] = np.inf
        cost[river] = 40                                  # crossable, at a price
        cost[soft] *= 5                                   # daylight: deer skirt yards and open ground by houses
        walk = np.isfinite(cost) & (cost < 50)
        rng = np.random.default_rng(tx * 100003 + ty)
        noises = []
        for _ in range(3):
            nz = ndi.gaussian_filter(rng.standard_normal(cost.shape), 6 / m); noises.append(np.exp(0.3 * nz / (nz.std() + 1e-9)))
        offsets = None
        total = np.zeros(H * W)
        step = int(SPACING_M / m)
        lo, hi = int(T - REACH_M / m), int(3 * T + REACH_M / m)   # starts whose reach touches the centre
        starts = [(r, c) for r in range(max(step // 2, lo), min(H, hi), step) for c in range(max(step // 2, lo), min(W, hi), step) if walk[r, c]]
        total = total.reshape(H, W)
        R = int(REACH_M * 1.2 / m)
        for i, (r0, c0) in enumerate(starts):
            r1, r2, c1, c2 = max(0, r0 - R), min(H, r0 + R + 1), max(0, c0 - R), min(W, c0 + R + 1)
            sub_cost = cost[r1:r2, c1:c2] * noises[i % 3][r1:r2, c1:c2]
            h, w = sub_cost.shape
            mcp = MCP_Geometric(sub_cost, fully_connected=True)
            if offsets is None: offsets = np.array(mcp.offsets)
            acc, tb = mcp.find_costs([(r0 - r1, c0 - c1)], max_cumulative_cost=REACH_M / m * 1.5)
            acc = acc.ravel(); tb = tb.ravel()
            ok = np.isfinite(acc) & (tb >= 0) & (acc <= REACH_M / m * 1.5)
            idx = np.flatnonzero(ok)
            if not len(idx): continue
            pr = idx // w - offsets[tb[idx], 0]; pc = idx % w - offsets[tb[idx], 1]
            good = (pr >= 0) & (pr < h) & (pc >= 0) & (pc < w)
            pred = np.full(h * w, -1, np.int64); pred[idx[good]] = pr[good] * w + pc[good]
            lr, lc = np.indices((h, w))
            dist = np.hypot(lr - (r0 - r1), lc - (c0 - c1)).ravel() * m
            weight = (walk[r1:r2, c1:c2].ravel() & ok & (dist > 200)).astype(np.float64)
            cnt = carry(idx[np.argsort(-acc[idx], kind='stable')], pred, weight)
            cnt[dist < 100] = 0
            total[r1:r2, c1:c2] += cnt.reshape(h, w)
        f = total / max(1, len(starts))
        walkable = (slope < 30) & ~water
        half = ndi.distance_transform_edt(walkable) * m
        narrow = np.clip(25 / (2 * ndi.maximum_filter(half, size=int(10 / m) | 1) + 5), 0.2, 2.5)
        reach = int(20 / m); hit = np.zeros_like(barrier)
        for ang in range(0, 180, 22):
            dy, dx = -math.cos(math.radians(ang)), math.sin(math.radians(ang))
            a = np.zeros_like(barrier); b = np.zeros_like(barrier)
            for d in range(2, reach + 1, 2):
                sh = (int(round(dy * d)), int(round(dx * d)))
                a |= np.roll(barrier, sh, axis=(0, 1)); b |= np.roll(barrier, (-sh[0], -sh[1]), axis=(0, 1))
            hit |= a & b
        score = ndi.gaussian_filter(f, 3 / m) * narrow * walkable * hit
        sc = np.zeros_like(score); sc[centre] = score[centre]
        for r, c in peak_local_max(sc, min_distance=int(80 / m), threshold_abs=1.0, num_peaks=400):
            lng, lat = ll(r, c)
            out.append([round(lng, 6), round(lat, 6), round(float(score[r, c]), 2), round(float(2 * half[r, c]), 1),
                        round(float(slope[r, c]), 1), round(float(dem[r, c]), 1)])
    OUT.mkdir(parents=True, exist_ok=True)
    done.write_text(json.dumps(out))
    return out



def refresh_show(conn, area, rings):
    """Which pinches the map shows: strong (250+), not inside a crop field, the strongest within ~180 m. Tiny level lanes
    (4 m or less, under 4 deg) only when a mapped pond/lake is right beside them: real two-pond lanes stay, field
    artifacts don't (field-knowledge L14, S1)."""
    from shapely.geometry import Point, Polygon
    from shapely.strtree import STRtree
    conn.execute("""UPDATE pinches a SET show = (score >= 250
        AND NOT EXISTS (SELECT 1 FROM food_areas f WHERE f.geom && a.geom AND ST_Intersects(f.geom, a.geom))
        AND NOT EXISTS (SELECT 1 FROM pinches b WHERE b.geom && ST_Expand(a.geom, 0.0018) AND ST_DWithin(a.geom, b.geom, 0.0018)
                        AND b.score > a.score)) WHERE area = %s""", (area,))
    polys = [Polygon(r) for r in rings if len(r) >= 4]
    tree = STRtree(polys) if polys else None
    tiny = conn.execute("SELECT id, ST_X(geom), ST_Y(geom) FROM pinches WHERE area = %s AND show AND lane_m <= 4 AND slope < 4", (area,)).fetchall()
    drop = [i for i, x, y in tiny if not (tree and any(polys[k].distance(Point(x, y)) < 0.0004 for k in tree.query(Point(x, y).buffer(0.0004))))]
    if drop:
        conn.execute('UPDATE pinches SET show = false WHERE id = ANY(%s)', (drop,))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('counties', nargs='+')
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--show-only', action='store_true', help='just refresh which pinches the map shows')
    args = ap.parse_args()
    import psycopg
    from psycopg.types.json import Jsonb
    from shapely.geometry import shape, box
    conn = psycopg.connect(S.database_url(), autocommit=True)
    for name in args.counties:
        area = name.lower()
        geojson, bbox = S.county_area(conn, [name])
        county = shape(geojson)
        osm, _ = S.osm((bbox[0] - 0.03, bbox[1] - 0.03, bbox[2] + 0.03, bbox[3] + 0.03))
        rings = osm.get('water', [])
        if args.show_only:
            refresh_show(conn, area, rings); print(f'{name}: show flags refreshed', flush=True); continue
        x0, y0 = (int(v) for v in tile_xy(bbox[0], bbox[3])); x1, y1 = (int(v) for v in tile_xy(bbox[2], bbox[1]))
        jobs = []
        n = 2 ** Z
        lng = lambda x: x / n * 360 - 180
        lat = lambda y: math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
        for tx in range(x0 - 1, x1 + 1, 2):
            for ty in range(y0 - 1, y1 + 1, 2):
                core = box(lng(tx + 1), lat(ty + 3), lng(tx + 3), lat(ty + 1))
                if not core.intersects(county): continue
                win = box(lng(tx), lat(ty + WIN), lng(tx + WIN), lat(ty))
                wr = [r for r in rings if win.intersects(box(min(p[0] for p in r), min(p[1] for p in r), max(p[0] for p in r), max(p[1] for p in r)))]
                wb = S.buildings(osm, (lng(tx), lat(ty + WIN), lng(tx + WIN), lat(ty)))   # OSM + Microsoft footprints
                jobs.append((tx, ty, wr, True, wb))
        print(f'{name}: {len(jobs)} windows', flush=True)
        t0 = time.time(); found = []
        with Pool(args.workers) as pool:
            for i, res in enumerate(pool.imap_unordered(run_window, jobs), 1):
                found += res
                if i % 25 == 0 or i == len(jobs):
                    print(f'  {i}/{len(jobs)} windows, {len(found)} pinches, {time.time() - t0:.0f}s', flush=True)
        found = [p for p in found if county.contains(shape({'type': 'Point', 'coordinates': p[:2]}))]
        with conn.transaction():
            conn.execute('DELETE FROM pinches WHERE area = %s', (area,))
            with conn.cursor() as cur:
                cur.executemany(
                    'INSERT INTO pinches (area, score, lane_m, slope, elev, geom) VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_Point(%s, %s), 4326))',
                    [(area, p[2], p[3], p[4], p[5], p[0], p[1]) for p in found])
        refresh_show(conn, area, rings)
        print(f'{name}: saved {len(found)} pinches', flush=True)


if __name__ == '__main__':
    main()
