"""Terrain intelligence: hydrology, landforms, cover, bedding probability, travel corridors (docs/research/05 §4)."""
import heapq

import numpy as np
from numba import njit
from scipy import ndimage as ndi
from skimage.graph import MCP_Geometric

# --- Hydrology -------------------------------------------------------------------------------------

@njit(cache=True)
def fill_depressions(z):
    """Priority-flood (Barnes 2014) with an epsilon gradient so flats drain."""
    rows, cols = z.shape
    f = z.copy()
    closed = np.zeros(z.shape, np.bool_)
    heap = [(0.0, np.int64(0))]
    heap.pop()
    for r in range(rows):
        for c in range(cols):
            if r == 0 or c == 0 or r == rows - 1 or c == cols - 1:
                closed[r, c] = True
                heapq.heappush(heap, (f[r, c], np.int64(r * cols + c)))
    while len(heap) > 0:
        e, idx = heapq.heappop(heap)
        r = idx // cols
        c = idx % cols
        for dr in range(-1, 2):
            for dc in range(-1, 2):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if nr < 0 or nc < 0 or nr >= rows or nc >= cols or closed[nr, nc]:
                    continue
                closed[nr, nc] = True
                v = f[nr, nc]
                if v <= e:
                    v = e + 1e-5
                    f[nr, nc] = v
                heapq.heappush(heap, (v, np.int64(nr * cols + nc)))
    return f


@njit(cache=True)
def d8_receivers(f):
    rows, cols = f.shape
    rcv = np.full(rows * cols, -1, np.int64)
    for r in range(rows):
        for c in range(cols):
            best, bi, z0 = 0.0, -1, f[r, c]
            for dr in range(-1, 2):
                for dc in range(-1, 2):
                    if dr == 0 and dc == 0:
                        continue
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nc < 0 or nr >= rows or nc >= cols:
                        continue
                    s = (z0 - f[nr, nc]) / (1.4142135 if dr != 0 and dc != 0 else 1.0)
                    if s > best:
                        best, bi = s, nr * cols + nc
            rcv[r * cols + c] = bi
    return rcv


@njit(cache=True)
def accumulate(order, rcv):
    acc = np.ones(rcv.size, np.float64)
    for i in order:
        j = rcv[i]
        if j >= 0:
            acc[j] += acc[i]
    return acc


def hydrology(z, g):
    f = fill_depressions(z.astype(np.float64))
    rcv = d8_receivers(f)
    acc = accumulate(np.argsort(-f.ravel(), kind='stable'), rcv)
    area = (acc * g * g).reshape(z.shape).astype(np.float32)  # upstream area, m²
    # Confluences: cells receiving ≥2 draws (each ≥2 ha).
    donors = np.flatnonzero((acc * g * g >= 2e4) & (rcv >= 0))
    n_in = np.bincount(rcv[donors], minlength=rcv.size).reshape(z.shape)
    return area, n_in


# --- Cover from the Cropland Data Layer --------------------------------------------------------------

FOREST = [141, 142, 143, 190]
SHRUB = [152]
WATER = [111]
BIG_WATER_M2 = 10 * 4046.86  # 10 acres: deer go around, not across
DEVELOPED = [122, 123, 124]
CROPS = {'corn': [1, 225, 237], 'soybeans': [5, 239, 240, 241, 254], 'wheat': [21, 22, 23, 24, 26, 27, 28, 236, 238],
         'alfalfa': [36, 58], 'hay': [37], 'sorghum': [4]}

# Screening-cover score (MSU: used beds had 2× the screening cover). Deciduous timber is middling: CDL can't
# tell understory from open mature timber.
SCREEN = np.full(256, 0.3, np.float32)
for codes, v in [([152], 1.0), ([190], 0.9), ([142], 0.9), ([195], 0.7), ([143], 0.6), ([141], 0.5), ([61], 0.6),
                 ([1, 225, 237], 0.6), ([4], 0.4), ([37], 0.25), ([176, 59], 0.2), ([5, 239, 240, 241, 254], 0.15),
                 ([36, 58], 0.1), (CROPS['wheat'], 0.05), ([121], 0.05), (DEVELOPED + WATER + [131], 0.0)]:
    SCREEN[codes] = v

