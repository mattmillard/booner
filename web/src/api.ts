import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';

export type FeatureProps = {
  id: string;
  num: number; // permanent per-user pin number (#133)
  kind: 'pin' | 'line' | 'area' | 'track';
  icon: string | null;
  name: string;
  notes: string;
  color: string | null;
  folder_id: string | null;
  props: Record<string, any>;
  created_at: string;
  updated_at: string;
};
export type UserFeature = Feature<Geometry, FeatureProps>;
export type Folder = { id: string; name: string; color: string | null };
export type CrosshairPlanArea = {
  name: string;
  county: string | null;
  owner: string | null;
  parcel_id: string | null;
  parcel_count: number;
  conservation_names: string[];
  geometry: Polygon | MultiPolygon;
  group_id?: string | null;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText);
  return data as T;
}

export const api = {
  me: () => call<{ email: string }>('GET', '/auth/me'),
  login: (username: string, password: string) => call<{ email: string }>('POST', '/auth/login', { username, password }),
  register: (username: string, email: string, password: string) => call<{ email: string }>('POST', '/auth/register', { username, email, password }),
  logout: () => call('POST', '/auth/logout'),

  features: () => call<FeatureCollection<Geometry, FeatureProps>>('GET', '/features'),
  createFeature: (geometry: Geometry, properties: Partial<FeatureProps>) =>
    call<UserFeature>('POST', '/features', { type: 'Feature', geometry, properties }),
  updateFeature: (id: string, patch: { geometry?: Geometry; properties?: Partial<FeatureProps> }) =>
    call<UserFeature>('PATCH', `/features/${id}`, patch),
  deleteFeature: (id: string) => call('DELETE', `/features/${id}`),

  folders: () => call<Folder[]>('GET', '/folders'),
  createFolder: (name: string) => call<Folder>('POST', '/folders', { name }),

  at: (lng: number, lat: number) => call<LandInfo>('GET', `/land/at?lng=${lng}&lat=${lat}`),
  planAreaAt: (lng: number, lat: number) =>
    call<CrosshairPlanArea>('GET', `/groups/plan-area?lng=${lng}&lat=${lat}`),
};

export type LandInfo = {
  parcel: null | {
    county: string;
    parcel_id: string | null;
    owner: string | null;
    mail_address: string | null;
    acres: number | null;
    gis_acres: number | null;
    plss: string | null;
    legal: string | null;
    site_address: string | null;
    class: string | null;
    sale_date_ms: number | null;
    sale_amount: number | null;
    source_date: string;
    geometry: Geometry;
  };
  publicLands: {
    source: string; name: string; manager: string; acres: number | null; regs_url: string | null; info_url: string | null; source_date: string; attrs: Record<string, any>;
    zones: { kind: 'hunting' | 'no_hunting' | 'restricted'; label: string; rules: string; source: string }[];
  }[];
  county: string | null;
  section: string | null;
  food: { crop: string; acres: number; year: number } | null;
  terrain: { kind: string; score: number; props: Record<string, any>; dist_m: number }[];
};
