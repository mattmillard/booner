// Food attraction by crop and date (docs/research/07-seasonal-patterns.md §1.3, §8.3). Unlogged fields follow the
// Missouri NASS five-year crop-progress average, shifted by SEASON_OFFSET_DAYS for the current year.

// Statewide NASS 2026 runs ~5–8 days ahead (week ending Sep 20: soy 52% dropping leaves vs 42% avg; corn 32% harvested
// vs 23%), but the statewide number includes the early Bootheel. Central MO is later: the hunter saw deer piling into
// beans before dusk on Sep 27 (field-knowledge L5), so use half the statewide lead.
export const SEASON_OFFSET_DAYS = -3;

const WEEK_ENDING = ['09-15', '09-22', '09-29', '10-06', '10-13', '10-20', '10-27', '11-03', '11-10', '11-17', '11-24'];
const SOY_DROP = [16, 34, 51, 68, 84, 93, 97, 99, 100, 100, 100];
const SOY_HARV = [0, 2, 5, 14, 28, 43, 57, 69, 81, 89, 95];
const CORN_HARV = [10, 19, 31, 45, 58, 69, 77, 83, 90, 93, 96];
const WHEAT_EMERG = [0, 0, 0, 2, 8, 17, 31, 45, 61, 74, 84];

const DAY = 86_400_000;
// Season year: Sep–Dec belong to this year, Jan to the previous fall.
const seasonDate = (d: Date, mmdd: string) => new Date(`${d.getMonth() < 6 ? d.getFullYear() - 1 : d.getFullYear()}-${mmdd}T12:00:00`);
const daysFrom = (d: Date, mmdd: string) => (d.getTime() - seasonDate(d, mmdd).getTime()) / DAY;
const ramp = (x: number, x0: number, x1: number, y0: number, y1: number) => (x <= x0 ? y0 : x >= x1 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));

// Share (0–1) of fields past a crop stage on date d, interpolated from the weekly series.
function progress(series: number[], d: Date) {
  const t = d.getTime() - SEASON_OFFSET_DAYS * DAY;
  const xs = WEEK_ENDING.map((w) => seasonDate(d, w).getTime());
  if (d.getMonth() < 6 || t >= xs[xs.length - 1]) return series[series.length - 1] / 100; // Jan or after the last week
  if (t <= xs[0]) return Math.max(0, series[0] - ((xs[0] - t) / (7 * DAY)) * 15) / 100;
  const i = xs.findIndex((x) => x > t);
  return ramp(t, xs[i - 1], xs[i], series[i - 1], series[i]) / 100;
}

const normal = (x: number) => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3))); // ≈ standard normal CDF

// Acorns on the ground: white oaks drop ~Sep 30 (sd 9 d) and get eaten out within ~2 weeks; reds ~Oct 22 (sd 14 d) and last.
function acorns(d: Date) {
  const w = daysFrom(d, '09-30'), r = daysFrom(d, '10-22');
  const white = normal(w / 9) * Math.exp(-Math.max(0, w) / 14) / 0.62;
  const red = normal(r / 14) * Math.exp(-Math.max(0, r) / 45) / 0.75;
  return Math.min(1, Math.max(white, (daysFrom(d, '11-15') > 0 ? 0.85 : 0.7) * red));
}

/** Relative pull (0–1) of a crop field or of upland oak timber ("oak") on date d. */
export function foodAttraction(crop: string, d: Date): number {
  const late = daysFrom(d, '12-01') >= 0;
  switch (crop) {
    case 'soybeans': {
      // "Dropping leaves" starts a field's ~10-day turn; deer keep feeding on turning beans (0.7), much less once bare.
      const turning = progress(SOY_DROP, d), bare = progress(SOY_DROP, new Date(d.getTime() - 10 * DAY)), harv = progress(SOY_HARV, d);
      const green = daysFrom(d, '10-05') <= 0 ? 1 : 0.9;
      const standing = ramp(daysFrom(d, '11-15'), 0, 25, 0.4, 1); // standing dry beans become late-season gold
      return (1 - turning) * green + Math.max(0, turning - bare) * 0.7 + Math.max(0, bare - harv) * standing + harv * (late ? 0.35 : 0.3);
    }
    case 'corn': {
      const harv = progress(CORN_HARV, d);
      const standing = daysFrom(d, '09-15') < 0 ? 0.35 : ramp(daysFrom(d, '11-15'), 0, 25, 0.5, 0.95);
      return (1 - harv) * standing + harv * (late ? 0.35 : 0.3);
    }
    case 'wheat': {
      const emerged = progress(WHEAT_EMERG, d);
      return 0.05 + emerged * (daysFrom(d, '11-15') >= 0 ? 0.8 : 0.65);
    }
    case 'alfalfa':
      return d.getMonth() === 8 ? 0.65 : d.getMonth() === 9 ? 0.75 : d.getMonth() === 10 ? 0.7 : 0.4;
    case 'sorghum':
      return ramp(daysFrom(d, '11-15'), 0, 25, 0.5, 0.8);
    case 'hay':
      return 0.15;
    case 'oak':
      return acorns(d);
    default:
      return 0.3;
  }
}
