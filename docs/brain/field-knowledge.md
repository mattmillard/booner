# Field knowledge — what this hunter has taught (and what we got wrong)

Tagged **[H]**. This is the hunter's ground truth; it outranks book rules for his ground. Every entry says what was
learned, why it matters (the mechanism), and what the app now does about it. Append; don't rewrite history.

## Lessons (L)

**L1 — Never plan a stand over open water (2026-09-26).** The planner put stand #1 on the edge of Little Dixie Lake
(Callaway) with half of bow range over the lake. The hunter: "no deer walking in front of this range."
- Why it happened: the USDA crop map (30 m) labels lake arms as wetland/brush, so the model drew a travel corridor
  over the water and flagged the flat shoreline as a "creek crossing"; the planner had no shooting-lane rule.
- Mechanism to remember: water is a **travel barrier and a scent sink**, not deer habitat. A shoreline can still be a
  good *funnel* (deer squeezed between lake and field walk the strip of cover) — but the stand goes on the land side of
  that strip, with the trail inside 10–30 yd and the lake *behind* or downwind of the hunter.
- App now: OSM lake/pond outlines added to water; corridors zeroed on water; crossings must be streams, not lake shores;
  planner rejects stands within 12 m of water or with >35% of the 35-yd circle over water and penalizes any water share.

**L2 — Thermals are not a footnote (2026-09-25).** The hunter raised thermals unprompted, alongside wind, as core to
planning. Why a pressured-deer bowhunter thinks this way: in Missouri hill country the ground-level air follows sun and
slope, not the forecast; mature bucks bed where they can smell what the thermals bring them. So every stand, route and
sighting analysis must state the thermal state (falling/rising/transition, cold pool) at that exact time and place.
- App: thermal model per stand and per hour, thermal-flow arrows, thermal flips in plan timelines, thermal state stored
  on every journal entry for pattern-finding.

