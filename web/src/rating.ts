// Daily / period hunt rating (docs/research/05 §9.6). Calendar and time of day dominate;
// weather is capped at ±25%, the moon gets zero weight.
import type { Hour, Conditions } from './conditions';
import { sunDay } from './astro';
import { archeryOpen, phaseOn } from './season';

export type Period = 'am' | 'midday' | 'pm';
export type Reason = { text: string; effect: number }; // effect: multiplier − 1 (e.g. +0.09)
export type Rating = { score: number; base: number; baseText: string; period: Period; start: Date; end: Date; reasons: Reason[]; closed: boolean };

const HOUR = 3_600_000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function periodWindows(day: Date, lat: number, lng: number): Record<Period, [Date, Date]> | null {
  const s = sunDay(day, lat, lng);
  if (!s) return null;
  const amEnd = new Date(s.sunrise.getTime() + 2.5 * HOUR);
  const pmStart = new Date(s.sunset.getTime() - 3 * HOUR);
  return { am: [s.legalStart, amEnd], midday: [amEnd, pmStart], pm: [pmStart, s.legalEnd] };
}

const hoursIn = (hours: Hour[], a: Date, b: Date) => hours.filter((h) => h.t * 1000 >= a.getTime() - HOUR && h.t * 1000 <= b.getTime());
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const atTime = (hours: Hour[], t: number) => hours.reduce((best, h) => (Math.abs(h.t * 1000 - t) < Math.abs(best.t * 1000 - t) ? h : best), hours[0]);

export function rate(c: Conditions, day: Date, period: Period, lat: number, lng: number, setupFit = 1, setupReason?: string): Rating | null {
  const win = periodWindows(day, lat, lng);
  if (!win) return null;
  const [start, end] = win[period];
  const hours = hoursIn(c.hours, start, end);
  if (!hours.length) return null;

  const phase = phaseOn(day);
  const reasons: Reason[] = [];
  const closed = !archeryOpen(day);
  let phaseW = phase.weight;
  if (closed && phase.id === 'peak') phaseW = 0.8; // firearms portion: only with a firearms permit

  const tod = phase.tod[period];
  if (tod !== 1) reasons.push({ text: `${period === 'am' ? 'Morning' : period === 'pm' ? 'Evening' : 'Midday'} in the ${phase.name.toLowerCase()}`, effect: tod - 1 });

  // Weather: multiply the terms, then clamp to 0.75–1.25.
  let w = 1;
  const add = (mult: number, text: string) => {
    if (Math.abs(mult - 1) < 0.005) return;
    w *= mult;
    reasons.push({ text, effect: mult - 1 });
  };
  const dayRow = c.days.find((d) => Math.abs(d.t * 1000 - new Date(day).setHours(0, 0, 0, 0)) < 2 * HOUR);
  if (dayRow) {
    const dT = dayRow.high - dayRow.normalHigh;
    let fT = 1 + clamp(-0.015 * dT, -0.15, 0.18);
    if (phase.id === 'late' && dT < 0) fT += Math.min(0.25, -dT * 0.01);
    add(fT, `${Math.abs(Math.round(dT))}°F ${dT < 0 ? 'below' : 'above'} normal high`);
  }
  const maxT = Math.max(...hours.map((h) => h.temp));
  if (maxT > 82) add(0.75, `Hot (${Math.round(maxT)}°F)`);
  else if (maxT > 75) add(0.85, `Warm (${Math.round(maxT)}°F)`);

  const wet = hours.filter((h) => h.precip >= 0.02).length;
  const total = hours.reduce((s, h) => s + h.precip, 0);
  const before = hoursIn(c.hours, new Date(start.getTime() - 18 * HOUR), start);
  if (total >= 0.1 || wet >= 2) add(0.85, 'Steady rain');
  else if (total > 0) add(0.95, 'Light rain');
  else if (before.filter((h) => h.precip >= 0.02).length >= 6) add(1.05, 'First dry hours after rain');

  const wind = mean(hours.map((h) => h.wind));
  if (wind > 20) add(0.88, `Very windy (${Math.round(wind)} mph)`);
  else if (wind > 15) add(0.92, `Windy (${Math.round(wind)} mph)`);
  else if (wind <= 3) add(0.97, 'Calm (swirling scent)');

  const s0 = atTime(c.hours, start.getTime());
  const p4 = atTime(c.hours, start.getTime() - 4 * HOUR);
  const dp = s0.pressure - p4.pressure;
  if (dp > 2) add(1.03, `Pressure rising (${dp.toFixed(1)} mb / 4 h)`);
  else if (dp < -2) add(0.97, `Pressure falling (${dp.toFixed(1)} mb / 4 h)`);

  const prevDay = hoursIn(c.hours, new Date(start.getTime() - 24 * HOUR), new Date(end.getTime() - 24 * HOUR));
  const dir = mean(hours.map((h) => h.windDir));
  const northwest = dir >= 225 || dir <= 20;
  if (prevDay.length && mean(hours.map((h) => h.temp)) - mean(prevDay.map((h) => h.temp)) <= -10 && northwest && dp > 0)
    add(1.05, 'Just behind a cold front');

  const weather = clamp(w, 0.75, 1.25);
  if (setupFit !== 1) reasons.push({ text: setupReason ?? 'Stand wind fit', effect: setupFit - 1 });

  return {
    score: Math.round(100 * clamp(phaseW * tod * weather * setupFit, 0, 1)),
    base: Math.round(phaseW * 100),
    baseText: closed && phase.id === 'peak' ? `${phase.name} (archery closed; firearms permit only)` : phase.name,
    period, start, end, reasons, closed,
  };
}
