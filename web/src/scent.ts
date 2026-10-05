// Effective wind, thermals and scent plume at a stand (docs/research/05 §2.2, §3.2).
import type { Polygon, Position } from 'geojson';
import type { Hour } from './conditions';
import type { Terrain } from './terrain';
import { sunDay, sunPosition } from './astro';

const MIN = 60_000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (a: number) => ((a % 360) + 360) % 360;
export const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// How directly the sun hits a slope (cosine of incidence); ≤0 means the slope is in shadow.
function insolation(t: Date, lat: number, lng: number, slope: number, aspect: number) {
  const sun = sunPosition(t, lat, lng);
  if (sun.altitude <= 0) return -1;
  const alt = rad(sun.altitude), s = rad(slope);
  return Math.sin(alt) * Math.cos(s) + Math.cos(alt) * Math.sin(s) * Math.cos(rad(sun.azimuth - aspect));
}

export type Thermal = { sign: number; speed: number; towardAz: number; label: string };

// sign: +1 upslope (warming), −1 downslope/drainage (cooling), fractional during transitions.
export function thermal(ter: Terrain, t: Date, lat: number, lng: number, cloud: number, groundWind: number): Thermal {
  const day = sunDay(t, lat, lng);
  const litThreshold = 0.05;
  const scan = (from: number, to: number, step: number) => {
    for (let x = from; step > 0 ? x <= to : x >= to; x += step)
      if (insolation(new Date(x), lat, lng, ter.slope, ter.aspect) > litThreshold) return x;
    return null;
  };
  let sign = -1;
  let label = 'Night drainage: cool air sinks downhill';
  if (day) {
    const rise = day.sunrise.getTime(), set = day.sunset.getTime();
    const firstLit = scan(rise, rise + 6 * 60 * MIN, 10 * MIN) ?? rise + 3 * 60 * MIN;
    const lastLit = scan(set, set - 6 * 60 * MIN, -10 * MIN) ?? set - 3 * 60 * MIN;
    // Hollows and cold pools flip much later than sunlit open slopes (30 min open → up to 3 h in deep hollows).
    const lag = (30 + 150 * clamp(ter.valleyDepth / 30, 0, 1)) * MIN;
    const flipUp = firstLit + lag;
    const flipDown = Math.min(lastLit, set - 60 * MIN);
    const now = t.getTime();
    const RAMP = 45 * MIN;
    if (now < flipUp - RAMP / 2 || now > flipDown + RAMP / 2) {
      sign = -1;
      label = now > set || now < rise ? 'Night drainage: cool air sinks downhill' : now < flipUp ? 'Morning: still draining downhill (not yet warmed)' : 'Evening: thermals falling downhill';
    } else if (now < flipUp + RAMP / 2) {
      sign = (now - flipUp) / (RAMP / 2);
      label = 'Morning transition: swirling as thermals flip uphill';
    } else if (now > flipDown - RAMP / 2) {
      sign = -(now - flipDown) / (RAMP / 2);
      label = 'Evening transition: swirling as thermals start to fall';
    } else {
      sign = 1;
      label = 'Daytime: warming air rises uphill';
    }
  }
  // Steeper slopes drive stronger flow; bottoms collect cold air draining off every slope around them.
  const pooled = sign < 0 && (ter.landform === 'cold pool' || ter.landform === 'bottom') ? 0.6 : 0;
  const base = Math.max(pooled, clamp(ter.drainSlope / 15, 0.2, 1));
  const clouds = 1 - 0.8 * (cloud / 100);        // overcast weakens both heating and cooling
  const mixing = clamp(1 - (groundWind - 3) / 9, 0, 1); // wind mixes thermals out: full below 3 mph, none by 12
  const speed = 2 * base * clouds * mixing * Math.abs(sign); // ~2 mph max on Missouri relief
  return { sign, speed, towardAz: sign >= 0 ? norm(ter.drainAz + 180) : ter.drainAz, label };
}

export type Effective = {
  speed: number;     // mph at stand height
  towardAz: number;  // where scent goes
  fromAz: number;    // the "wind from" a hunter would call it
  thermal: Thermal;
  synoptic: number;  // forecast wind reduced to stand height under canopy
  channeled: boolean;
  leeEddy: boolean;
  driver: 'wind' | 'thermal' | 'mixed';
};

