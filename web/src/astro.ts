// Sun, legal light, moon and solunar times — computed offline with astronomy-engine.
import { Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchAltitude, SearchHourAngle, SearchRiseSet } from 'astronomy-engine';

const MIN = 60_000;

export function startOfDay(t: Date) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sunPosition(t: Date, lat: number, lng: number) {
  const obs = new Observer(lat, lng, 0);
  const eq = Equator(Body.Sun, t, obs, true, true);
  const hor = Horizon(t, obs, eq.ra, eq.dec, 'normal');
  return { azimuth: hor.azimuth, altitude: hor.altitude };
}

export type SunDay = { sunrise: Date; sunset: Date; legalStart: Date; legalEnd: Date; civilDawn: Date | null; civilDusk: Date | null };

// Missouri archery hours: 30 min before sunrise to 30 min after sunset.
export function sunDay(day: Date, lat: number, lng: number): SunDay | null {
  const obs = new Observer(lat, lng, 0);
  const d0 = startOfDay(day);
  const rise = SearchRiseSet(Body.Sun, obs, +1, d0, 1);
  const set = SearchRiseSet(Body.Sun, obs, -1, d0, 1);
  if (!rise || !set) return null;
  return {
    sunrise: rise.date,
    sunset: set.date,
    legalStart: new Date(rise.date.getTime() - 30 * MIN),
    legalEnd: new Date(set.date.getTime() + 30 * MIN),
    civilDawn: SearchAltitude(Body.Sun, obs, +1, d0, 1, -6)?.date ?? null,
    civilDusk: SearchAltitude(Body.Sun, obs, -1, d0, 1, -6)?.date ?? null,
  };
}

const PHASE_NAMES = ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'];

export type Solunar = { kind: 'major' | 'minor'; at: Date; start: Date; end: Date; label: string };

export function moonDay(day: Date, lat: number, lng: number) {
  const obs = new Observer(lat, lng, 0);
  const d0 = startOfDay(day);
  const d1 = new Date(d0.getTime() + 86_400_000);
  const angle = MoonPhase(day);
  const rise = SearchRiseSet(Body.Moon, obs, +1, d0, 1)?.date ?? null;
  const set = SearchRiseSet(Body.Moon, obs, -1, d0, 1)?.date ?? null;
  const within = (t: Date | null) => t && t >= d0 && t < d1;
  const periods: Solunar[] = [];
  for (const [ha, label] of [[0, 'Moon overhead'], [12, 'Moon underfoot']] as const) {
    const t = SearchHourAngle(Body.Moon, obs, ha, d0).time.date;
    if (within(t)) periods.push({ kind: 'major', at: t, start: new Date(t.getTime() - 60 * MIN), end: new Date(t.getTime() + 60 * MIN), label });
  }
  for (const [t, label] of [[rise, 'Moonrise'], [set, 'Moonset']] as const)
    if (within(t)) periods.push({ kind: 'minor', at: t!, start: new Date(t!.getTime() - 30 * MIN), end: new Date(t!.getTime() + 30 * MIN), label });
  periods.sort((a, b) => a.at.getTime() - b.at.getTime());
  return {
    name: PHASE_NAMES[Math.round(angle / 45) % 8],
    illumination: Illumination(Body.Moon, day).phase_fraction,
    rise: within(rise) ? rise : null,
    set: within(set) ? set : null,
    periods,
  };
}