**L3 — Learn from real hunters, not farm TV (2026-09-26).** The hunter wants expertise from people who kill mature
bucks on pressured / public ground by woodsmanship (John Eberhart, The Hunting Public's early public-land hunts, etc.),
not paid farm/outfitter kills. Weight [E] rules from pressured-deer hunters above food-plot-farm advice.

**L4 — Water is a pinch, and the kill spot is the hill above it (2026-09-26).** Reviewing the re-plan, the hunter:
stand 1 was *almost* good. The lake is a natural pinch; deer moving north↔south have to pass the land beside it,
staying in tree cover. Sit on the hill above them, in bow range. Read the draws and the benches, the topographic
"ladders" deer climb and follow. His access/parking point is stored as a pin in the app (not in docs).
- Mechanism: water blocks travel, so movement concentrates on the land strip next to the shore and around the heads of
  lake arms. Mature bucks stay in cover and follow benches (flat, contour-following sidehill shelves) and climb through
  draws. A hunter set 3–12 m above that line, 12–35 yd upslope, is out of the deer's eye line and sees them coming
  through timber.
- Thermal caveat (the reason this works or fails): **mornings**, sunlit slopes lift scent uphill, away from the trail
  below: ideal. **Evenings**, falling thermals drain downhill *across* the trail toward the water, so it only works if
  the drainage or wind carries scent past the deer onto the lake (the scent sink), or the trail runs on the uphill side.
  The planner's plume/thermal model decides this per hour; the hunter should confirm with a wind checker.
- App now: the planner detects shoreline pinches (cover strip between water and open ground or steep ground) and
  generates "overlook" stands uphill of the travel line, scoring height above the trail and the lake-as-scent-sink.
  Routes start from his parking pin. Area rules for this ground: portable stands only, no trail cameras (MDC).

**L5 — Crops drive the evening feed, and pre-rut is dawn/dusk on crops (2026-09-27).** The hunter: right now deer
are eating lots of soybeans, specifically before dusk. Pre-rut hunting is dawn or dusk prime time, often on crops.
Use crops (soybeans etc.) to predict feeding.
- Mechanism: in late September green soybean leaves are the most digestible, protein-rich forage on the landscape.
  Deer bed close by and hit the beans in the last hour of light, then work back to cover at dawn. The pattern holds
  until leaves yellow and drop (early–mid Oct) and harvest removes the field. Then waste grain, acorns and green wheat
  take over. Into late October (pre-rut) bucks still start and end the day near the does' food, so dawn and dusk on
  or just off the crop edge are prime.
- What the app got wrong: the planner scored "on the food edge" as a penalty in the evening (book rule: bucks use fields
  at night) and treated every crop the same.
- App now: planner food is crop-specific and phase-weighted (soybeans ~1.0 in early season, lower after leaf drop and
  harvest; corn, wheat and alfalfa on their own curves). In early season through pre-rut, **evening field-edge sets on
  an active crop are a bonus**, not a penalty, as long as the plume blows back into the timber and not across the field.
- Calibration: statewide NASS says 2026 soybeans turned ~a week early, but the hunter's Sep 27 observation says central
  MO beans are still pulling deer, so the app uses half the statewide lead (`SEASON_OFFSET_DAYS = -3`). His field logs
  ("field harvested", "beans yellow") should override the curve when the journal supports them.

**L6 — His pins are private notes, not advice (2026-09-27).** The hunter: "you'll see my pins and I don't want you to
draw conclusions from them or think that you should use my knowledge, unless I tell you SPECIFICALLY otherwise."
- Why: a pin can be a guess, a camera, a stand he has given up on, or a spot for someone else. Treating every stand or
  rub pin as proof put his unvetted notes into the planner's scores.
- App now: every feature has a permanent number (`features.num`, #1, #2, …). The planner and the analyst ignore pins
  unless he marks one as knowledge (pin editor, or ⚙️ Settings: "#133 is a real bedding area", "#144 I kill cruising
  bucks here every day"), stored as `props.knowledge = {kind, note, at}`. Kinds: kill (proven spot), bedding, travel,
  sign, food, avoid, note. Parking and gate pins still act as walk-in start points. Claude only receives marked pins.

**L7 — Deer walk around big water, never across it (2026-10-02).** The hunter: deer will not swim across water the
size of Little Dixie Lake. If they go near it at all, they walk around it.
- Mechanism: a lake is a barrier. Travel bends around the shoreline and the heads of lake arms, which is what makes
  the shore strips pinches (L4).
- What was wrong: the corridor model gave water a high cost (50x) but not an infinite one, so long least-cost paths
  could still cut across narrow arms.
- App now:
  - Water bodies of 10 acres or more are impassable in the corridor model (`BIG_WATER_M2`), and bed-to-food paths that
    would need a crossing are dropped.
  - Small ponds stay merely costly.
  - The map shades only the water (not the shore) with a red hatch, labeled "Deer walk around".
  - Walk-in routes never cross water.
  - Little Dixie's hunting zones are real polygons (research/09): the south part is closed to hunting, and the planner
    never puts a stand there.

**L8 — A public lot isn't pressure; seeing hunters is (2026-10-02).** The hunter: pressure is real and changes deer,
but a public parking lot doesn't mean much pressure, e.g. the CA lot next to his house.
- What was wrong: the planner docked every stand near a public lot (odds drop about 3x per 500 m, from research/06),
  a population-level rule that his ground contradicts.
- App now:
  - The lot-distance penalty is gone.
  - Pressure only comes from what he logs in Field Notes: trucks at the lot, hunters seen, shots heard.
  - Those entries discount stand sites near where he saw them, fading over ~300 m.

**L9 — He talks like a hunter, not a weather station (2026-10-02).** He would never write "NW light" or read
"off by 68°". He'll say he hunted and saw a target buck. The app has to notice by itself that it was 68° yesterday and
58° on the hunt.
- App now:
  - Field Notes takes plain words: an optional wind note, "target buck" as a sighting, other hunters.
  - The server looks up the weather. The card says it in sentences ("58°F when you got in, 10° cooler than this time
    yesterday. Cold front passed…").
  - Camera visits carry the same lookups, so temperature drops, fronts and moon line up with buck visits without him
    entering anything.

**L10 — An obstacle deer can't cross is a pinch on every side; the wind picks the side (2026-10-03).** At his best
spot (an old limestone quarry grown up in cedar), the biggest buck the farm ever produced bedded on the east side and
traveled to the beans on the west. He couldn't cut across the pit (pond plus cliffs), so every trip went around: along
the north wall or along the south rim. The hunter killed two bucks there in one year, both inside 10 yards of his bow
stand, and another big buck walked past the same tree two years later. "When the wind was reversed, all I had to do was
sit on the opposite side of the quarry."
- Mechanism: a hard barrier removes the shortcut, so movement between bed and food concentrates on the lanes that
  skirt it. Bucks hold the contour, keep cover beside easy footing, and travel crosswind with their nose on the cover
  side. Their path becomes predictable to within a few yards, which gives you bow range, not 100-yard shots. Because
  it's structural (terrain), the lane outlives each buck.
- Barriers that make pinches: cliffs and bluffs (always), ponds and lakes (almost always; small creeks don't count),
  plus soft ones like open ground in daylight, houses and busy roads.
- His stand logic, which the app must reproduce:
  - find the real beds and food;
  - find where the obstacle squeezes the routes between them into one lane;
  - sit 5–20 yd off the lane, elevated, on the side the wind carries your scent away from the lane and the beds;
  - walk in from that downwind side without crossing beds or the lane;
  - on the reverse wind, use the lane on the other side of the obstacle.
- What the app got wrong: it scored "narrow cover on a guessed corridor" on a 7 m grid and treated only big lakes as
  barriers. It never found this spot, and its pinch markers number in the thousands.
- Proof of method (2026-10-03): a terrain-only route (slope cost, cliffs nearly impassable, the pit impassable) from
  his marked bed to the bean corner passed within 10 m of his stand and 8 m of a kill site, with no hint from his
  pins. Marked on his map: "Claude: quarry pinches" (#35–#40).
- To do (when he says go): rebuild pinch detection as "barrier-forced lanes between real beds and food" at 1–3 m
  resolution; treat both sides of every barrier as candidate lanes; choose stand side and access by wind.

**L11 — Rivers: owned or not tells you; deer cross them at pinches (2026-10-03).** A doe-bed marker landed mid-river
in Cooper (the crop map calls river channels "wetland"; OSM missed it). The hunter: if water sits on someone's parcel
it's likely not a river; a long unowned gap between parcels likely is. Don't remove travel across rivers: deer cross
where a big pinch leads from one area to another.
- App now: dead-flat ground below its banks counts as water (3DEP is hydro-flattened). Water that's at least half
  outside every parcel is a river: costly but crossable in the corridor model and the pinch finder. Owned water is a
  pond or lake: walk around (L7). A bed now needs cover at least 10 m deep, 25 m+ off water and 60 m+ off roads.

**L12 — The one easy way up is the pinch (2026-10-03).** "Pinch Entrance" at the quarry is a 3-foot path, the one place
he could walk up from the creek to the flat without rock climbing. Every deer, coyote and dog used it, and his camera at
the top got daytime photos of every buck, including the 174.
- Mechanism (terrain alone, his markings not used): a long steep bank (25–40°) separates the creek bottom from the
  flat to the south. The quarry's cliffs (40–60°) cap one end. At the spot the bank is at its gentlest and shortest:
  about 33° and roughly 6 m of steep rise, against 34–40° and 9–12 m along the bank to the southwest. The easiest climb
  from the creek bottom passes within 2 m. Block it and the next way up is 90 m off, with a route 2.6x longer.
- General rule: a barrier band (cliff, steep bank, water) between two places deer want to be, with one easy crossing,
  funnels everything through that crossing. Lanes around an obstacle (L10) are the same idea, going around instead of
  through.
- App now: `pipeline/pinches.py` simulates trips on ~1.9 m terrain. A pinch is a busy, narrow lane with a hard
  barrier on two opposite sides. Its pinches go in the `pinches` table and show as the "Pinches (forced paths)" layer.
  On the quarry square, without his pins, Pinch Entrance came out in the top four, about 30 m away.

**L13 — Travel is a web from every bed, not one line from one bed (2026-10-04).** The hunter: the map showed one
heavy predicted deer path across thousands of acres, built off one "likely buck bed" marker, while bedding exists on
every ridgetop bench and saddle.
- What was wrong: corridors were 2–5 least-cost paths from only the top ~220 bed peaks per map block, so a few
  routes carried everything.
- App now:
  - Every bedding-quality spot (bed models >= 0.35, which covers benches, points, saddles and thick cover), sampled
    every 250 m, routes to all food and to other bedding within ~1.3 km.
  - Nearer food weighs more, and a little terrain randomness keeps routes natural.
  - Each start's whole shortest-path tree is counted, so the corridor layer is a web that is heaviest where many
    beds' routes funnel together.
  - It's rank-scaled: the top ~2–3% of the ground reads as a funnel.
  - The trail lines are the centrelines of the busier travel.

**L14 — No pinches in the middle of fields (2026-10-04).** The hunter: the pinch layer was "placing pinch points in
the middle of fields." Of 6,407 shown, 2,672 sat inside crop fields and 3,228 were 4-yard "lanes" on level ground.
- Cause: dead-flat field ground read as water, and low terrace ridges read as steep banks, so the finder saw fake
  narrow lanes between them.
- App now:
  - Water must sit below its surroundings.
  - A bank counts only if it rises 2 m+ within ~10 m.
  - Pinches inside crop fields and tiny level lanes are hidden: 2,384 shown across the four counties, and Pinch
    Entrance is kept.
  - He can now drop his own "Pinch" pins to teach the why.
  - Refined (2026-10-04): the blanket "hide tiny level lanes" filter also hid his confirmed two-pond lane (a 4 m
    strip between two real ponds). The root causes are fixed in the finder (water must sit below its banks, banks must
    rise 2 m+), so tiny level lanes now show only when a mapped pond or lake is right beside them. Callaway shows 720
    and keeps the two-pond lane, the quarry climb and the creek walkway.

**L15 — Main paths stay; stand-worthy ones get a stand site (2026-10-04).** The hunter likes the travel web.
- He wants weak travel fainter and the strong lanes shown with the dotted trail lines.
- He wants the paths where you'd actually hang a stand marked: right height, good winds, an access walk that
  doesn't cross bedding.
- Main paths must never be hidden just because they fail the stand test.
- App now:
  - The corridor image is curved (value^1.6), so weak travel is faint.
  - Dotted trails show only the strong lanes.
  - A strong lane with a workable stand gets a ★ "Stand site" marker. The spot is in cover 15–35 m off the path and
    2–15 m above it, out of bedding, with 2+ of 8 winds that carry scent off the path and away from beds. The walk
    from a road (bedding x15 cost, the lane x3) must be under ~1 mile.
  - The marker carries its winds, height above the trail and walk.

**L16 — Highways and built-up ground stop deer travel (2026-10-04).** The travel web ran lanes straight across I-70 and
through an interchange and industrial park. The hunter: deer cross highways where heavy timber is on both sides, but
those aren't high-traffic deer areas, and nothing uses the interchange path. He prefers accuracy on real hunting ground
over correcting areas nobody hunts.
- App now: interstate/four-lane cells (within 25 m) cost 80x, so crossing ~50 m costs like ~4 km of timber. Other
  highways cost 8x within 12 m. Developed land costs much more (low 40, medium/high 80). Ground within 20 m of a
  building costs 4x. Beds must be 100 m+ from buildings.

**L17 — Deer skirt deep draws (2026-10-04).** In steep hill country the travel web ran down the middle of V-shaped
draws, where two ridges crash together into a steep-sided runoff channel. The hunter: everything avoids the center of
those. He also said most heavy-traffic areas are right: don't change the logic too much.
- App now (surgical): only deep, steep washouts (bottom 6 m+ below the ground 150 m around, sides steeper than 18°)
  lose the draw-bottom travel discount and cost 2x. Ordinary draws and creek bottoms in cover keep their discount. On
  the test block, totals barely moved (main lanes 2,340 vs 2,342).

**L18 — His own pinch pins, and what the finder misses (2026-10-04).** He marked three pinches around the quarry.
Analysis is terrain-only; distances are what the DEM and OSM show.
- **"Up the side of a hill to the upper quarry" (the Pinch Entrance climb):** steep banks (30°+) within 6–17 m on the
  west and north, the quarry wall 40–80 m east. It's the one walkable way up. The finder found it (20 m away, shown).
- **"Very steep creek walkway":** creek-side walls of 30–33° within 4–16 m on both sides, so the walkable lane is
  ~50 m across in DEM terms and the real path is far narrower. The finder found the lane (its marker sits 71 m along
  it).
- **"Because of the quarry and the house":** quarry walls 50–100 m to the south and southwest, but no terrain barrier
  to the north: that side is open pasture toward a house. The finder missed it: its nearest candidate is 140 m off
  and not shown. The barrier is human: deer in daylight won't step into an open yard/pasture near a house, so the
  timber strip between the pit and the open ground is the lane.
- To do (proposed, not built): treat open ground near houses (and buildings within ~150 m) as a daylight soft
  barrier in the pinch finder, so cliff-vs-yard lanes like this one score.

## Proven spots and stories (S)
_(Filled from the hunter's journal: kills and repeat mature-buck sightings, with the conditions that produced them.)_

- **S1 — Two-pond lane, confirmed (2026-10-04).** Near his home ground, timber travel between two ponds narrows to one
  lane beside a county road and a house. The travel web (L13) ran its heaviest strength straight through it, and the old
  pinch marker sat on it. The hunter: "100% accurate and what I was hoping you would find." This validates water-forced
  lanes (L4/L10) and the bed-to-food web. Model changes must keep this lane at full strength. That's why the
  near-building cost is mild (4x within 20 m), not a barrier.

## Open questions to ask the hunter (Q)
- Q1: On his ground, how long after sunrise do morning thermals flip in the hollows he hunts (smoke/milkweed checks)?
- Q2: Which winds does he consider "kill winds" for his best spots, and why (where does the scent go)?
- Q3: What sign does he trust most in-season (scrapes vs rub lines vs trails), and how far from bedding?
