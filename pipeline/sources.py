"""Grid math and data fetchers (Mapterhorn DEM, USDA CDL, OpenStreetMap, county areas from PostGIS)."""
import importlib.util
import json
import math
import os
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# rasterio ships its own PROJ database; a system-wide PROJ_LIB (e.g. PostGIS's) is an older, incompatible one.
_rio = Path(importlib.util.find_spec('rasterio').origin).parent
os.environ['PROJ_DATA'] = os.environ['PROJ_LIB'] = str(_rio / 'proj_data')

import numpy as np  # noqa: E402
import rasterio  # noqa: E402
from PIL import Image  # noqa: E402
from rasterio import features as rfeatures  # noqa: E402
from rasterio.transform import Affine  # noqa: E402
from rasterio.warp import Resampling, reproject, transform_bounds  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
CACHE = DATA / 'cache'
HALF = 20037508.342789244
R_EARTH = 6378137.0
UA = 'hunt-app/0.1 (self-hosted terrain pipeline)'


def http_get(url, data=None, tries=4, timeout=300):
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, data=data, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.read()
        except Exception:
            if attempt == tries:
                raise
            time.sleep(3 * attempt)


# --- Web Mercator grid -------------------------------------------------------------------------

def lnglat_to_merc(lng, lat):
    lng, lat = np.asarray(lng, float), np.asarray(lat, float)
    return R_EARTH * np.radians(lng), R_EARTH * np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))


def merc_to_lnglat(x, y):
    return np.degrees(np.asarray(x) / R_EARTH), np.degrees(2 * np.arctan(np.exp(np.asarray(y) / R_EARTH)) - np.pi / 2)


def tile_of(lng, lat, z):
    n = 2 ** z
    x = int((lng + 180) / 360 * n)
    r = math.radians(lat)
    y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)
    return x, y


class Grid:
    """A raster aligned to the XYZ tile grid at zoom z (256-px tiles)."""

    def __init__(self, z, tx0, ty0, ntx, nty):
        self.z, self.tx0, self.ty0, self.ntx, self.nty = z, tx0, ty0, ntx, nty
        self.tile_m = 2 * HALF / 2 ** z
        self.px = self.tile_m / 256
        self.x0 = -HALF + tx0 * self.tile_m
        self.y0 = HALF - ty0 * self.tile_m
        self.shape = (nty * 256, ntx * 256)
        self.transform = Affine(self.px, 0, self.x0, 0, -self.px, self.y0)
        _, lat_c = merc_to_lnglat(0, self.y0 - self.shape[0] * self.px / 2)
        self.g = self.px * math.cos(math.radians(float(lat_c)))  # ground metres per cell

    def cells(self, metres):
        return max(1, int(round(metres / self.g)))

    def rc_to_lnglat(self, r, c):
        return merc_to_lnglat(self.x0 + (np.asarray(c) + 0.5) * self.px, self.y0 - (np.asarray(r) + 0.5) * self.px)


# --- DEM: Mapterhorn terrarium tiles (USGS 3DEP-based in the US) -------------------------------

def _mapterhorn_path(z, x, y):
    return CACHE / 'mapterhorn' / str(z) / str(x) / f'{y}.webp'


def prefetch_dem(z, xs, ys, workers=8):
    """Download Mapterhorn tiles at zoom z-1 covering tile ranges xs, ys at zoom z."""
    need = [(z - 1, X, Y) for X in range(xs[0] // 2, xs[1] // 2 + 1) for Y in range(ys[0] // 2, ys[1] // 2 + 1)
            if not _mapterhorn_path(z - 1, X, Y).exists()]

    def get(t):
        p = _mapterhorn_path(*t)
        p.parent.mkdir(parents=True, exist_ok=True)
        try:
            p.write_bytes(http_get(f'https://tiles.mapterhorn.com/{t[0]}/{t[1]}/{t[2]}.webp'))
        except Exception as e:  # missing tiles are filled from neighbours later
            print(f'  dem tile {t} failed: {e}')

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(get, need))
    return len(need)


