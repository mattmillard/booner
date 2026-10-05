import type { Feature, Point } from 'geojson';
import type { UserFeature } from './api';
import { getConditions, hourAt, type Conditions } from './conditions';
import { periodWindows, rate, type Period, type Rating } from './rating';
import { blob, cone, effectiveWind, grade, plume, type Effective, type Grade, type Plume } from './scent';
import { terrainCached, type Terrain } from './terrain';

const HOUR = 3_600_000;

export const isStand = (f: UserFeature) => f.properties.kind === 'pin' && (f.properties.icon === 'stand' || f.properties.icon === 'blind');
const coords = (f: UserFeature) => (f.geometry as Point).coordinates as [number, number];
const elevated = (f: UserFeature) => f.properties.icon === 'stand' && (f.properties.props.heightFt ?? 18) >= 8;

export type StandAt = { c: Conditions; ter: Terrain; eff: Effective; plume: Plume; grade: Grade; hourT: number };

export async function analyzeStand(f: UserFeature, time: number): Promise<StandAt> {
  const [lng, lat] = coords(f);
  const [c, ter] = await Promise.all([getConditions(lat, lng), terrainCached(lng, lat)]);
  return atTime(f, c, ter, time);
}

function atTime(f: UserFeature, c: Conditions, ter: Terrain, time: number): StandAt {
  const [lng, lat] = coords(f);
  const h = hourAt(c, time);
  const eff = effectiveWind(h, ter, new Date(time), lat, lng, elevated(f));
  return { c, ter, eff, plume: plume(eff, h, Math.max(0, (time - Date.now()) / HOUR)), grade: grade(f.properties.props.goodWinds, eff), hourT: h.t * 1000 };
}

// Scent plume as map polygons: faint forecast-uncertainty cone plus three detection-probability bands.
export function plumeFeatures(f: UserFeature, a: StandAt): Feature[] {
  const center = coords(f);
  const { eff, plume: p } = a;
  const props = (band: number) => ({ band, stand: f.id, level: a.grade.level });
  if (p.calm) return [{ type: 'Feature', geometry: blob(center, eff.thermal.towardAz, 55), properties: props(1) }];
  return [
    { type: 'Feature', geometry: cone(center, eff.towardAz, Math.min(85, p.halfAngle + p.spread), p.lengthsYd[1]), properties: props(-1) },
    ...[2, 1, 0].map((band): Feature => ({ type: 'Feature', geometry: cone(center, eff.towardAz, p.halfAngle, p.lengthsYd[band]), properties: props(band) })),
  ];
}

export type PeriodFit = { rating: Rating | null; level: Grade['level']; fit: number; text: string };

// Grade every hour of a hunt period against the stand's good winds, then fold into the period rating.
export async function periodFits(f: UserFeature, days: Date[]): Promise<PeriodFit[][]> {
  const [lng, lat] = coords(f);
  const [c, ter] = await Promise.all([getConditions(lat, lng), terrainCached(lng, lat)]);
  return days.map((day) =>
    (['am', 'midday', 'pm'] as Period[]).map((period) => {
      const win = periodWindows(day, lat, lng);
      if (!win) return { rating: null, level: 'unset', fit: 1, text: '' };
      const [a, b] = win[period];
      const grades: Grade[] = [];
      for (let t = Math.ceil(a.getTime() / HOUR) * HOUR; t <= b.getTime(); t += HOUR) grades.push(atTime(f, c, ter, t).grade);
      if (!grades.length) grades.push(atTime(f, c, ter, a.getTime()).grade);
      const fit = grades.reduce((s, g) => s + g.fit, 0) / grades.length;
      const unset = grades[0].level === 'unset';
      const level: Grade['level'] = unset ? 'unset' : fit >= 0.95 ? 'good' : fit >= 0.75 ? 'marginal' : 'bad';
      const good = grades.filter((g) => g.level === 'good').length;
      const text = unset ? grades[0].text : `${good}/${grades.length} hours on a good wind`;
      return { rating: rate(c, day, period, lat, lng, fit, `Stand wind fit: ${text}`), level, fit, text };
    }),
  );
}
