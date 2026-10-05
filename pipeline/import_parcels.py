"""Load a county parcel file (from the assessor, Regrid, ReportAll, ...) into the `parcels` table.

    pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper path/to/parcels.zip
    pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper parcels.gdb --layer Parcels --field owner=OWN_NAME
    pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper parcels.shp --dry-run      # show the field mapping only

Reads shapefile / zipped shapefile / file geodatabase / GeoPackage / GeoJSON, reprojects to WGS84, maps the usual
owner, mailing-address, acreage and legal fields (Regrid and common CAMA names), and replaces that county's parcels.
The rest of the app picks them up immediately (vector tiles and the tap card read PostGIS live).
"""
import argparse
import json
import sys
import tempfile
import zipfile
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sources as S  # noqa: E402  (sets PROJ env first)
import geopandas as gpd  # noqa: E402
import psycopg  # noqa: E402
import pyogrio  # noqa: E402
from psycopg.types.json import Jsonb  # noqa: E402

# Candidate source fields per target, in priority order (matched case-insensitively). Regrid names first.
FIELDS = {
    'parcel_id': ['parcelnumb', 'parcel_id', 'parcelid', 'parcel_no', 'parcelno', 'parcel', 'pin', 'parcel_num', 'account', 'gis_num', 'mapno'],
    'owner': ['owner', 'ownername', 'owner_name', 'owner1', 'own_name', 'ownname', 'name1', 'taxpayer', 'deeded_owner'],
    'owner2': ['owner2', 'owner_2', 'name2'],
    'mail_addr': ['mailadd', 'mail_address', 'mailto_add', 'mail_addr', 'mailaddr', 'mailing_address', 'addr1', 'mail_add1'],
    'mail_addr2': ['mail_addno', 'mailto_add2', 'mail_addr2', 'addr2', 'mail_add2'],
    'mail_city': ['mail_city', 'mailto_city', 'mailcity', 'city_mail'],
    'mail_state': ['mail_state2', 'mail_state', 'mailto_state', 'mailstate'],
    'mail_zip': ['mail_zip', 'mailto_zip', 'mailzip', 'zip_mail'],
    'acres': ['deeded_acres', 'deedacres', 'acres', 'deeded_ac', 'total_acres', 'calc_acres', 'll_gisacre', 'gisacre', 'gis_acres'],
    'legal': ['legaldesc', 'legal', 'legal_desc', 'legal_description'],
    'site_addr': ['address', 'situs', 'site_addr', 'siteaddress', 'prop_addr', 'location'],
    'sec': ['section', 'sec', 'pls_sect'], 'twp': ['township', 'twp', 'pls_twp'], 'rng': ['range', 'rng', 'pls_rng'],
}


def open_source(path: Path):
    if path.suffix.lower() == '.zip':
        tmp = Path(tempfile.mkdtemp(prefix='parcels_'))
        zipfile.ZipFile(path).extractall(tmp)
        found = sorted([*tmp.rglob('*.gdb'), *tmp.rglob('*.gpkg'), *tmp.rglob('*.shp'), *tmp.rglob('*.geojson')])
        if not found:
            raise SystemExit('zip has no .shp / .gdb / .gpkg / .geojson inside')
        return found[0]
    return path


def pick_layer(path: Path, layer):
    if layer:
        return layer
    polys = [(name, pyogrio.read_info(path, layer=name)['features'])
             for name, gtype in pyogrio.list_layers(path) if gtype and 'Polygon' in str(gtype)]
    if not polys:
        raise SystemExit('no polygon layer found; pass --layer')
    return max(polys, key=lambda x: x[1])[0]  # the biggest polygon layer is the parcel fabric


def mapping(columns, overrides):
    lower = {c.lower(): c for c in columns}
    out = {}
    for target, cands in FIELDS.items():
        if target in overrides:
            out[target] = overrides[target]
            continue
        out[target] = next((lower[c] for c in cands if c in lower), None)
    return out


def clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ('nan', 'none', 'null') else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('county')
    ap.add_argument('file', type=Path)
    ap.add_argument('--layer')
    ap.add_argument('--field', action='append', default=[], help='target=SOURCE_FIELD override, e.g. owner=OWN_NAME')
    ap.add_argument('--source-date', default=date.today().isoformat(), help='date the county produced the data')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    src = open_source(args.file)
    layer = pick_layer(src, args.layer)
    gdf = gpd.read_file(src, layer=layer, engine='pyogrio')
    if gdf.crs is None:
        raise SystemExit('file has no coordinate system (.prj missing?)')
    m = mapping(gdf.columns, dict(f.split('=', 1) for f in args.field))
    print(f'{src.name} / layer {layer}: {len(gdf)} features, CRS {gdf.crs.name}')
    for target, col in m.items():
        sample = next((clean(v) for v in gdf[col] if clean(v)), None) if col else None
        print(f'  {target:11s} <- {col or "(none)"}' + (f'   e.g. {sample!r}' if sample else ''))
    if not m['owner'] or not m['parcel_id']:
        print('WARNING: owner or parcel id not found; pass --field owner=... / parcel_id=...')
    if args.dry_run:
        return

    gdf = gdf[gdf.geometry.notna()].to_crs(4326)
    rows = []
    for _, r in gdf.iterrows():
        g = lambda k: clean(r[m[k]]) if m[k] else None  # noqa: E731
        owner = ' & '.join(x for x in (g('owner'), g('owner2')) if x) or None
        city = ' '.join(x for x in (g('mail_city'), g('mail_state'), g('mail_zip')) if x)
        mail = ', '.join(x for x in (g('mail_addr'), g('mail_addr2'), city) if x) or None
        acres = g('acres')
        try:
            acres = float(acres) if acres else None
        except ValueError:
            acres = None
        plss = f'S{g("sec")} T{g("twp")} R{g("rng")}' if g('sec') and g('twp') and g('rng') else None
        attrs = {k: clean(v) for k, v in r.drop(labels='geometry').items()}
        if g('site_addr'):
            attrs['ADDRESS'] = g('site_addr')  # the tap card reads attrs->>'ADDRESS'
        rows.append((args.county, g('parcel_id'), owner, mail, acres, plss, g('legal'), Jsonb(attrs), args.source_date,
                     json.dumps(r.geometry.__geo_interface__)))

    with psycopg.connect(S.database_url()) as conn, conn.transaction():
        conn.execute('DELETE FROM parcels WHERE county = %s', (args.county,))
        with conn.cursor() as cur:
            cur.executemany(
                """INSERT INTO parcels (county, parcel_id, owner, mail_address, acres, plss, legal, attrs, source_date, geom)
                   SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, g FROM (
                     SELECT ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)), 3)) AS g) s
                   WHERE NOT ST_IsEmpty(g)""", rows)
        n = conn.execute('SELECT count(*) FROM parcels WHERE county = %s', (args.county,)).fetchone()[0]
    print(f'{args.county}: {n} parcels loaded')


if __name__ == '__main__':
    main()