def dem(grid):
    """Elevation (m) for the grid, mosaicked from 512-px zoom z-1 tiles (same resolution as z at 256 px)."""
    zz = grid.z - 1
    X0, X1 = grid.tx0 // 2, (grid.tx0 + grid.ntx - 1) // 2
    Y0, Y1 = grid.ty0 // 2, (grid.ty0 + grid.nty - 1) // 2
    mosaic = np.full(((Y1 - Y0 + 1) * 512, (X1 - X0 + 1) * 512), np.nan, np.float32)
    for X in range(X0, X1 + 1):
        for Y in range(Y0, Y1 + 1):
            p = _mapterhorn_path(zz, X, Y)
            if not p.exists():
                continue
            a = np.asarray(Image.open(p).convert('RGB'), np.float32)
            mosaic[(Y - Y0) * 512:(Y - Y0 + 1) * 512, (X - X0) * 512:(X - X0 + 1) * 512] = \
                a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    ox, oy = (grid.tx0 - 2 * X0) * 256, (grid.ty0 - 2 * Y0) * 256
    out = mosaic[oy:oy + grid.shape[0], ox:ox + grid.shape[1]]
    bad = ~np.isfinite(out)
    if bad.any():
        from scipy.ndimage import distance_transform_edt
        idx = distance_transform_edt(bad, return_distances=False, return_indices=True)
        out = out[tuple(idx)]
    return out.astype(np.float32)


# --- USDA Cropland Data Layer (30 m crop + land cover) ------------------------------------------

def cdl_file(bbox, year=2025):
    """Clip of the CDL for a lng/lat bbox, cached. Falls back a year if the requested one isn't published."""
    albers = transform_bounds('EPSG:4326', 'EPSG:5070', *bbox)
    key = '_'.join(str(round(v)) for v in albers)
    for y in (year, year - 1):
        path = CACHE / 'cdl' / f'CDL_{y}_{key}.tif'
        if path.exists():
            return path, y
        try:
            xml = http_get('https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLFile?' +
                           urllib.parse.urlencode({'year': y, 'bbox': ','.join(str(round(v)) for v in albers)})).decode()
            url = xml.split('<returnURL>')[1].split('</returnURL>')[0]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(http_get(url))
            return path, y
        except Exception as e:
            print(f'  CDL {y} unavailable: {e}')
    raise RuntimeError('no CDL available')


def cdl_on_grid(grid, path):
    out = np.zeros(grid.shape, np.uint8)
    with rasterio.open(path) as src:
        reproject(source=rasterio.band(src, 1), destination=out, dst_transform=grid.transform, dst_crs='EPSG:3857',
                  resampling=Resampling.nearest)
    return out


# --- OpenStreetMap disturbance sources (roads, buildings, trails) -------------------------------

OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']
ROAD_WEIGHT = {'motorway': 1.0, 'trunk': 1.0, 'primary': 1.0, 'secondary': 0.9, 'tertiary': 0.7, 'unclassified': 0.6,
               'residential': 0.8, 'service': 0.4, 'track': 0.2, 'cycleway': 0.7, 'rail': 0.5}


def _overpass(q):
    last = None
    for url in OVERPASS:
        try:
            return json.loads(http_get(url, data=urllib.parse.urlencode({'data': q}).encode(), tries=2))
        except Exception as e:
            last = e
    raise last


def _water(b):
    # Lakes, ponds, reservoirs, river areas: closed rings (relation members that close on their own).
    res = _overpass(f'[out:json][timeout:300];(way["natural"="water"]({b});way["landuse"="reservoir"]({b});'
                    f'way["waterway"="riverbank"]({b});relation["natural"="water"]({b}););out geom;')
    rings = []
    for el in res['elements']:
        parts = [el['geometry']] if el['type'] == 'way' else [m['geometry'] for m in el.get('members', [])
                                                               if m.get('role') == 'outer' and m.get('geometry')]
        for g in parts:
            ring = [[p['lon'], p['lat']] for p in g]
            if len(ring) >= 4 and ring[0] == ring[-1]:
                rings.append(ring)
    return rings


