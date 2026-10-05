// Central Missouri deer calendar anchored to peak breeding P = Nov 13 (docs/research/07 §1.2). Month/day, editable.

type MD = [month: number, day: number];

export type Phase = {
  id: string;
  name: string;
  start: MD;
  end: MD;
  weight: number;          // buck daylight-movement index (peak = 1), research/07 §8.5
  tod: { am: number; midday: number; pm: number }; // time-of-day weights, sun-relative windows
  deer: string;
  where: string;
};

export const PHASES: Phase[] = [
  { id: 'early', name: 'Early season', start: [9, 15], end: [10, 4], weight: 0.45, tod: { am: 0.55, midday: 0.1, pm: 1 },
    deer: 'Predictable bed-to-feed pattern; heat limits daylight movement. White oak acorns start dropping; green soybeans and clover draw evening feeding.',
    where: 'Evenings at food edges and staging cover. Only low-impact bed-edge sits, and only with a perfect wind.' },
  { id: 'lull', name: 'October "lull"', start: [10, 5], end: [10, 22], weight: 0.45, tod: { am: 0.7, midday: 0.2, pm: 0.9 },
    deer: 'Movement is not really lower (GPS: ~4,000 yd/day). Sightings drop because deer feed on acorns inside the timber, leaves are still on, and pressure builds.',
    where: 'Acorn flats, oak-edge staging areas and freshly harvested crop edges. Hunt conservatively and save your best stands.' },
  { id: 'prerut', name: 'Pre-rut', start: [10, 23], end: [11, 5], weight: 0.7, tod: { am: 1, midday: 0.45, pm: 0.95 },
    deer: 'Scrapes and rubs peak, bucks expand their range and daylight activity rises.',
    where: 'Scrape and rub lines between doe bedding and food. Evenings, plus mornings after cold fronts.' },
  { id: 'seeking', name: 'Seeking & chasing', start: [11, 6], end: [11, 12], weight: 1, tod: { am: 1, midday: 0.8, pm: 0.9 },
    deer: 'Daily travel nearly doubles (7,000+ yd/day) and daylight bedding drops. Most excursions shift into daylight.',
    where: 'All-day sits in funnels between doe bedding areas, the downwind edges of doe bedding, saddles, hubs and pinch points.' },
  { id: 'peak', name: 'Peak breeding', start: [11, 13], end: [11, 20], weight: 0.9, tod: { am: 0.9, midday: 0.75, pm: 0.8 },
    deer: 'Bucks tend does 24–48 h at a time and shift focal areas (GPS does not support a true "lockdown").',
    where: 'Doe-bedding perimeters and interiors, pinch points near them, all day. In 2026 archery is open only Nov 13, then closed Nov 14–24.' },
  { id: 'postrut', name: 'Post-rut', start: [11, 21], end: [12, 4], weight: 0.6, tod: { am: 0.65, midday: 0.4, pm: 1 },
    deer: 'Bucks recover and go back to food. Unbred does cycle again about 28 days later.',
    where: 'Food-to-cover edges in the evening.' },
  { id: 'second', name: 'Second rut', start: [12, 5], end: [12, 18], weight: 0.55, tod: { am: 0.65, midday: 0.4, pm: 1 },
    deer: 'Doe fawns come into estrus (~Dec 2); fewer bucks chase, in short bursts.',
    where: 'Evening food sources that hold doe groups.' },
  { id: 'late', name: 'Late season', start: [12, 19], end: [1, 15], weight: 0.45, tod: { am: 0.4, midday: 0.3, pm: 1 },
    deer: 'Food and cold drive everything: standing grain, brassicas, winter wheat, red oak acorns. Bucks bed in thermal cover (cedar, south slopes).',
    where: 'Evenings over the best remaining food, especially on the first cold days after a warm spell.' },
];

const OFF: Phase = {
  id: 'off', name: 'Off season', start: [1, 16], end: [9, 14], weight: 0.3, tod: { am: 0.8, midday: 0.3, pm: 1 },
  deer: 'Summer patterns: bachelor groups, velvet antlers, bed-to-feed on green crops.',
  where: 'Scout: shed hunting, hang stands and clear routes by spring, run cameras, plant plots.',
};

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();
const inRange = (d: Date, [sm, sd]: MD, [em, ed]: MD) => {
  const v = md(d), s = sm * 100 + sd, e = em * 100 + ed;
  return s <= e ? v >= s && v <= e : v >= s || v <= e;
};

export const phaseOn = (d: Date) => PHASES.find((p) => inRange(d, p.start, p.end)) ?? OFF;

// MDC 2026–27 deer portions. Verify against the Fall Deer & Turkey booklet each year.
export const PORTIONS = [
  { name: 'Archery', start: '2026-09-15', end: '2026-11-13', archery: true },
  { name: 'Firearms early antlerless', start: '2026-10-09', end: '2026-10-11', archery: true },
  { name: 'Firearms early youth', start: '2026-10-24', end: '2026-10-25', archery: true },
  { name: 'Firearms November', start: '2026-11-14', end: '2026-11-24', archery: false },
  { name: 'Archery', start: '2026-11-25', end: '2027-01-15', archery: true },
  { name: 'Firearms late youth', start: '2026-11-27', end: '2026-11-29', archery: true },
  { name: 'Firearms late antlerless', start: '2026-12-05', end: '2026-12-13', archery: true },
  { name: 'Alternative methods', start: '2026-12-26', end: '2027-01-05', archery: true },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function portionsOn(d: Date) {
  const day = iso(d);
  return PORTIONS.filter((p) => day >= p.start && day <= p.end);
}

export function archeryOpen(d: Date) {
  const on = portionsOn(d);
  return on.some((p) => p.name === 'Archery') && !on.some((p) => !p.archery);
}

// Firearms portions push deer into cover and toward night; flag them so the user dresses and plans for it.
export const firearmsActive = (d: Date) => portionsOn(d).some((p) => p.name.startsWith('Firearms'));
