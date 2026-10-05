// Pulls public GIS layers into PostGIS. Each source replaces its own rows.
//   npm run ingest               -> all sources
//   npm run ingest -- mdc plss   -> only those
import { pool } from '../src/db.ts';

// Callaway, Cooper, Boone, Cole (west, south, east, north)
const BBOX = [-93.1, 38.3, -91.4, 39.3];
const inBbox = {
  geometry: BBOX.join(','),
  geometryType: 'esriGeometryEnvelope',
  inSR: '4326',
  spatialRel: 'esriSpatialRelIntersects',
};
const today = new Date().toISOString().slice(0, 10);

type Row = Record<string, unknown> & { geojson: unknown };
type Source = {
  table: 'parcels' | 'public_lands' | 'boundaries';
  scope: [column: string, value: string];
  url: string;
  params?: Record<string, string>;
  token?: () => Promise<string>; // services that need the (public) viewer token
  clip?: boolean;
  row: (p: any) => Record<string, unknown>;
};

const MSDIS = 'https://services2.arcgis.com/kNS2ppBA4rwAQQZy/ArcGIS/rest/services';
const joinParts = (...parts: unknown[]) => parts.filter((x) => x && String(x).trim()).join(', ');

const SOURCES: Record<string, Source> = {
  callaway_parcels: {
    table: 'parcels',
    scope: ['county', 'Callaway'],
    url: 'https://services3.arcgis.com/k5ZxPyOENfo6kVaE/arcgis/rest/services/Assessor_Data/FeatureServer/11',
    row: (p) => ({
      county: 'Callaway',
      parcel_id: p.parcelid ?? p.PIN,
      owner: p.OWNERNAME,
      mail_address: joinParts(
        p.ATTENTION, p.MAILTO_ADD, p.MAILTO_ADD2,
        `${p.MAILTO_CITY ?? ''} ${p.MAILTO_STATE ?? ''} ${p.MAILTO_ZIP ?? ''}`,
      ),
      acres: p.ACRES, // deeded acres (GIS_ACRES is actually square feet)
      plss: p.PLS_SECT ? `S${p.PLS_SECT} T${p.PLS_TWP} R${p.PLS_RNG}` : null,
      legal: p.LEGAL,
      attrs: p,
    }),
  },
  mdc: {
    table: 'public_lands',
    scope: ['source', 'mdc'],
    url: 'https://gisblue.mdc.mo.gov/arcgis/rest/services/Boundaries/MDC_Administrative_Boundaries/MapServer/0',
    row: (p) => ({
      source: 'mdc',
      name: p.Area_Name,
      manager: 'Missouri Department of Conservation',
      acres: p.Acreage,
      regs_url: p.Reg_Link,
      info_url: p.Sum_Link,
      attrs: p,
    }),
  },
  usfs: {
    table: 'public_lands',
    scope: ['source', 'usfs'],
    url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_BasicOwnership_02/MapServer/0',
    params: { ...inBbox, where: "ownerclassification = 'USDA FOREST SERVICE'" },
    clip: true,
    row: (p) => ({ source: 'usfs', name: p.forestname, manager: 'USDA Forest Service', attrs: p }),
  },
  usfws: {
    table: 'public_lands',
    scope: ['source', 'usfws'],
    url: 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/FWS_National_Hunt_Units_2025-2026/FeatureServer/0',
    params: inBbox,
    clip: true,
    row: (p) => ({
      source: 'usfws',
      name: `${p.Organization_Name} (${p.Hunt_Unit_Name})`,
      manager: 'US Fish & Wildlife Service',
      acres: p.Acreage,
      info_url: p.Hunting_Website,
      attrs: p,
    }),
  },
  // Cooper: Integrity GIS behind the county's public Geocortex viewer (docs/research/08-county-parcel-sources.md).
  cooper_parcels: {
    table: 'parcels',
    scope: ['county', 'Cooper'],
    url: 'https://services2.integritygis.com/arcgis/rest/Services/MO/Cooper_Assessor_Data/MapServer/11',
    token: () => viewerToken('https://coopergis.integritygis.com/Geocortex/Essentials/REST/sites/Cooper_County_MO/map?f=json', 'Cooper_Assessor_Data'),
    row: (p) => ({
      county: 'Cooper',
      parcel_id: p.parcel_no || p.PID,
      owner: joinParts(p.name, p.name3 && !String(p.name3).startsWith('%') ? p.name3 : null) || null,
      mail_address: joinParts(String(p.name2 ?? '').startsWith('%') ? p.name2 : null, p.address1, p.address2,
        `${p.city ?? ''} ${p.state ?? ''} ${p.zip ?? ''}`) || null,
      acres: p.acres || p.GIS_ACRES,
      plss: p.section ? `S${p.section} T${p.twn} R${p.rng}` : null,
      legal: p.leg_des,
      attrs: { ...p, ADDRESS: joinParts(`${p.sit_stno ?? ''} ${p.sit_stnm ?? ''}`.trim(), p.sit_city) || null, SALE_DATE: p.date_acquire },
    }),
  },
  // Cole: Mid-Missouri GIS public parcel service (no token).
  cole_parcels: {
    table: 'parcels',
    scope: ['county', 'Cole'],
    url: 'https://www.midmogis.org/server/rest/services/ColeCO/Public_Parcel/MapServer/0',
    row: (p) => ({
      county: 'Cole',
      parcel_id: p.PID_LABEL || p.ParcelNumber || p.PID,
      owner: [p.Owner1, p.Owner2].filter((x) => x && String(x).trim()).join(' & ') || null,
      mail_address: joinParts(p.OwnerAddress1, p.OwnerAddress2, `${p.OwnerMailCity ?? ''} ${p.OwnerMailState ?? ''} ${p.OwnerMailZip ?? ''}`) || null,
      acres: p.ACRES,
      plss: p.Section ? `S${p.Section} T${p.Township} R${p.Range}` : null,
      legal: p.PropertyDesc,
      attrs: { ...p, ADDRESS: p.Location, SALE_DATE: p.Date1 },
    }),
  },
  // Boone: parcel shapes are public; owners come per parcel from the county report API (api/src/land.ts, on tap).
  boone_parcels: {
    table: 'parcels',
    scope: ['county', 'Boone'],
    url: 'https://gis.boonemo.gov/arcgis/rest/services/BC_Basemap_MSD_V2/MapServer/7',
    row: (p) => ({ county: 'Boone', parcel_id: p.ASSESSOR, attrs: p }),
  },
  counties: {
    table: 'boundaries',
    scope: ['kind', 'county'],
    url: `${MSDIS}/MO_County_Boundaries/FeatureServer/0`,
    row: (p) => ({ kind: 'county', name: p.COUNTYNAME }),
  },
  plss: {
    table: 'boundaries',
    scope: ['kind', 'plss'],
    url: `${MSDIS}/MO_Public_Land_Survey_System/FeatureServer/0`,
    params: inBbox,
    row: (p) => ({
      kind: 'plss',
      name: `Sec ${p.SEC_NUM} T${p.TWP_NUM}${p.TWP_DIR} R${p.RNG_NUM}${p.RNG_DIR}`,
    }),
  },
};