def osm(bbox):
    w, s, e, n = bbox
    path = CACHE / 'osm' / f'{w:.3f}_{s:.3f}_{e:.3f}_{n:.3f}.json'
    b = f'{s},{w},{n},{e}'
    if path.exists():
        data = json.loads(path.read_text())
        if 'water' not in data:  # caches written before water polygons were added
            data['water'] = _water(b)
            path.write_text(json.dumps(data))
        return data, path
    roads = _overpass(f'[out:json][timeout:300];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|'
                      f'residential|service|track|cycleway)$"]({b});way["railway"="rail"]({b}););out geom;')
    bldg = _overpass(f'[out:json][timeout:300];(way["building"]({b});node["building"]({b}););out center;')
    data = {
        'roads': [[el['tags'].get('highway') or 'rail', [[p['lon'], p['lat']] for p in el['geometry']]]
                  for el in roads['elements'] if el.get('geometry')],
        'buildings': [[el['center']['lon'], el['center']['lat']] if 'center' in el else [el['lon'], el['lat']]
                      for el in bldg['elements'] if 'center' in el or 'lon' in el],
        'water': _water(b),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data))
    return data, path


def _merc_coords(coords):
    x, y = lnglat_to_merc([c[0] for c in coords], [c[1] for c in coords])
    return list(zip(x.tolist(), y.tolist()))


def rasterize_roads(grid, data):
    """Per-cell max road weight (0 = no road)."""
    shapes = [({'type': 'LineString', 'coordinates': _merc_coords(c)}, ROAD_WEIGHT.get(k, 0.5))
              for k, c in data['roads'] if len(c) > 1]
    if not shapes:
        return np.zeros(grid.shape, np.float32)
    shapes.sort(key=lambda s: s[1])  # later shapes overwrite: strongest last
    return rfeatures.rasterize(shapes, out_shape=grid.shape, transform=grid.transform, all_touched=True,
                               dtype='float32', fill=0)


def rasterize_highways(grid, data):
    """2 = interstate / four-lane (OSM motorway, trunk), 1 = other highways (primary), 0 = everything else."""
    cls = {'motorway': 2, 'trunk': 2, 'primary': 1}
    shapes = [({'type': 'LineString', 'coordinates': _merc_coords(c)}, cls[k]) for k, c in data['roads'] if k in cls and len(c) > 1]
    if not shapes:
        return np.zeros(grid.shape, np.uint8)
    shapes.sort(key=lambda s: s[1])
    return rfeatures.rasterize(shapes, out_shape=grid.shape, transform=grid.transform, all_touched=True, dtype='uint8', fill=0)


def ms_buildings():
    """Microsoft's ML building footprints (minedbuildings, ODbL) as centroids. Rural houses OSM misses are in it, e.g. the
    house beside the quarry pinch (field-knowledge L18). Files: data/cache/ms_buildings/<quadkey>.csv.gz."""
    import gzip
    d = CACHE / 'ms_buildings'
    npy = d / 'centroids.npy'
    if npy.exists():
        return np.load(npy)
    pts = []
    for f in sorted(d.glob('*.csv.gz')):
        with gzip.open(f, 'rt') as fh:
            for line in fh:
                ring = json.loads(line)['geometry']['coordinates'][0]
                pts.append((sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)))
    arr = np.array(pts, np.float64) if pts else np.zeros((0, 2))
    np.save(npy, arr)
    return arr


def buildings(osm, bbox=None):
    """OSM building points plus Microsoft footprints (optionally clipped to bbox w,s,e,n)."""
    ms = ms_buildings()
    if bbox is not None:
        w, s, e, n = bbox
        ms = ms[(ms[:, 0] >= w) & (ms[:, 0] <= e) & (ms[:, 1] >= s) & (ms[:, 1] <= n)]
    return list(osm.get('buildings', [])) + ms.tolist()


