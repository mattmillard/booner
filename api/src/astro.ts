// Sun/moon facts for a moment and place (server copy of the few calls the journal needs).
import { Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchHourAngle, SearchRiseSet } from 'astronomy-engine';

const MIN = 60_000;
const PHASES = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent'];

function altitude(body: Body, t: Date, obs: Observer) {
  const eq = Equator(body, t, obs, true, true);
  const h = Horizon(t, obs, eq.ra, eq.dec, 'normal');
  return { alt: h.altitude, az: h.azimuth };
}

export function astroAt(t: Date, lat: number, lng: number) {
  const obs = new Observer(lat, lng, 0);
  const dayStart = new Date(t.getTime() - 12 * 60 * MIN);
  const rise = SearchRiseSet(Body.Sun, obs, +1, dayStart, 1)?.date ?? null;
  const set = SearchRiseSet(Body.Sun, obs, -1, dayStart, 1)?.date ?? null;
  const sun = altitude(Body.Sun, t, obs);
  const moon = altitude(Body.Moon, t, obs);
  // Nearest moon overhead/underfoot (solunar "major") within ±12 h.
  let transitMin = Infinity, transitKind = '';
  for (const [ha, kind] of [[0, 'overhead'], [12, 'underfoot']] as const) {
    const ev = SearchHourAngle(Body.Moon, obs, ha, new Date(t.getTime() - 13 * 60 * MIN)).time.date;
    const d = Math.round((ev.getTime() - t.getTime()) / MIN);
    if (Math.abs(d) < Math.abs(transitMin)) { transitMin = d; transitKind = kind; }
  }
  const angle = MoonPhase(t);
  return {
    sunrise: rise?.toISOString() ?? null,
    sunset: set?.toISOString() ?? null,
    minFromSunrise: rise ? Math.round((t.getTime() - rise.getTime()) / MIN) : null,
    minToSunset: set ? Math.round((set.getTime() - t.getTime()) / MIN) : null,
    sunAlt: +sun.alt.toFixed(1),
    sunAz: Math.round(sun.az),
    moonPhase: PHASES[Math.round(angle / 45) % 8],
    moonIllum: +Illumination(Body.Moon, t).phase_fraction.toFixed(2),
    moonAlt: +moon.alt.toFixed(1),
    moonTransit: { kind: transitKind, minutes: transitMin },
    solunarMajor: Math.abs(transitMin) <= 60,
  };
}