# General deer-food value (season-agnostic; the app re-weights food polygons by phase).
FOOD = np.zeros(256, np.float32)
for codes, v in [([36, 58], 1.0), ([5, 239, 240, 241, 254], 0.9), ([1, 225, 237], 0.8), (CROPS['wheat'], 0.7),
                 ([4], 0.6), ([37], 0.5)]:
    FOOD[codes] = v

# Daylight travel resistance (docs/research/05 §4.5).
RESIST = np.full(256, 3.0, np.float32)
for codes, v in [([152, 190, 142], 1.0), ([143, 141], 2.0), ([195], 1.5), ([61], 1.2), ([1, 225, 237], 1.5),
                 ([4], 2.5), ([121], 8.0), ([122], 40.0), ([123, 124], 80.0), ([131], 4.0), ([111], 50.0),
                 ([176, 59, 37, 36, 58] + CROPS['wheat'] + CROPS['soybeans'], 5.0)]:
    RESIST[codes] = v


def isin(a, codes):
    return np.isin(a, np.asarray(codes, np.uint8))


# --- Helpers ---------------------------------------------------------------------------------------

def box(a, cells):
    return ndi.uniform_filter(a.astype(np.float32), size=2 * cells + 1, mode='nearest')


def peaks(score, mask, radius_cells, limit):
    """Local maxima (non-max suppression) inside mask, strongest first."""
    mx = ndi.maximum_filter(np.where(mask, score, -np.inf), size=2 * radius_cells + 1, mode='constant', cval=-np.inf)
    rr, cc = np.nonzero(mask & (score >= mx) & np.isfinite(score))
    order = np.argsort(-score[rr, cc])[:limit]
    return rr[order], cc[order]


def bump(x, lo, hi, taper):
    """1 inside [lo, hi], linear ramps of width `taper` outside, 0 beyond."""
    return np.clip(np.minimum((x - (lo - taper)) / taper, ((hi + taper) - x) / taper), 0, 1)


sigmoid = lambda x: 1 / (1 + np.exp(-x))  # noqa: E731

# Logit offsets so roughly the top 5–10% of cover cells score > 0.5 (calibrated on Callaway, 2026-09).
BIAS_BUCK = 3.0
BIAS_DOE = 2.3


# --- The model -------------------------------------------------------------------------------------


@njit(cache=True)
def _carry(order, pred, weight):
    # Destinations carried through each cell of a shortest-path tree (order: far-to-near, pred: parent or -1).
    c = weight.copy()
    for k in order:
        p = pred[k]
        if p >= 0:
            c[p] += c[k]
    return c