def rasterize_points(grid, pts):
    out = np.zeros(grid.shape, bool)
    if not pts:
        return out
    x, y = lnglat_to_merc([p[0] for p in pts], [p[1] for p in pts])
    c = ((x - grid.x0) / grid.px).astype(int)
    r = ((grid.y0 - y) / grid.px).astype(int)
    ok = (r >= 0) & (c >= 0) & (r < grid.shape[0]) & (c < grid.shape[1])
    out[r[ok], c[ok]] = True
    return out


def rasterize_water(grid, rings):
    shapes = [({'type': 'Polygon', 'coordinates': [_merc_coords(r)]}, 1) for r in rings]
    if not shapes:
        return np.zeros(grid.shape, bool)
    return rfeatures.rasterize(shapes, out_shape=grid.shape, transform=grid.transform, dtype='uint8', fill=0).astype(bool)


_parcel_conn = None
def rasterize_parcels(grid):
    """True where some parcel covers the cell. Water outside every parcel (a long unowned gap between parcels) is a
    river deer can cross; water inside a parcel is a pond or lake (field-knowledge L11)."""
    global _parcel_conn
    import psycopg
    if _parcel_conn is None:
        _parcel_conn = psycopg.connect(database_url(), autocommit=True)
    w, n = merc_to_lnglat(grid.x0, grid.y0)
    e, s = merc_to_lnglat(grid.x0 + grid.shape[1] * grid.px, grid.y0 - grid.shape[0] * grid.px)
    rows = _parcel_conn.execute('SELECT ST_AsGeoJSON(geom)::json FROM parcels WHERE geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)',
                                (float(w), float(s), float(e), float(n))).fetchall()
    if not rows:
        return None
    def conv(g):
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        return {'type': 'MultiPolygon', 'coordinates': [[_merc_coords(ring) for ring in poly] for poly in polys]}
    return rfeatures.rasterize([(conv(g), 1) for (g,) in rows], out_shape=grid.shape, transform=grid.transform,
                               dtype='uint8', fill=0).astype(bool)


def rasterize_area(grid, geojson):
    def conv(g):
        if g['type'] == 'Polygon':
            return {'type': 'Polygon', 'coordinates': [_merc_coords(ring) for ring in g['coordinates']]}
        return {'type': 'MultiPolygon', 'coordinates': [[_merc_coords(ring) for ring in poly] for poly in g['coordinates']]}
    return rfeatures.rasterize([(conv(geojson), 1)], out_shape=grid.shape, transform=grid.transform, dtype='uint8',
                               fill=0).astype(bool)


# --- PostGIS -------------------------------------------------------------------------------------

def database_url():
    for line in (ROOT / '.env').read_text().splitlines():
        if line.startswith('DATABASE_URL='):
            return line.split('=', 1)[1].strip()
    raise RuntimeError('DATABASE_URL missing from .env')


def county_area(conn, names, buffer_m=200):
    """Union of the named counties (buffered slightly), as GeoJSON + lng/lat bbox."""
    row = conn.execute(
        """SELECT ST_AsGeoJSON(g), ST_XMin(g), ST_YMin(g), ST_XMax(g), ST_YMax(g), array_agg_names
           FROM (SELECT ST_Buffer(ST_Union(geom)::geography, %s)::geometry AS g, array_agg(name) AS array_agg_names
                 FROM boundaries WHERE kind = 'county' AND lower(name) = ANY(%s)) s""",
        (buffer_m, [n.lower() for n in names])).fetchone()
    if not row or row[0] is None or len(row[5]) != len(names):
        raise SystemExit(f'county not found in boundaries table: {names} (run `npm run ingest -- counties`)')
    return json.loads(row[0]), (row[1], row[2], row[3], row[4])