export function effectiveWind(h: Hour, ter: Terrain, t: Date, lat: number, lng: number, elevated: boolean): Effective {
  // 10 m forecast → ~20 ft (×0.87), then canopy wind-adjustment factor: partial canopy for an elevated stand, timber at ground.
  const synoptic = h.wind * 0.87 * (elevated ? 0.5 : 0.3);
  const th = thermal(ter, t, lat, lng, h.cloud, synoptic);
  const aloft = elevated && synoptic > 5 ? 0.6 : 1; // thermals hug the ground; less effect up a tree in real wind
  const toward = norm(h.windDir + 180);
  let x = synoptic * Math.sin(rad(toward)) + aloft * th.speed * Math.sin(rad(th.towardAz));
  let y = synoptic * Math.cos(rad(toward)) + aloft * th.speed * Math.cos(rad(th.towardAz));
  // Deep drainages channel light wind along the valley axis.
  const channeled = ter.valleyDepth > 15 && h.wind < 10;
  if (channeled) {
    const ax = Math.sin(rad(ter.drainAz)), ay = Math.cos(rad(ter.drainAz));
    const along = x * ax + y * ay;
    x = along * ax;
    y = along * ay;
  }
  // Strong wind over a ridge separates on the lee slope: surface air can reverse and swirl.
  const leeEddy = h.wind > 10 && ter.slope > 10 && ter.tpi400 > 0 && angleDiff(ter.aspect, toward) < 60;
  const speed = Math.hypot(x, y);
  const towardAz = norm(deg(Math.atan2(x, y)));
  const driver = th.speed > synoptic * 1.2 ? 'thermal' : th.speed > synoptic * 0.4 ? 'mixed' : 'wind';
  return { speed, towardAz, fromAz: norm(towardAz + 180), thermal: th, synoptic, channeled, leeEddy, driver };
}

export type Plume = { calm: boolean; halfAngle: number; spread: number; lengthsYd: number[]; lambdaYd: number };

// Cone half-angle by wind band, widened for forecast uncertainty; length from p_detect = exp(−d/λ).
export function plume(eff: Effective, h: Hour, leadHours: number): Plume {
  const s = eff.speed;
  const halfAngle = eff.leeEddy ? 60 : s < 5 ? 35 : s < 10 ? 22 : s < 15 ? 15 : 12;
  const spread = leadHours < 6 ? 5 : leadHours < 24 ? 15 : leadHours < 48 ? 20 : 28;
  let lambda = 125;
  if (h.rh >= 50 && h.rh <= 90) lambda *= 1.2;
  if (h.rh < 35 || h.temp > 80) lambda *= 0.8;
  if (h.precip >= 0.02) lambda *= 0.7;
  const lengthsYd = [0.6, 0.35, 0.15].map((p) => Math.min(400, -lambda * Math.log(p)));
  return { calm: s < 2, halfAngle, spread, lengthsYd, lambdaYd: lambda };
}

const YD = 0.9144;
function dest([lng, lat]: Position, az: number, meters: number): Position {
  return [lng + (meters * Math.sin(rad(az))) / (111_320 * Math.cos(rad(lat))), lat + (meters * Math.cos(rad(az))) / 111_320];
}

export function cone(center: Position, towardAz: number, half: number, lengthYd: number): Polygon {
  const pts: Position[] = [center];
  for (let a = -half; a <= half + 0.01; a += Math.max(2, half / 12)) pts.push(dest(center, towardAz + a, lengthYd * YD));
  pts.push(center);
  return { type: 'Polygon', coordinates: [pts] };
}

// Calm air: scent pools around the stand and creeps with the thermal.
export function blob(center: Position, driftAz: number, radiusYd: number): Polygon {
  const c = dest(center, driftAz, radiusYd * YD * 0.4);
  const pts = Array.from({ length: 33 }, (_, i) => dest(c, i * 11.25, radiusYd * YD));
  return { type: 'Polygon', coordinates: [pts] };
}

export const COMPASS8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export type Grade = { level: 'good' | 'marginal' | 'bad' | 'unset'; text: string; fit: number };

// Compare the effective wind (thermals included) to the stand's good winds.
export function grade(goodWinds: string[] | undefined, eff: Effective): Grade {
  if (!goodWinds?.length) return { level: 'unset', text: 'Set this stand’s good winds to grade it', fit: 1 };
  if (eff.speed < 2) return { level: 'marginal', text: 'Near calm: scent pools and swirls', fit: 0.8 };
  const diff = Math.min(...goodWinds.map((w) => angleDiff(eff.fromAz, COMPASS8.indexOf(w) * 45)));
  if (eff.leeEddy) return { level: 'marginal', text: 'Lee-slope eddy: scent direction unreliable', fit: 0.8 };
  if (diff <= 30) return { level: 'good', text: `Wind fits (${Math.round(diff)}° off a good wind)`, fit: 1 };
  if (diff <= 55) return { level: 'marginal', text: `Borderline (${Math.round(diff)}° off a good wind)`, fit: 0.8 };
  return { level: 'bad', text: `Wrong wind (${Math.round(diff)}° off every good wind)`, fit: 0.5 };
}