// Geocortex viewers hand every visitor a token for their map services; read it the same way the viewer does.
async function viewerToken(siteUrl: string, serviceMatch: string) {
  const site = await getJson(siteUrl);
  const svc = site.mapServices?.find((m: any) => String(m.connectionString ?? '').includes(serviceMatch));
  const token = /token=([^;]+)/.exec(svc?.connectionString ?? '')?.[1];
  if (!token) throw new Error(`no viewer token found for ${serviceMatch}`);
  return token;
}

async function getJson(url: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.error) throw new Error(JSON.stringify(body.error));
      return body;
    } catch (e) {
      if (attempt === 3) throw e;
      console.warn(`  retry ${attempt}: ${(e as Error).message}`);
    }
  }
}

// ArcGIS REST query, paged with resultOffset until the server stops reporting more.
async function* arcgisFeatures(url: string, params: Record<string, string> = {}) {
  for (let offset = 0; ; ) {
    const q = new URLSearchParams({
      where: '1=1', outFields: '*', outSR: '4326', f: 'geojson',
      ...params, resultOffset: String(offset),
    });
    const fc = await getJson(`${url}/query?${q}`);
    yield fc.features as any[];
    const more = fc.exceededTransferLimit ?? fc.properties?.exceededTransferLimit;
    if (!fc.features.length || !more) return;
    offset += fc.features.length;
  }
}