def _centrelines(mask, value, core, min_len, toward=None):
    """Skeleton of `mask` split into polylines between junctions/ends, kept if inside `core` and >= min_len cells.
    If `toward` (e.g. distance to food) is given, each line runs downhill on it: bed -> food, the evening direction."""
    from skimage.morphology import skeletonize
    sk = skeletonize(mask)
    nb = ndi.convolve(sk.astype(np.uint8), np.ones((3, 3), np.uint8), mode='constant') - 1
    node = sk & (nb != 2)
    seen = np.zeros_like(sk)
    r0, r1, c0, c1 = core
    out = []
    H, W = sk.shape
    def nbrs(r, c):
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if (dr or dc) and 0 <= r + dr < H and 0 <= c + dc < W and sk[r + dr, c + dc]:
                    yield r + dr, c + dc
    starts = list(zip(*np.nonzero(node))) or list(zip(*np.nonzero(sk)))[:1]
    for sr, sc in starts:
        for nr, nc in nbrs(sr, sc):
            if seen[nr, nc]:
                continue
            path = [(sr, sc), (nr, nc)]
            seen[nr, nc] = True
            while not node[path[-1]]:
                nxt = [q for q in nbrs(*path[-1]) if not seen[q] and q != path[-2]]
                if not nxt:
                    break
                seen[nxt[0]] = True
                path.append(nxt[0])
            if len(path) >= min_len:
                pa = np.array(path)
                mid = pa[len(pa) // 2]
                if r0 <= mid[0] < r1 and c0 <= mid[1] < c1:
                    if toward is not None and toward[tuple(pa[0])] < toward[tuple(pa[-1])]:
                        pa = pa[::-1]
                    out.append(('travel', float(value[pa[:, 0], pa[:, 1]].mean()), pa[::3]))
    return out

def analyze(grid, z, cdl, roads, buildings, in_area, core, osm_water=None, owned=None, highways=None):
    """Everything for one block. `core` = (r0, r1, c0, c1) region whose vectors this block owns."""
    g = grid.g
    C = grid.cells
    out = {}

    # Terrain derivatives
    zs = ndi.gaussian_filter(z, 1.5)
    gy, gx = np.gradient(zs, g)
    slope = np.degrees(np.arctan(np.hypot(gx, gy))).astype(np.float32)
    aspect = ((np.degrees(np.arctan2(-gx, gy)) + 360) % 360).astype(np.float32)  # downhill bearing (rows run south)
    tpi50, tpi150, tpi500 = (z - box(z, C(r)) for r in (50, 150, 500))
    w = 2 * C(200) + 1
    zmin, zmax = ndi.minimum_filter(zs, w), ndi.maximum_filter(zs, w)
    rsp = ((zs - zmin) / (zmax - zmin + 0.5)).astype(np.float32)
    del zmin, zmax, gy, gx
    slope60 = box(slope, C(60))

    area, n_in = hydrology(z, g)
    draw = (area >= 2e4) & (area < 5e5)
    creek = area >= 5e5
    cold_pool = (area >= 5e4) & (slope < 5) & (tpi500 < -8)

    # Bench: a flat shelf (<10°) inside steep sidehill (mean slope >12° within 60 m), mid-slope, not a ridge or draw.
    bench = (slope < 10) & (slope60 > 12) & (rsp > 0.2) & (rsp < 0.9) & (tpi150 < 3) & ~draw & ~creek & (np.abs(tpi50) < 2.5)
    lab, n = ndi.label(bench)
    if n:
        sizes = ndi.sum(bench, lab, np.arange(1, n + 1))
        bench = np.isin(lab, np.flatnonzero(sizes * g * g >= 300) + 1)
    ridge = (tpi500 > 12) & (tpi150 > 3) & (slope < 12)
    point = (tpi150 > 4) & (tpi50 > 0.5) & (slope >= 4) & (slope <= 25) & (rsp > 0.5)

    # Cover
    forest = isin(cdl, FOREST)
    cover_mask = forest | isin(cdl, SHRUB + [195, 61])
    # CDL's 30 m pixels miss lake arms and small ponds (it calls them wetland); OSM outlines are exact.
    water = isin(cdl, WATER) | (osm_water if osm_water is not None else False)
    # 3DEP is hydro-flattened: rivers and ponds read as one exact height, sitting below their banks. CDL calls river
    # channels "wetland" and OSM misses many (a doe bed landed mid-river in Cooper, 2026-10-03).
    flat = ndi.binary_opening((ndi.maximum_filter(z, 3) - ndi.minimum_filter(z, 3)) == 0)
    lab, n = ndi.label(flat)
    if n:
        ids = np.arange(1, n + 1)
        big = ndi.sum(flat, lab, ids) * g * g >= 2000
        ring = ndi.grey_dilation(lab, size=5) * (lab == 0)
        below = (ndi.mean(z, ring, ids) - ndi.mean(z, lab, ids)) >= 0.4
        water |= np.isin(lab, ids[big & below])
    # Who owns it: water in an unowned gap between parcels is a river (crossable at a price), owned water is a
    # pond or lake (deer walk around). Field-knowledge L11.
    river = np.zeros_like(water)
    if owned is not None:
        wl, wn = ndi.label(water)
        if wn:
            unowned = ndi.mean(~owned, wl, np.arange(1, wn + 1))
            river = np.isin(wl, np.flatnonzero(unowned >= 0.5) + 1)
    near_water = ndi.distance_transform_edt(~water) * g < 40
    screen = SCREEN[cdl]
    open_ = ~cover_mask & ~water & (cdl > 0)
    dist_open = ndi.distance_transform_edt(~open_) * g
    food = FOOD[cdl] + 0.7 * ((isin(cdl, [141, 143]) & (rsp > 0.4) & (tpi150 > -2)) * 1.0)  # + upland oak (acorns)
    food_mask = food >= 0.5
    dist_food = ndi.distance_transform_edt(~food_mask) * g

    # Human disturbance: roads by class, houses; decays over ~150–200 m.
    d_road = ndi.distance_transform_edt(roads <= 0, return_indices=True)
    road_w = roads[tuple(d_road[1])] * np.exp(-d_road[0] * g / 150)
    del d_road
    d_house = ndi.distance_transform_edt(~buildings) * g
    disturb = np.maximum(road_w, np.exp(-d_house / 200)).astype(np.float32)
    del road_w  # d_house is reused below (building costs, bed spacing)

    # Bedding (docs/research/05 §4.4)
    upper = np.exp(-((rsp - 0.72) / 0.15) ** 2) * (slope > 3)
    pb = np.clip(ndi.gaussian_filter((point | bench).astype(np.float32), 1.5) * 2, 0, 1)
    edge_view = cover_mask & (dist_open < 40)
    south = (aspect >= 135) & (aspect <= 225) & (slope > 5)
    island = cover_mask & (box(open_, C(100)) > 0.6)
    food_buck = bump(dist_food, 300, 1600, 250)
    food_doe = bump(dist_food, 50, 400, 100)
    shared = (2.0 * screen + 1.0 * upper + 0.8 * pb + 0.6 * edge_view + 0.25 * south + 0.6 * island + 0.5 * food_buck
              - 1.5 * disturb - 2.0 * water)
    lee_rsp = np.exp(-((rsp - 0.68) / 0.18) ** 2) * (slope > 6)
    buck = []
    for k in range(8):  # wind from N, NE, ... NW
        downwind = (k * 45 + 180) % 360
        lee = np.clip(np.cos(np.radians(aspect - downwind)), 0, 1) ** 1.5 * lee_rsp
        p = sigmoid(shared + 1.0 * lee - BIAS_BUCK) * in_area * ~water
        buck.append(ndi.gaussian_filter(p.astype(np.float32), 1))
    doe_logit = 2.0 * screen + 1.0 * food_doe + 0.4 * upper + 0.4 * edge_view - 1.2 * disturb - 2.0 * water
    doe = ndi.gaussian_filter((sigmoid(doe_logit - BIAS_DOE) * in_area * ~water).astype(np.float32), 1)
    buck_avg = np.mean(buck, axis=0)
    sample = cover_mask & in_area
    out['calib'] = {k: float(np.quantile(v[sample], 0.93)) if sample.any() else None
                    for k, v in (('buck_logit_q93', shared + 0.3), ('doe_logit_q93', doe_logit))}

    # Travel corridors: least-cost paths bed -> food (feeding) and bed <-> bed (rut), accumulated.
    resist = RESIST[cdl] * (1 + (slope / 25) ** 2) * (1 + 3 * disturb)
    # Busy roads and built-up ground (field-knowledge L16). Crossing an interstate's ~50 m costs like ~4 km of timber, so
    # deer only cross where there's no way around for miles (they do cross between heavy timber; it's rare). Other
    # highways are a strong cost; ground within 20 m of a building costs 4x (yards, lots), mild enough to keep
    # real lanes that pass a house, like the two-pond pinch by County Road 246 he confirmed.
    if highways is not None:
        resist = np.where(ndi.distance_transform_edt(highways < 2) * g < 25, resist * 80, resist)
        resist = np.where((ndi.distance_transform_edt(highways != 1) * g < 12), resist * 8, resist)
    resist = np.where(d_house < 20, resist * 4, resist)
    # Deer skirt deep draws: where two ridges crash together, the bottom is a steep-sided washout. They travel the
    # ridges, points, benches and sidehills and cross at draw heads and saddles (field-knowledge L17).
    # Surgical (he said don't change the logic much): only deep, steep washouts lose the draw discount and cost 2x.
    incised = (draw | creek) & (tpi150 < -6) & (slope60 > 18)
    resist = np.where(bench | ((draw | creek) & cover_mask & ~incised), resist * 0.6, resist)
    resist = np.where(incised, resist * 2.0, resist)
    # Deer walk around water. Big water (>= BIG_WATER_M2, e.g. Little Dixie Lake) is impassable; small ponds just costly.
    lakes = water & ~river
    lab, nlab = ndi.label(lakes)
    big = np.isin(lab, np.flatnonzero(np.bincount(lab.ravel()) * g * g >= BIG_WATER_M2)) & lakes if nlab else lakes & False
    resist = np.where(water, 50.0, resist)   # rivers stay crossable at this price; big lakes become impassable below
    resist = np.where(big, np.inf, resist).astype(np.float64)  # field-knowledge L7: deer won't swim it
    density = np.zeros(z.shape, np.float32)
    trails, beds = [], []
    r0, r1, c0, c1 = core
    radius = C(1300)
    nodes = []
    # A bed needs real cover around it: in cover at least 10 m deep, 25 m+ off water, 60 m+ off any road.
    road_m = ndi.distance_transform_edt(roads <= 0) * g
    bed_ok = cover_mask & ~water & (ndi.distance_transform_edt(cover_mask) * g >= 10) & \
        (ndi.distance_transform_edt(~water) * g >= 25) & (road_m >= 60) & (d_house >= 100)
    for kind, surf, limit in (('bed_buck', buck_avg, 220), ('bed_doe', doe, 220)):
        rr, cc = peaks(surf, (surf > 0.55) & bed_ok, C(150), limit)
        nodes += [(kind, int(r), int(c), float(surf[r, c])) for r, c in zip(rr, cc)]
    for kind, r, c, p in nodes:
        if r0 <= r < r1 and c0 <= c < c1:
            beds.append((kind, r, c, p, [float(b[r, c]) for b in buck] if kind == 'bed_buck' else None))

    # Travel: from EVERY bedding-quality spot (benches, points, saddles, thick cover: any cell the bed models rate
    # >= 0.35), sampled every 250 m, the easiest routes to all food and to other bedding within ~1.3 km. Each start's
    # shortest-path tree is counted once (destinations carried per cell), so overlapping routes build a web that is
    # heavy where many beds' routes funnel together. Replaced "2-5 paths from the top 220 bed peaks", which collapsed
    # thousands of acres into one line (2026-10-04).
    bedv = np.maximum(buck_avg, 0.7 * doe) * bed_ok
    dest = np.maximum(food * 1.0, 0.5 * np.where(bedv >= 0.45, bedv, 0)).astype(np.float64)
    dest[water] = 0
    step = C(250)
    m0, m1 = max(0, r0 - radius), min(z.shape[0], r1 + radius)
    n0, n1 = max(0, c0 - radius), min(z.shape[1], c1 + radius)
    offsets = None
    # A little smooth randomness so flat ground doesn't funnel routes onto grid-straight lines (as in pinches.py).
    nz = ndi.gaussian_filter(np.random.default_rng(r0 * 7919 + c0).standard_normal(resist.shape), 4)
    walk_cost = resist * np.exp(0.35 * nz / (nz.std() + 1e-9))
    for rs in range(m0 + step // 2, m1, step):
        for cs in range(n0 + step // 2, n1, step):
            # strongest bedding cell in this 250 m square
            sub = bedv[rs - step // 2:rs + step // 2, cs - step // 2:cs + step // 2]
            if sub.size == 0 or sub.max() < 0.35:
                continue
            k = np.unravel_index(np.argmax(sub), sub.shape)
            r, c = rs - step // 2 + k[0], cs - step // 2 + k[1]
            wr0, wr1, wc0, wc1 = max(0, r - radius), min(z.shape[0], r + radius), max(0, c - radius), min(z.shape[1], c + radius)
            mcp = MCP_Geometric(walk_cost[wr0:wr1, wc0:wc1], fully_connected=True)
            if offsets is None:
                offsets = np.array(mcp.offsets)
            acc, tb = mcp.find_costs([(r - wr0, c - wc0)])
            h, w = acc.shape
            acc = acc.ravel(); tb = tb.ravel()
            ok = np.isfinite(acc) & (tb >= 0)
            idx = np.flatnonzero(ok)
            if not len(idx):
                continue
            pr = idx // w - offsets[tb[idx], 0]; pc = idx % w - offsets[tb[idx], 1]
            good = (pr >= 0) & (pr < h) & (pc >= 0) & (pc < w)
            pred = np.full(h * w, -1, np.int64); pred[idx[good]] = pr[good] * w + pc[good]
            lr, lc = np.indices((h, w))
            dist = np.hypot(lr - (r - wr0), lc - (c - wc0)).ravel() * g
            wgt = dest[wr0:wr1, wc0:wc1].ravel() * ok * (dist > 120) * np.exp(-dist / 900)   # nearer food matters more
            tot = wgt.sum()
            if tot <= 0:
                continue
            cnt = _carry(idx[np.argsort(-acc[idx], kind='stable')], pred, wgt / tot)
            cnt[dist < 60] = 0
            density[wr0:wr1, wc0:wc1] += (cnt * bedv[r, c]).reshape(h, w).astype(np.float32)
    # Rank-scaled: 0.3 ~ the busiest quarter of the ground deer use, 0.7+ only the busiest few percent (the funnels).
    d = ndi.gaussian_filter(density, 1.5)
    live = (d > 0) & (in_area > 0)
    if live.any():
        lo, hi = np.quantile(np.log1p(d[live] * 1e3), [0.6, 0.998])
        corridor = np.clip((np.log1p(d * 1e3) - lo) / (hi - lo + 1e-9), 0, 1) * in_area * ~water
    else:
        corridor = np.zeros_like(d)
    # Trails = centrelines of the busier travel (corridor >= 0.6), 150 m+ long.
    trails += _centrelines(corridor >= 0.6, corridor, (r0, r1, c0, c1), C(150), toward=dist_food)

    # Point features (docs/research/05 §4.1)
    feats = []

    def add(kind, rr, cc, scores, props=None):
        for i, (r, c) in enumerate(zip(rr, cc)):
            if r0 <= r < r1 and c0 <= c < c1 and in_area[r, c] and not water[r, c]:
                feats.append((kind, int(r), int(c), float(scores[i]), props(r, c) if props else {}))

    # Stand sites on the main travel (2026-10-04). Main paths stay on the map regardless; this only marks the ones
    # where a bow stand works (field-knowledge L4, L10): a spot in cover 15-35 m off the path and 2-15 m above it, not
    # in bedding; 2+ of 8 winds that carry scent away from the path and any bedding; a walk in from a road that skirts
    # bedding (access cost penalises bed cells x15 and walking the travel lane x3).
    acc_cost = 1 + (slope / 18) ** 4
    acc_cost = np.where(bedv >= 0.5, acc_cost * 15, acc_cost)
    acc_cost = np.where(corridor >= 0.6, acc_cost * 3, acc_cost)
    acc_cost[water] = np.inf
    road_cells = np.argwhere(roads > 0)
    access = np.full(z.shape, np.inf)
    if len(road_cells):
        access, _ = MCP_Geometric(acc_cost, fully_connected=True).find_costs([tuple(p) for p in road_cells[::4]])
    H, W = z.shape
    angs = np.radians(np.arange(-25, 26, 12.5))
    dists = np.arange(10, 201, 10) / g
    for ti, (tkind, tw, pa) in enumerate(trails):
        if tw < 0.7 or len(pa) < 3:
            continue
        mr, mc = pa[len(pa) // 2]
        d = (pa[-1] - pa[0]).astype(float); d /= np.hypot(*d) + 1e-9
        nrm = np.array([-d[1], d[0]])
        best = None
        for side in (1, -1):
            for off in range(15, 36, 5):
                sr, sc = int(round(mr + side * nrm[0] * off / g)), int(round(mc + side * nrm[1] * off / g))
                if not (0 <= sr < H and 0 <= sc < W) or water[sr, sc] or not cover_mask[sr, sc] or slope[sr, sc] >= 30 or bedv[sr, sc] >= 0.5:
                    continue
                up = z[sr, sc] - z[mr, mc]
                if 2 <= up <= 15 and (best is None or abs(up - 6) < abs(best[2] - 6)):
                    best = (sr, sc, float(up))
        if best is None:
            continue
        sr, sc, up = best
        good = []
        for w8 in range(8):
            toward = np.radians((w8 * 45 + 180) % 360)   # scent goes downwind
            bad = False
            for a in angs:
                rr = np.round(sr - np.cos(toward + a) * dists).astype(int)
                cc = np.round(sc + np.sin(toward + a) * dists).astype(int)
                okk = (rr >= 0) & (rr < H) & (cc >= 0) & (cc < W)
                rr, cc = rr[okk], cc[okk]
                near = np.hypot(rr - mr, cc - mc) * g < 60
                if (bedv[rr, cc] >= 0.5).any() or ((corridor[rr, cc] >= 0.6) & near).any():
                    bad = True
                    break
            if not bad:
                good.append(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][w8])
        walk_m = float(access[sr, sc] * g)
        if len(good) < 2 or not np.isfinite(walk_m) or walk_m > 1600:
            continue
        trails[ti] = ('stand', tw, pa)
        if r0 <= sr < r1 and c0 <= sc < c1 and in_area[sr, sc]:
            feats.append(('stand_site', sr, sc, float(min(1, tw * (0.5 + len(good) / 8) * np.exp(-walk_m / 2000))),
                          {'winds': good, 'above_ft': round(up * 3.28084), 'walk_yd': round(walk_m / 0.9144),
                           'path_strength': round(tw, 2)}))

    s = C(35)
    hxx = ndi.gaussian_filter(z, s, order=(0, 2)) / g ** 2
    hyy = ndi.gaussian_filter(z, s, order=(2, 0)) / g ** 2
    hxy = ndi.gaussian_filter(z, s, order=(1, 1)) / g ** 2
    det = hxx * hyy - hxy ** 2
    del hxx, hyy, hxy
    sad = (det < -1e-6) & (tpi500 > 3) & (slope < 10) & (rsp > 0.4)
    rr, cc = peaks(-det, sad, C(120), 400)
    add('saddle', rr, cc, np.clip(np.sqrt(-det[rr, cc]) / 4e-3, 0, 1),
        lambda r, c: {'elev_ft': round(float(z[r, c]) * 3.28084)})

    conf = ((n_in >= 2) & (area < 5e6)).astype(np.float32)
    hubs = box(conf, C(150)) * (2 * C(150) + 1) ** 2
    rr, cc = peaks(hubs, (hubs >= 2) & (conf > 0), C(200), 300)
    add('hub', rr, cc, np.clip(hubs[rr, cc] / 5, 0, 1), lambda r, c: {'draws': int(round(hubs[r, c])) + 1})

    rr, cc = peaks(tpi150, point & ~ridge & (tpi150 > 6), C(150), 400)
    add('point', rr, cc, np.clip(tpi150[rr, cc] / 20, 0, 1))

    blab, nb = ndi.label(bench)
    if nb:
        coms = ndi.center_of_mass(bench, blab, np.arange(1, nb + 1))
        sizes = ndi.sum(bench, blab, np.arange(1, nb + 1)) * g * g
        rr = np.array([int(r) for r, _ in coms]); cc = np.array([int(c) for _, c in coms])
        add('bench', rr, cc, np.clip(sizes / 4000, 0, 1), lambda r, c: {'slope_around': round(float(slope60[r, c]))})

    relief = ndi.maximum_filter(zs, 2 * C(20) + 1) - ndi.minimum_filter(zs, 2 * C(20) + 1)
    cover60 = box(cover_mask, C(60))
    cross = (area >= 1e5) & (area < 5e6) & (relief < 2.0) & (cover60 > 0.5) & ~near_water  # a stream, not a lake shore
    rr, cc = peaks(-relief, cross, C(150), 300)
    add('crossing', rr, cc, np.clip(1 - relief[rr, cc] / 2, 0, 1))

    ag = isin(cdl, sum(CROPS.values(), []) + [176])
    forest60 = box(forest | isin(cdl, SHRUB), C(60))
    corner = ag & ndi.binary_dilation(forest, iterations=2) & (forest60 > 0.58)
    rr, cc = peaks(forest60, corner, C(120), 300)
    add('inside_corner', rr, cc, np.clip((forest60[rr, cc] - 0.5) * 4, 0, 1))

    width = 2 * ndi.distance_transform_edt(cover_mask) * g
    funnel = corridor * (cover_mask * np.clip(80 / (width + 10), 0, 3) + 1.5 * (bench | sad))
    rr, cc = peaks(funnel, (corridor > 0.35) & (funnel > 0.6), C(150), 300)
    add('pinch', rr, cc, np.clip(funnel[rr, cc] / 3, 0, 1),
        lambda r, c: {'cover_width_yd': round(float(width[r, c]) / 0.9144) if cover_mask[r, c] else None})

    for kind, r, c, p, winds in beds:
        feats.append((kind, r, c, p, {'wind': [round(x, 3) for x in winds]} if winds else {}))

    # Planner inputs (web/src/planner.ts): R = cover code, G = disturbance, B = flag bits.
    code = np.zeros(z.shape, np.uint8)
    code[isin(cdl, [141, 143])] = 1                                   # open-ish hardwood timber
    code[isin(cdl, [142, 152, 190, 195, 61])] = 2                     # thick cover (cedar, brush, wetland, idle/CRP)
    code[isin(cdl, sum(CROPS.values(), []))] = 3                      # crop field
    code[isin(cdl, [176, 37, 36, 58, 59])] = 4                        # pasture / hay
    code[isin(cdl, [121] + DEVELOPED)] = 5                            # developed
    code[water] = 6
    flags = ((roads > 0) * 1 | (draw | creek) * 2 | bench * 4 | food_mask * 8 | buildings * 16).astype(np.uint8)

    out.update(
        plan=(code, np.round(disturb * 255).astype(np.uint8), flags),
        bed_buck=buck, bed_doe=doe, corridor=corridor, features=feats, trails=trails,
        landform=dict(bench=bench, ridge=ridge, point=point & ~ridge, draw=draw, creek=creek, cold_pool=cold_pool),
    )
    return out