async function ingest(name: string, src: Source) {
  const [scopeCol, scopeVal] = src.scope;
  const clip = src.clip ? `ST_Intersection(g, ST_MakeEnvelope(${BBOX.join(',')}, 4326))` : 'g';
  const client = await pool.connect();
  let total = 0;
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${src.table} WHERE ${scopeCol} = $1`, [scopeVal]);
    const token = src.token ? await src.token() : null;
    for await (const page of arcgisFeatures(src.url, { ...src.params, ...(token ? { token } : {}) })) {
      const rows: Row[] = page
        .filter((f) => f.geometry)
        .map((f) => ({ ...src.row(f.properties), source_date: today, geojson: f.geometry }));
      if (!rows.length) continue;
      const cols = Object.keys(rows[0]).filter((k) => k !== 'geojson');
      // Rows typed by the table's own record type; geometry repaired and forced to MultiPolygon.
      await client.query(
        `INSERT INTO ${src.table} (${cols.join(', ')}, geom)
         SELECT ${cols.map((c) => `(r).${c}`).join(', ')}, geom FROM (
           SELECT jsonb_populate_record(null::${src.table}, e) AS r,
                  ST_Multi(ST_CollectionExtract(ST_MakeValid(${clip}), 3)) AS geom
           FROM jsonb_array_elements($1::jsonb) e,
                LATERAL (SELECT ST_SetSRID(ST_GeomFromGeoJSON(e->'geojson'), 4326) AS g) gg
         ) s WHERE NOT ST_IsEmpty(geom)`,
        [JSON.stringify(rows)],
      );
      total += rows.length;
      console.log(`  ${name}: ${total}`);
    }
    await client.query('COMMIT');
    console.log(`${name}: done (${total} features)`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// MDC Telecheck deer harvest by county (undocumented endpoint behind mdc.mo.gov's harvest widget).
async function ingestHarvest() {
  const sum = (r: any, pred: (k: string) => boolean) =>
    Object.entries(r).reduce((s, [k, v]) => (typeof v === 'number' && k !== 'Year' && pred(k) ? s + v : s), 0);
  let n = 0;
  for (let year = 2006; year < new Date().getFullYear(); year++) {
    const res = await fetch('https://extra.mdc.mo.gov/widgets/harvest_table/dataJSONservice.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `paravalue=Deer?year=${year}`,
    });
    const rows: any[] = await res.json().catch(() => []);
    for (const r of rows) {
      await pool.query(
        `INSERT INTO harvest (year, county, total, archery, firearms, antlered, data) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (county, year) DO UPDATE SET total = $3, archery = $4, firearms = $5, antlered = $6, data = $7`,
        [year, r.County, sum(r, () => true), sum(r, (k) => k.endsWith('Archery')), sum(r, (k) => k.endsWith('November')),
         sum(r, (k) => k.startsWith('AntleredBuck')), r],
      );
    }
    n += rows.length;
    console.log(`  harvest ${year}: ${rows.length} counties`);
  }
  console.log(`harvest: done (${n} rows)`);
}

const wanted = process.argv.slice(2);
for (const name of wanted.length ? wanted : [...Object.keys(SOURCES), 'harvest']) {
  if (name === 'harvest') {
    await ingestHarvest();
    continue;
  }
  const src = SOURCES[name];
  if (!src) throw new Error(`unknown source ${name}; have: ${Object.keys(SOURCES).join(', ')}, harvest`);
  await ingest(name, src);
}
await pool.end();
