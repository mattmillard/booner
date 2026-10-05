# 06: Pressured-Land Pro Bowhunters → Encodable Planner Rules

Scope: bowhunters who kill mature whitetails on **public, pressured, or unmanaged ground** through their own woodsmanship. Farm-managed, outfitter, and food-plot TV hunters are excluded. Private-land consultants are included only for rules that transfer. Research date: 2026-09-26. This doc extends `05-bowhunting-expertise.md` (physics, calendar, scoring model). It does not repeat that material; it cross-references it (§ numbers refer to doc 05).

**Tags:** **[X]** = the expert states it (number or rule given). **[I]** = inferred or parameterized by us. **[R]** = peer-reviewed research. **Confidence:** **H** = primary source (the expert's own article or first-person quote), **M** = interview or show notes paraphrasing them, **L** = secondary article or search snippet only.

---

## 0. Takeaways for the planner (read first)

1. **Hunter pressure is a function of walking access from *parking*, not straight-line distance to a road.** Research: 87% of PA public-land deer hunters stayed within 0.5 km of a road. Each +500 m cut the odds of an area being hunted by about 3×, and each +5° of slope cut it by 1.5× [R1]. In GA, 90% of pressure fell on 51% of WMA land, and the mean stand was 247 yd from an open road [R2]. Yet every expert here kills bucks **right beside roads that have no parking and a visual screen**: Eberhart has 5 mature bucks within 80 yd of highways [E3], THP has kills 60 yd and 100 yd from roads [H2], and Infalt says nobody walks the road a mile from the lot [I1]. Model the pressure from parking and pull-offs along easy paths, and treat roads without parking as low pressure.
2. **Bed proximity scales with cover density.** Infalt: marsh or swamp 75–100 yd, forest or hills 100–200 yd [I1][I7]. Kenyon: 50–100 yd on heavily pressured bucks [K1]. Andy May: 30–75 yd downwind after a soft bump [A2]. Calibrate with user feedback: "an occasional bump means the distance is right; regular bumps mean too close" [I2].
3. **First sits kill.** Infalt: 11–12 of his top 15 bucks came on the first sit of a spot [I1]. Andy May: about 80% [A1]. Eberhart: 3–4 hunts per season, maximum, at a secure location [E3]. Encode a hard sit budget per location, not just a decay curve.
4. **Rut midday is under-hunted and over-productive.** Eberhart spent under 15% of his rut hours on stand from 11 AM to 4 PM, yet killed 35% of his mature rut bucks in that window [E11]. Infalt: cruising 9 AM–2 PM [I3].
5. **Remote-by-difficulty beats remote-by-distance.** Water, waders, canoes, steep climbs, and thick cover are what filter out other hunters [E1][E3][H6][H7][K2]. Encode barrier crossings as large pressure dividers.
6. **The biggest disagreement is wind.** Eberhart says that with carbon clothing he "pay[s] no regard to wind direction" [E9]. Everyone else puts wind and thermals first. **Do not encode Eberhart's wind stance.** Keep the plume model authoritative (doc 05 §3).

---

## 1. Roster and land type

| Person | Base / land type | Private vs public | Method | Confidence of profile |
|---|---|---|---|---|
| **John Eberhart** | Central Michigan. 50 record-book bucks from 32 properties (31 MI, 19 out of state). **Public land and free-permission private only**: no outfitters, bait, or food plots [E13]. Author of *Bowhunting Pressured Whitetails*, *Precision Bowhunting*, and *Bowhunting Whitetails the Eberhart Way* | Public / pressured | Post-season prep of "natural destination" sites. Hang-ons, now a saddle [E1] | H |
| **Dan Infalt** | SE Wisconsin marshes and hills. The Hunting Beast. Hunts public land about 80% of the time [I1] | Public | Mobile. Hunts buck beds directly. Winter bed scouting | H/M |
| **Greg Litzinger** ("Bowhunting Fiend") | New Jersey: salt marsh, woodlots, NW mountains. Highly pressured public land [L2] | Public | Buck-bed hunter. Lone Wolf hang-on for 15+ years, now a saddle [L2][L3] | M |
| **Andy May** | Michigan (high pressure), plus OH, IL, and western trips. Mix of high-pressure private, permission, and public ground [A1] | Mixed; pressure-focused | Saddle. "Slip hunting" while scouting. Aggressive repositioning [A2][A3] | M |
| **The Hunting Public** (Aaron Warbritton, Zach Ferenbaugh, Greg Clements, Ted Zangerle, Jake Huebschman) | Multi-state DIY public land. Founded ~2017 by ex-Midwest Whitetail staff [H9] | Public | Mobile. Hot sign. Moves fast between parcels | M |
| **Tony J. Peterson** | MN-based DIY public-land writer (MeatEater) [P1][P2] | Public | Timing and crowd avoidance | M |
| **Mark Kenyon** | MI (Wired to Hunt). Hunts public and small private | Mixed | Bedding proximity for nocturnal bucks [K1] | M |
| **Jeff Sturgis** | MI habitat consultant. 20+ public bucks in 31 years [S1], mostly private work | Mostly private (transferable rules only) | Bedding-edge morning hunts; weather-triggered sits [S2] | M |
| **Jon Teater** | NY habitat consultant (Whitetail Landscapes). Also hunts big-woods public land | Mostly private (transferable) | Thermal and humidity science [T1][T2] | M |
| **Bill Winke** | Iowa farm (private) | **Private**: pressure and bedding-timing rules only | Doe-bedding timing; approach wind speed [W1] | M |

**Not verified or dropped:** "Dan Johnson", "Zack Kelley", and "Clay Newcomb" do not appear in any THP roster source found (roster confirmed: Warbritton, Ferenbaugh, Clements, Zangerle, Huebschman [H9]). No verifiable public-land bowhunting material was found for "Paul Campbell" or "Joe Rogers". Candidates of similar caliber, not researched here: Steve Sherk (PA big woods, guest on [T2]), Andre D'Acquisto (credited by Litzinger as a bed-hunting influence [L2]), and Tony Hansen (writes on public-land pressure [X1]).

---

## 2. Per-expert rules

### 2.1 John Eberhart: the "HCHP" (heavy consequential hunting pressure) school

**Core model:** in pressured areas, mature bucks are nocturnal "even during the rut." Their only daylight vulnerability is (a) midday rut movement inside security cover and (b) natural destination sites that are linked to bedding by security cover [E2][E7]. Quote: "Pretend that you're the deer, and everybody is trying to kill you." [E1] (H)

**Area selection / e-scouting**
- Use aerials to find "isolated islands in swamps and marshes, areas across streams, rivers, or lakes that have no other access." Areas that need hip boots, waders, a canoe or boat, or crawling [E3]. (H)
- "If I can access an area with just rubber boots, I won't set up location because other hunters will find it." [E1] "If I can easily walk to it, it won't get set up." [E5] (H)
- **Exception:** land next to a highway works if cover is "dense enough...to block a visual from the road". Hunt "the first hundred yards along it". He has 5 mature bucks within 80 yd of major highways [E3]. (H)
- Validate every aerial find on foot. Print aerials at maximum zoom [E6]. (H)

**Destination ranking** (post-season list; order matters) [E6][E5]:
1. Primary scrape areas
2. Fruit and mast trees (white oak > red oak; lower tannin, visited first)
3. Bedding-area interiors
4. Bed↔feed funnels
5. Terrain funnels
6. Cover protruding into crop fields
7. Scrape-lined runways
8. Rub clusters and rub lines
9. Runway convergences
10. Water (only where water is scarce)

"Well over half the bucks I've taken in the past 30 seasons were from active primary scrape areas" [E7]. (H)

**Hard requirement for every site:** "perimeter security cover around the kill zone as well as adequate transition security cover to a known bedding area." Without it, a mature buck visits only after dark [E7][E5]. Bed↔open-food funnels are "dismal" in HCHP areas [E7]. (H)

**Scrapes** [E4] (H)
- Hunt *primary scrape areas*: clusters of one to a dozen scrapes in a small, high-doe-traffic zone. Set up within shooting distance of "the scrape with the most utilized overhanging licking branches."
- Example cluster (Iowa island): 70 × 30 yd, about 15 active scrapes, many large rubs [E12].
- Where they form: crop-field perimeters, fruit and mast drop zones, terrain bottlenecks, bedding perimeters, transition corridors [E2][E4].
- **Timing:** pre-rut, **Oct 28 – Nov 5 in Michigan**. Hunt only *active* scrapes; inactive ones are worthless then. During peak rut, scrapes are secondary.
- Fruit-tree scrapes: evenings only, never mornings (deer are feeding there).
- Don't re-check active scrapes before the season once confirmed. Hunt the first few days of season, then stay out until pre-rut.

**Rubs:** rank below scrapes. Mature bucks' rubs are "identifiable mid-September onward," so wait until mid-to-late September before judging rub sign [E10]. Rub lines and "rub-lined runways in cutover areas" are freelance targets [E8]. (H/M)

**Season-phase timing** [E1][E2][E5] (H/M)
- Early season, first ~5 days: transition corridors in the morning, natural food in the afternoon. Isolated mast and fruit trees.
- "October lull" (next ~15 days): primary scrape areas, standing corn with rattling, bedding interiors [E1]. Elsewhere he says to *avoid* hunting the best spots in mid-October so doe traffic isn't altered [E2] (internal tension; the safe read is "light touch only").
- Pre-rut starts about **Halloween** and is "the best time to be on stand during midday" [E2].
- Rut: doe bedding interiors (Halloween → gun season), funnels between bedding areas, scrapes with cover.
- Post-rut: doe decoys where no gun season runs at the same time [E1]. Iowa: by Nov 20, post-rut bucks search for late-estrus does [E12].

**Time of day / sit length** (H)
- On stand **≥90 min before first light** [E1][E2][E4].
- Doe bedding hunts: stay until 30 min after dark, and **all day** during the rut [E2][E7].
- Midday window: 10 AM–3 PM [E2], or 11 AM–3 PM [E3][E4]. 7 of his 20 Michigan record bucks were taken 11–3 at scrapes [E4]. 35% of his mature rut kills came in under 15% of his time [E11].
- Put "20% of your time on stand" in the midday shift [E2].
- Water in heat or drought: HCHP bucks drink before daybreak, **noon–3 PM**, and after dark [E2].

**Pressure management** (H)
- Hunt Wednesdays through Fridays [E3].
- Limit each secure location to **3–4 hunts per season** [E3].
- 90%+ of scouting and prep is done post-season (Jan–Apr). "Even hanging and periodically checking a motion camera can have a catastrophic impact." [E7][E10]
- Minimal trimming: "Even the minimal odor of fresh cuttings...can alter their mindset" [E8].
- Freelance only when the sign a spot was prepped for isn't there. Not from boredom [E8].

**Stand setup** (H)
- "Rarely hunt below 25 feet high on public land in Michigan" [E3].
- Uses a saddle and hides on the far side of the trunk from the destination [E1][E7].
- Ground blinds only in remote spots, built from existing deadfalls. Never pop-ups [E3].
- Calling: subtle sparring and soft bleats only. No decoys on pressured land ("mature does will usually spook") [E3].
- **Contradiction:** he did use a doe decoy on the Iowa island [E12]. The read is: decoys only on low-pressure or remote ground, and in post-rut.

**Scent / wind (outlier)** [E9][E1] (H)
- Full carbon clothing, including head cover. Shaves; avoids garlic, onions, and coffee. "Over 1,000 deer directly downwind of me without getting winded."
- Picks sites by deer movement: "the wind direction has nothing to do with it."

**Weather:** "Never allow weather conditions to influence when I hunt." Has killed in 7°F, 35 mph wind, and heavy snow [E11], and in drizzle and rain [E11]. (H)

### 2.2 Dan Infalt: bed hunting, marsh and hill

**Area selection** (H/M)
- "When I look at a property, 95% of it is where I don't want to be" [I7].
- Cross off every obvious hunter route on the map and hunt "the remaining 10 percent" with good edge cover [I1][I2].
- "Anywhere people go, deer are going to be leery moving during daylight" [I1].
- Avoid spots where human scent lingers 10–15+ days [I2].
- Water is a buffer: "They bed in thick areas that are wet." Islands, oxbows, peninsulas, high spots surrounded by water [I1].
- Roadside: "Nobody goes into a parking lot and walks along the road for a mile" [I1].

**Bedding theory / e-scouting cues**
- Edge bedding: a buck beds "on a thick edge looking into the open with wind coming out of the thick stuff to its back." It "will almost always come into its bed by coming into the wind...then turn around and watch its back trail." [I5] (M)
- **Marsh:** beds are at the tips of timber fingers into cattails, islands, points, bowls, and hummocks along the timber/cattail break [I4][I9][I10]. Stay out of "open cattails" [I2]. (M/L)
- **Hill country (leeward theory, credited to Infalt):** bucks bed on the **leeward side, in the upper third of the ridge**, on points or spurs, where wind coming over the top meets rising thermals from below ("thermal wind tunnel"). One source puts it about halfway to three-quarters up the leeward slope [I6]. The best spurs point downwind of the dominant local wind [I6 via search]. Cruising bucks also run the top third of leeward ridges during the rut [I5]. (M)
- Evening field entry: in hilly ground, older bucks enter fields "from that low spot" to use the sinking air near sunset [I5]. (M)
- Rub height indicates buck size better than tree diameter: waist-high rubs [I4]. (M)
- Night-made sign shouldn't pick the tree. Relate it back to nearby bedding, where daylight movement happens [I4]. (M)

**Setup distance** [I1][I3][I7] (H)
- Marsh or swamp: **75–100 yd** off the bed. Forest or hills: **100–200 yd** (up to 200 in open woods).
- "Any further back, and I don't see them in daylight, any closer and they spook." [I3]
- Calibration: being occasionally but not regularly spooked means the distance is right [I2].
- "Set up right at the edge of the safe zone in the staging area" [I5].
- Evening hill setups: work the downwind side and let your scent "blow down a ravine," which concentrates the scent stream away from deer (search summary of an HB thread, **L**).

**Timing** (H/M)
- Best on mature bucks: **the first 2–3 weeks of season** [I1][I2].
- Pre-rut peak: the **third to fourth week of October**, when patterns and sign are strongest [I1].
- Specific beds are used in roughly **2-week windows**; miss it and you miss the deer [I1].
- October "lull": deer still move, just later in the day. Hunt closer to beds (within 100 yd), not food [I4].
- Rut: mature bucks rarely chase in the open. Hunt bedding cover, not funnels [I1]. Bucks corral does in thick cover and cruise "the side where the doe trails go in and out," ideally the downwind side [I3]. Cruisers wait until does are bedded [I3].
- Daily rut plan: **buck bedding at dawn → cruising areas 9 AM–2 PM → parallel doe feeding trails before dark** [I3].
- A buck stays "two or three days with a doe, and then he will move on," so relocate when a spot goes cold [I3].
- Late season: food sources; cold drives daylight movement [I1].
- Uses Jeff Murray moon charts: moon overhead or underfoot is linked to first- and last-light movement [I4]. (M)

**Pressure / bump handling** (H/M)
- First-sit stat: 11–12 of his top 15 [I1]. Stay mobile; don't rotate preset stands [I2].
- Soft bump: hunt again the next day, about 1-in-7 odds the deer returns [I1].
- Hard bump: move and "stack" bedding areas [I1].
- Bumped bucks circle downwind to scent-check [I1].
- "Bump and dump": push a buck off an evening bed, then return at dawn expecting him to re-bed, entering from downwind [I4].

**Entry** [I1][I3][I8] (H/M)
- Final 100 yd extremely slow, stopping to "let my system slow down."
- Wet ground lets you move faster and quieter.
- **Walk directly into the wind toward the tree** so ground scent and airborne scent form one line [I3].
- Never cross target bucks' trails. Access by stream or canoe [I8].
- Scout in Feb–Mar [I8].

**Stand:** about **18 ft** is ideal. Go higher in hills (thermals, swirl) and in open woods; lower when shot angle matters [I8]. Set off to the side of the trail for a broadside shot [I8]. (H)

### 2.3 Greg Litzinger (NJ public)
- Scouts Jan–Apr for "buck beds and terrain features and rub lines near buck beds." Hunts bed → feed and feed → bed movement [L1][L2]. (M)
- **Most success Oct 6–20.** Explicitly avoids the mistake of hunting "a rut funnel or doe bedding area in early October." Scout and set up for the phase you'll actually hunt [L1]. (M)
- Keeps a per-tree log: height, compass facing, and "direction of any possible thermal pull or push" [L1]. (M)
- Always has plans B and C; moves if an area is cold [L1]. (M)
- Scouts 5–6 h for every 3–4 h hunt [L1]. (M)
- Pressure: hikes deeper or uses water as a buffer, or hunts "off other hunters, not necessarily that far from them" [L2]. (M)
- Topics he teaches: two-way rubs, primary scrapes, map reading [L4]. (L; notes only)
- "I like getting close to where they sleep" [L3]. (M)

### 2.4 Andy May (MI pressured + out of state)
- First-sit stat: "Roughly 80% of those were killed on the very first sit in that given location." Waits "until the absolute best time to go into a particular set up" [A1]. (M)
- Pressure gradient: in extremely pressured areas (MI), bucks are "security cover oriented," and freelancing is hard [A1][search]. In low-pressure states he hunts the same spot repeatedly because low density rarely spooks deer [A2]. (M)
- Pressured-property October: don't call to unresponsive bucks. Watch their travel and set up the next day. Patterns last **2–5 days** [A2]. (M)
- Cold fronts in October: don't miss them, but confirm with sign or photos first [A2]. (M)
- Warm spells: hunt tighter to beds, 50–100 yd closer. His data show equal success in warm and cool weather [A2]. (M)
- Rut: Nov 1–5 is aggressive calling and rattling. Nov 6+ is cut-offs and stalks. On warm rut days, hunt thick doe cover, not rut funnels. The final day before gun season is all-day in a funnel between doe bedding areas, interior rather than edge [A2]. (M)
- Post-bump: set up downwind of the bed at **30–75 yd** and re-hunt the next AM or PM if the bump was soft [A2]. (M)
- New ground, 5-day trip: topo + aerial → pin likely beds and funnels → slip in with saddle and bow → look for fresh rubs and scrapes *near estimated beds* over field edges. "Hot sign beats location." [A2][A3] (M)
- Scouting windows: post-season before green-up, during the rut for new areas, and pre-season observation. Not all summer [A3]. (M)
- Uses milkweed fluff to read micro-currents [A1]. Scouts competing hunters' stands [A1]. (M)
- Timing examples: OH best in the first few days of season. IL peak **Nov 9–13** [A1]. (M)

### 2.5 The Hunting Public (Warbritton, Clements, Ferenbaugh, Zangerle)
**E-scouting**
- Picking areas: "It really comes down to access points and pressure" [H5]. Weigh habitat diversity, distance from sizeable cities, and accessibility [H5].
- **Turn off ownership boundaries** and view about a square mile of context. Look for "overlooked funnel[s] between bedding areas," including near roads [H1][H2].
- Predictable pressure points: boat ramps, road access, flat ground close to parking, and fields with tractor-path access [H6].
- Low pressure: the "deepest middle piece," thick cover, water barriers, and draws "several miles to walk in." "Pick the area that's harder physically to access." Also landlocked-by-private corners and overlooked pull-offs [H6].
- "9/10ths of a mile...uphill the entire way" deters most people [H7].
- Bedding cues: points and ridge sides at a consistent elevation line. Ditches used as escape routes. Thick-against-open edges. Cedars or grass mixed into hardwoods. **Oxbow tips.** Places where hills "peter out into the marsh." Bucks bed on the leeward side with westerly winds [H7].
- Then "take the exit trails out of the bedding" and pick trees "very close if not in the bedding area" [H7].
- **Thermal hub:** a bottom where multiple ridges converge like spokes. A rut crossing between bedding areas. Best on high-pressure, calm, or frosty mornings, before the day wind swirls it. Relocate higher once the wind builds [H2].

**On the ground** (M)
- Check for hunter sign first: trucks, stands, limb cuts, boot tracks [H1][H4]. Rake dirt at road ends to detect traffic over 2–3 days [H3].
- Target sign from the last **24 h**, favoring big, aggressive buck sign [H1].
- Scout into the wind on hot, windy days [H4]. Bumped bucks usually stay **within ~300 yd** [H4].
- Kill distances from roads: 220 yd [H5], 60 yd (apple orchard linking two bedding areas) [H2], a thermal hub 100 yd from a road [H2]. "We rarely venture deep into the woods" [H1] (article paraphrase).
- On 5,000+ ac with several bedding areas, keep moving. On small parcels or with one dominant funnel, sit still [H2].
- Small parcels (30–40 ac) with a single access point: watch weekly for trucks [H3]. Small tracts (about 500 ac) beat 10,000+ ac for short trips [H8].
- Warbritton's rut timing: hunt the **last week of October** rather than early November on public land, because "the majority of the hunters take their vacation" in early November [H4].
- Early-season approach: observation stand 100+ yd from beds first, then tighten [H3].
- Entry: green light, in before gray light, out only after full dark. Tight bedding only in windy or wet conditions. Avoid crunchy-leaf evening entries [H3].
- Decoys work in the rut on pressured land. Put them on long ridges visible both ways, with wind blowing into thick cover behind [H2].

### 2.6 Others (transferable rules only)
- **Tony Peterson:** the lull is "a 15-day long Tuesday" with little pressure. Go "a layer back into the cover," often only about 100 yd past the crowd. Sit 4–5 h instead of 90 min. "Time over timing": don't wait for fronts [P1]. Crowding peaks in a ~3-week pre-rut/rut window and climbs "exponentially on the weekend." Keep "backup spots to your backup spots" [P2]. (M)
- **Mark Kenyon:** nocturnal bucks. Driver #1 is the rut and driver #2 is a significant cold front or precipitation event. On heavily pressured bucks, get within **50–100 yd** of the bed in the "toughest to reach...thickest, gnarliest cover," marked by big rubs and fresh scrapes. Pressured bucks react fast to intrusion [K1]. (M)
- **Dylan Tramp (MeatEater):** "90% of hunters sit on the field edges and creek bottoms that are easy to access." Hunt boundaries and corners of large parcels, overlooked 20-ac parcels 2+ h from metros, and "ugly" habitat (sloughs, thin strips, CRP) [K2]. (L; not one of the core experts)
- **Jeff Sturgis:** set on the downwind edge or an adjacent funnel of bedding. **Mornings only** ("nearly impossible...during the afternoon"). He cites cool 27°F mornings vs 58°F afternoons [S2]. One metallic "ting" can spook bucks 200–300 yd away [S2]. Public-land rut plan: 4–6 remote setups 30–60 min walk from the truck, cameras ¼–½ mi apart soaked 3–4 weeks, focus on peak and post-rut cruisers, hunt only significant weather changes [S1]. (M)
- **Jon Teater:** "Thermals are not occurring in the evening"; the evening effect is cold-air sink. Snow negates thermals. Good days: rising pressure around 30.2 inHg and RH around 50%; avoid RH over 70%. Hard rain = "bulletproof." Fog is dangerous (scent pools) [T1]. Big woods: bucks bed on **knuckles where three ridges split ("turkey foot")**. Approach from the valley bottom up the ridge, not the skidder trail. Set about 100 yd from bedding at a lone white oak. Hunt a spot 2–3 times early, then rotate [T2]. (M)
- **Bill Winke (private):** bedding-area hunting starts the last week of October (about 3 weeks before peak breeding). Within 7–10 days of peak, go dawn to dusk. Set on the downwind edge of doe bedding or in a funnel between two doe bedding areas. Approach in **10–15 mph wind** blowing away from deer, using creek bottoms below grade [W1]. (M) Elsewhere he waits for light before walking to morning stands [W2]. (L)
- **Tony Hansen:** mobile bed-intrusion tactics have emptied formerly reliable public cover [X1]. This is an argument for a global "intrusion budget." (M, opinion)

---

## 3. Agreements and disagreements

| Topic | Consensus | Dissent / nuance |
|---|---|---|
| Hunt where others don't | All. Barriers (water, slope, thickness) filter hunters [E3][I1][H6][K2] | THP and Eberhart stress **close-to-road pockets**. Eberhart prefers extreme remoteness, but in pressured MI THP says "we rarely venture deep" [H1] |
| Bedding proximity | Closer = more daylight encounters [I7][K1][A1] | Sturgis: mornings only at beds [S2]. Infalt: dawn in rut beds, but also evening bed sets and bump-and-dump [I3][I4]. Litzinger: bed→feed in the evening [L1] |
| First sit / hunt-once | Infalt, May, Eberhart (3–4 per season), Teater (2–3 early) | May re-hunts freely in low-pressure states [A2]. Doc 05 research cooldown is ~3–6 days, while Infalt says human scent lingers 10–15+ days near beds [I2] |
| Wind | Wind and thermals first (Infalt, THP, Litzinger, Teater, Winke, Sturgis) | **Eberhart ignores wind with carbon** [E9]. Treat as an outlier |
| October lull | Real drop in daylight movement near food | Infalt, Peterson, Litzinger: best public-land window (low pressure, near beds) [I4][P1][L1]. Eberhart: stay off the prime spots mid-October [E2] |
| Weather | Fronts and cold help (Kenyon, May, Sturgis) | Eberhart: hunt all weather. Peterson: "time over timing." May: warm = equal success, just go tighter to beds |
| Rut on public | Doe bedding and bed-to-bed funnels, midday | Warbritton: go the last week of October to dodge the early-November crowd [H4]. Infalt: bedding cover, not funnels [I1]. Winke: funnels between doe beds OK [W1] |
| Stand height | Height relative to terrain and thermals matters | Eberhart ≥25 ft [E3]. Infalt ~18 ft [I8]. Litzinger logs per tree [L1] |
| Decoys / calling on pressured ground | Subtle | Eberhart: no decoys on pressured land [E3]. THP and May: decoys work in the rut [H2][A2] |
| Morning entry | Get in before deer return | Eberhart: 90 min pre-light [E1]. Winke (private): wait for light [W2] (L) |

---

## 4. Encodable rules for our planner

Maps expert rules onto existing app layers: DEM/LiDAR features (bench, saddle, point, draw, cold pool), `bedBuck(wind)` / `bedDoe(wind)`, corridors, pinches, crops, roads/buildings, public polygons, parcels, plume + thermal, least-cost entry/exit, and user pins (rub, scrape, bed, sighting, sit). Parameters are defaults to expose in settings. Each rule carries its source and a tag. `yd` is used where the experts used yards; convert internally.

### 4.1 Public-land hunter-pressure surface (new layer `huntPressure`)

```text
# Access sources: legal parking lots, pull-offs, boat ramps, trailheads (OSM/agency data + user pins).
# Roads WITHOUT legal parking are not sources (E3, H2, I1).
walk_m(c)   = least-cost walking distance from nearest access source (reuse entry/exit cost raster)
slope_deg(c)
barrier(c)  = product over crossings on the least-cost path:
              stream/marsh needing waders ×0.15, open water needing boat ×0.1, dense thicket ×0.5   [I from E3,H6,K2]

# PA public land [R1]: odds of hunting use ÷3 per +500 m from forest road; ÷1.5 per +5° slope
p_use(c) = base_density(date, dow) · 3^(−walk_m/500) · 1.5^(−slope_deg/5) · barrier(c)

base_density multipliers [I from P1, P2, H4, E3]:
  weekday Wed–Fri ×1.0 ; Mon/Tue ×1.2 ; Sat/Sun/holiday ×2.0 (Peterson: "exponentially on the weekend")
  Oct 1–20 ("15-day Tuesday") ×0.6 ; Oct 21–31 ×1.0 ; Nov 1–15 (vacation / rut-cation) ×1.8 ; firearms opener ×3+
  (shift the Nov window to local peak breeding: MO ≈ Nov 10–20 per doc 05 §1.2)
```

- **Pressure shadow flag:** mark `p_use` in the lowest 49% of cells as a "shadow" (GA: 90% of pressure on 51% of land [R2]). [R]+[I]
- **Roadside pocket bonus:** cell ≤100 yd from a highway or road with **no access source within 400 m**, *and* the line of sight from the road is blocked by cover (canopy/NDVI or lidar vegetation height above ~2 m) → pressure ×0.3 [X: E3 "first hundred yards," 5 bucks ≤80 yd; H2 60 yd, 100 yd; I1] [I thresholds].
- **Hunter-sign pins** (truck, stand, cut limbs, boot tracks, raked-dirt tracks) raise local `p_use` within 400 m for 7 days [X: H1, H3, H4] [I radius/decay].
- **Pressure-response of buck model:** when `p_use` is high, shift `bedBuck` weight toward the thickest, wettest, most barrier-protected cells (Eberhart, Infalt, Kenyon). Down-weight field-edge and bed-to-open-food funnels for daylight ("dismal" [E7]).

### 4.2 Candidate-site filters (all sites)

| ID | Rule | Logic / params | Src | Tag / Conf |
|---|---|---|---|---|
| S1 | Security-cover link | Reject a daylight site unless a continuous cover path (lidar veg >1.5 m or forest/shrub class) connects the site to a buck or doe bed cell with prob ≥0.5, **and** the site has cover within ~30 yd around it (perimeter) | E2, E5, E7 | X rule / I numbers, H |
| S2 | No easy-walk sites on pressured public land | If `publicLand && pressureSetting ≥ high`: drop sites where `p_use` is in the top 30% | E1, E5, I1 ("remaining 10%") | I, H |
| S3 | Ignore night sign | Rub or scrape pins in open or high-`p_use` cells don't create sites. Project them along the corridor toward the nearest bed and create a site at the first cover-linked point | I4, E5 | X/I, M |
| S4 | Hot sign beats location | Sign pins <24 h old (rut) → site score ×1.5, decaying with a half-life of 2 days. 2–5 day pattern lifetime | H1, A2, I3 | I from X, M |
| S5 | Bed-used window | A user-marked active buck bed stays "hot" ~14 days, then decays | I1 ("2-week windows") | X, H |

### 4.3 Bed-adjacent sets

```text
d_target(cover_class):                       # distance from bed centroid to stand
  marsh/swamp/cattail edge  : 75–100 yd      [X I1,I7]
  forest/hill               : 100–200 yd     [X I1,I3,I7]
  heavily pressured, nocturnal buck (user flag): 50–100 yd   [X K1]
  post-soft-bump re-hunt    : 30–75 yd downwind of bed   [X A2]
  warm spell (temp anomaly > +8°F): d_target −50 yd (min 50)   [X A2 "50–100 yd closer"] [I trigger]
score_dist = gaussian around d_target; hard reject < 30 yd (except user override)
```

- **Calibration loop:** sit-log fields `bumped_deer ∈ {none, occasional, every_sit}`. After 2 or more "every_sit" results, push `d_target` out 25 yd for that bed. After 3 or more "none" results with no daylight sightings, pull it in 25 yd [X: I2, I3] [I step].
- **Side of bed:** the buck beds with wind (from thick cover) at his back, watching downwind or open ground, and enters into the wind [I5][H3]. Place candidates on the **exit trail toward the evening destination** [H7], crosswind of the bed, such that `plume(stand)` ∩ (bed ∪ exit trail ∪ the bed's downwind scent-check arc) = ∅. Bumped or cruising bucks circle downwind [I1][I3]. Treat the downwind 90° sector of the bed out to 150 yd as "scent-check zone" [I].
- **AM vs PM at beds:**
  - AM (dawn intercept of a returning buck): require entry done ≥90 min before first light [E1]. The route must not cross the feed→bed trail [I8]. Rising-thermal onset (doc 05 §2.2 sun-on-slope) must not carry scent into the bed before ~2 h after sunrise [I].
  - PM: allowed only if at the stand's sit window the modeled evening flow is **downslope/cold-air sink** (Teater: not a thermal) and carries scent **away from** bed and exit trail. In practice the stand is below or beside the bed with the drainage heading off-axis ("scent down a ravine" [Infalt, L]). **Cold-pool cells** from the DEM are good scent sinks if deer aren't using them [T1][I5]. Sturgis' mornings-only rule is the default for *users who flag weak access* [S2].
- **Hill leeward bedding prior (boost `bedBuck`):** leeward aspect relative to forecast wind (±60°), relative elevation 0.5–0.85 of the local ridge (the tunnel, "upper third" / ½–¾ up) [I6][I5], on a point or spur, extra weight when the spur axis is within ±45° of downwind, plus a thick/open edge within 30 yd [I5]. Tag [X concept / I numbers].
- **Knuckle / turkey-foot prior:** DEM nodes where 3 or more ridge lines diverge from a knob → `bedBuck` +, especially the cover edges of the knob [T2]. [X/I]
- **Marsh prior:** tips of timber or shrub fingers and islands ≥0.3 m above the surrounding wetland (lidar), at the timber/cattail break; oxbow tips [I4][I10][H7]. Reject open cattail interiors for stand sites [I2]. [X/I]
- **Escape-route prior:** beds adjacent (≤50 yd) to a draw or ditch head that offers an escape route [H7]. [I]

### 4.4 Scrape / destination sets (Eberhart model)

```text
primary_scrape_area := cluster of ≥3 user scrape pins within 40 yd radius (Iowa example 70×30 yd, ~15 scrapes [E12])
                       OR a single pin flagged "multiple licking branches"          [I thresholds from E4,E7]
site = tree within 25 yd of the most-used licking-branch pin, on the cover side     [X "within shooting distance" E4; I 25 yd]
must pass S1 (perimeter + transition cover to a known bed)                          [X E4]
active window (MI): Oct 28–Nov 5  → generalize: peak_breeding − 14d … peak_breeding − 5d  [I from E4 + doc 05 §1.2]
time-of-day bonus inside window: 11:00–15:00 ×1.5                                   [X E4: 7 of 20 record bucks]
fruit/mast-tree scrape: PM only; drop AM                                            [X E4, E7]
before window: suppress scrape-site visits except first ~3 days of season           [X E4]
```

- **Mast:** white oak dropping > red oak. Among several oaks, choose the one nearest transition cover or a known bed [E5]. Early-season destination; oaks in the morning only in ag areas with a pre-dawn arrival [E7]. [X]
- **Water:** only a site when no other water exists within ~400 m [I]. Bonus noon–15:00 and pre-dawn during heat or drought [E2]. [X/I]

### 4.5 Time-of-day and phase scheduler (augments doc 05 §9.4/§9.6)

| Phase (relative to local peak breeding P) | Primary site types | Time weights | Src |
|---|---|---|---|
| Opener → +5 d | Transition corridors in cover (AM); natural food / mast (PM); buck-bed edges | AM 1.0, PM 1.0 | E1, I1, L1 |
| Season wk 1–3 (early Oct in MO) | **Bed→feed edges** 75–200 yd off beds | PM 1.2 (bed→feed), AM 0.8 | I1, L1 (Oct 6–20) |
| "Lull" (~P−35 … P−21) | Public land: bed-proximal sets (pressure low). Heavy-pressure user setting: light touch, spare "A" sites | pressure ×0.6 | I4, P1 vs E2 |
| Pre-rut (P−21 … P−7) | Primary scrape areas; rut beds downwind of doe bedding; thermal hubs (AM calm or frost) | **10:00–15:00 ×1.5**; AM 1.2 | E2, E4, I3, H2 |
| Seek/chase (P−7 … P+3) | Doe-bedding downwind edges; funnels between doe bedding; cruising lanes on leeward upper-third ridges | All-day sit option; 09:00–14:00 ×1.4 | E2, I3, I5, W1 |
| Lockdown/peak (P … P+7) | Thick doe cover (esp. warm days); interior over edge | Midday ×1.3 | A2, E2 |
| Post-rut (P+7 … P+21) | Doe groups; late-estrus funnels; decoy OK on low pressure | PM 1.1 | E1, E12 |
| Late season | Food sources, **PM**; warm mornings after frigid ones (bedding edges) | PM 1.3 | I1, S2 |

- **Public-land rut shift:** if the `publicLand` pressure forecast for Nov 1–15 is in the top quartile, add a recommendation to hunt P−14…P−7 (Warbritton's "last week of October" equivalent) [H4]. [X/I]
- **Entry/exit timing:** AM stand arrival = first light − 90 min (Eberhart) [E1]. Show Winke's light-entry alternative only on low-pressure private land [W2]. Doe-bedding sits: exit ≥30 min after last light [E2]. All-day default in remote or doe-bedding sets during P−7…P+7 [E2][W1].

### 4.6 Sit budget and freshness (replaces a pure decay curve for bed and destination sets)

```text
budget(site):
  bed-adjacent on pressured/public   : 1 sit, then require a move ≥ 150 yd or to another bed    [X I1, A1 (~75–80% first-sit kills)]
  destination (scrape/mast) remote   : ≤ 4 sits per season                                     [X E3 "three or four"]
  big-woods food/bed-edge early      : ≤ 3 sits early season, then rotate to backup             [X T2]
  low-pressure user flag             : budget ×2 (May re-hunts in low density)                  [X A2]
freshness(site) = 1 − 0.5·exp(−days_since/τ)
  τ = 2 d corridors/funnels (doc 05 §7, research) ; τ = 10 d bed-adjacent (Infalt: scent lingers 10–15+ d) [X I2 / I τ]
soft bump logged → allow a re-hunt next day at 30–75 yd downwind (p_return ≈ 1/7) [X I1, A2]
hard bump logged → suppress that bed for 7 d; suggest the next bed ("stacking")         [X I1 / I 7 d]
camera-check / scouting walk in core cells counts as ½ sit                              [X E10 "catastrophic" / I weight]
```

Surface "first sit" prominently. Rank "A" sites to be spent only when wind + phase + weather are in the top decile (May: wait "until the absolute best time" [A1]).

### 4.7 Entry / exit routing (augments doc 05 §9.5)

| Cost term | Value | Src |
|---|---|---|
| Crossing a buck corridor or a trail cell with buck-use prob >0.5 | +high (near-forbidden) | I8, E1 |
| Plume over a bed or exit trail during approach | +high | all |
| Final 100 yd | Require either (a) walking **into** the wind toward the tree (ground + air scent collinear) or (b) a below-grade creek/draw bed; cost ×0.5 for such cells | I3, W1, T2 |
| Water routes (canoe or wader) | Cost ×0.6 for the scent term (no ground scent), ×1.5 effort | I8, E3 |
| Skidder trails / obvious paths near beds | Penalize within 150 yd of beds; prefer "valley bottom up the ridge" | T2 |
| Noise | Leaf-litter dryness (days since >0.1" rain) × route length in the last 200 yd. **Wet-ground bonus.** Suggest bed approaches only when wind ≥10 mph or rain | I1, H3, W1 (10–15 mph) |
| Detour allowance | Accept routes up to +30 min walk to avoid deer cells | S2 |
| Light | UI tip: dim, downward or green light | E1, H3 |

### 4.8 Weather gates (display as signals, not hard rules, given the expert disagreement)

- Cold front in October (Δtemp ≤ −10°F over 24 h [I]) → boost, but only for sites with sign or photos from the last 7 days [A2][K1].
- Frosty or calm high-pressure AM → boost thermal-hub and bedding-edge AM sets [H2][S2].
- Rising barometer near 30.2 inHg and RH 40–60% → +. RH >70% or fog → − (scent pools) [T1]. **(M; Teater's personal thresholds.)**
- Heavy rain or wind ≥10 mph → boost *tight* bed approaches (noise cover) [W1][I1][T1].
- Snow → disable thermal term (Teater: snow negates thermals) [T1]. [X/I]
- Warm anomaly → move bed sets closer (see §4.3) rather than skipping [A2]. Show Eberhart's and Peterson's "hunt anyway / time over timing" as the default stance. Weather only reorders sites; it never zeroes a day [E11][P1].
- Moon: optional display of overhead/underfoot times (Infalt uses them) [I4]. Evidence is weak (doc 05 §6). Default weight 0.

### 4.9 Stand height and facing

- Height default 18 ft (Infalt) [I8]. Pressured public ≥25 ft (Eberhart) [E3]. Add +5 ft on slopes where the thermal plume would intersect the uphill trail (doc 05 §8 height rule) [I].
- Store per-tree `{height, facing, thermal push/pull note}` on sit pins, as in Litzinger's log [L1]. Prompt it after the first sit.
- Saddle users: facing = the side of the trunk away from the destination [E7].

### 4.10 Rut cruising geometry

- Around each doe-bedding polygon (`bedDoe` ≥0.6), generate a **"cruise lane"** 40–100 yd off its downwind edge for the forecast wind, especially where doe trails enter and exit [I3][W1]. [X concept / I distances]
- **Bed-to-bed funnels:** least-cost corridors between doe-bedding polygons ≤1 mi apart, pinch-weighted. Midday weight [E2][A2][W1].
- **Thermal hubs:** DEM nodes where ≥3 draws converge into one bottom. Rut AM only while wind is under ~6 mph [I]. Flag "relocate higher after 10:00 if wind builds" [H2].
- **Leeward upper-third cruising line** on ridges: contour band at 0.6–0.8 relative elevation on the lee side [I5]. [X/I]

### 4.11 Sign-pin semantics (user pins → model)

| Pin | Effect | Src |
|---|---|---|
| Rub, waist-high or higher / large | Mature-buck flag. Radiates a `bedBuck` prior within 300 yd up-corridor | I4, L1 |
| Rub line (≥3 rubs within 100 yd, aligned) | Infer travel direction. Extend toward the nearest bed; create a bed→feed site near the bed end | E5, L1 [I] |
| Two-way rubs | Trail used both directions → AM and PM site | L4 [I] |
| Scrape cluster / licking branch | See §4.4 | E4 |
| Bed (buck) | Hot 14 d; drives §4.3 | I1 |
| Sighting at first light | Glassing sightings → corridor evidence (May glasses AM) | A2 |
| Bump (soft/hard) | §4.6; also mark the escape direction. The buck likely beds within ~300 yd | H4, I1 |
| Hunter sign | §4.1 pressure bump | H1, H3 |

### 4.12 Things NOT to encode

- Eberhart's "no regard to wind" (depends on carbon clothing; everyone else disagrees) [E9].
- Hard-coding "deep = good." Pressure is access-driven, and roadside pockets are real [R1][E3][H2].
- Decoy or calling recommendations on high-pressure public land (Eberhart vs THP conflict). Keep these as optional tips only.

---

## 5. Open items

- Primary text of Eberhart's books wasn't accessed (Internet Archive borrow only). Stand-height, runway, and rub-line specifics come from his articles; verify against *Bowhunting Pressured Whitetails* chapters on rubs and runways.
- Hunting Beast forum threads (Infalt's own posts) reset connections during fetch. The "scent down a ravine" and marsh-tip claims are **L** until verified there.
- Litzinger: the only first-person source is a short Q&A [L1]. Podcasts [L4] would give distances.
- Calibrate `p_use` against user "hunter sign" pins on Missouri CAs and WMAs. The PA and GA coefficients are from forested public land. MO conservation areas with parking lots may concentrate pressure more tightly.

---

## Sources

**Eberhart**
- [E1] D&DH, "Is He the Best Bowhunter in America?" https://www.deeranddeerhunting.com/content/articles/is-he-the-best-bowhunter-in-america
- [E2] Eberhart, "Success Despite Heavy Consequential Hunting Pressure." https://wildgamedynasty.com/john-eberharthchp-tactics/
- [E3] Eberhart, "Public Land Strategies – that actually work." https://wildgamedynasty.com/public-land-strategies-that-actually-work/
- [E4] Eberhart, "Active Scrapes, #1 Natural Hunting Location." https://wildgamedynasty.com/active-scrapes-best-natural-hunting-location/
- [E5] Eberhart, "Scout NOW for Next Fall (Part II)." https://wildgamedynasty.com/john-eberhart-scouting-part-2/
- [E6] Eberhart, "Scout Now for Next Fall (Part I)." https://wildgamedynasty.com/scout-now-for-next-fall-part-1/
- [E7] Eberhart, "Natural Destination Areas." https://wildgamedynasty.com/natural-destination-areas/
- [E8] Eberhart, "Freelance Hunting – with a plan in hand." https://wildgamedynasty.com/freelancing-with-john-eberhart/
- [E9] Eberhart, "Just Play The Wind…?" https://wildgamedynasty.com/scent-control/
- [E10] Eberhart, "Reality of Bowhunting." https://wildgamedynasty.com/reality-of-bowhunting-by-john-eberhart/
- [E11] MeatEater, "John Eberhart's '97 Midday Monster." https://www.themeateater.com/hunt/general/john-eberharts-97-midday-monster
- [E12] MeatEater, "John Eberhart's Iowa Island Eight Pointer." https://www.themeateater.com/wired-to-hunt/whitetail-hunting/john-eberharts-iowa-island-eight-pointer
- [E13] D&DH, "Public & Pressured Land Deer Hunter with John Eberhart." https://www.deeranddeerhunting.com/public-pressured-land-deer-hunter-with-john-eberhart

**Infalt**
- [I1] Outdoor Life, "Inside the Mind of Dan Infalt." https://www.outdoorlife.com/hunting/dan-infalt-deer-hunting-tips/
- [I2] Outdoor Life, "Public Land Deer Hunting Tips from Dan Infalt." https://www.outdoorlife.com/hunting/dan-infalt-hunting-public-land-bucks/
- [I3] WhitetailDNA, "Hunting Bedding Areas During the Rut with Dan Infalt." https://www.whitetaildna.com/tactics/2016/11/16/hunting-bedding-areas-during-the-rut-with-dan-infalt
- [I4] Wired to Hunt #27, "Hunting the October Lull w/ Dan Infalt." https://www.themeateater.com/listen/wired-to-hunt/the-wired-to-hunt-podcast-episode-27-hunting-the-o
- [I5] Realtree, "How Mature Bucks Use the Wind." https://realtree.com/deer-hunting/articles/how-mature-bucks-use-the-wind
- [I6] Realtree, "10 Places to Find Late-Season Buck Beds." https://realtree.com/deer-hunting/articles/10-places-to-find-late-season-buck-beds
- [I7] Realtree, "How to Hunt Big Buck Bedding Areas." https://realtree.com/deer-hunting/articles/how-to-hunt-big-buck-bedding-areas
- [I8] Infalt, "Treestand Strategies." https://www.stealthoutdoors.com/tactics/
- [I9] Boundary Waters Grouse Lodge (secondary, L). https://www.boundarywatersoutfitting.com/hunting-swamp-bucks-boundary-waters/
- [I10] Hunting Beast Podcast #9, "Marsh Bedding" (search summary only, L). https://www.thehuntingbeast.com/viewtopic.php?t=35090

**Litzinger**
- [L1] WhitetailDNA, "Big Woods Bucks with Greg Litzinger." https://www.whitetaildna.com/tactics/2018/10/7/big-woods-bucks-with-greg-litzinger
- [L2] MeatEater, "DIY Deer Hunter Profile: Greg Litzinger." https://www.themeateater.com/wired-to-hunt/whitetail-hunting/diy-deer-hunter-profile-greg-litzinger
- [L3] Wired to Hunt Ep. 793. https://www.themeateater.com/listen/wired-to-hunt/ep-793-how-public-land-whitetail-killer-greg-litzi
- [L4] Truth From the Stand Ep. 228 (notes). https://podcasts.apple.com/us/podcast/ep-228-buck-bedding-tree-setups-greg-litzinger/id1127162036?i=1000520213647

**Andy May**
- [A1] MeatEater, "DIY Deer Hunter Profile: Andy May (Part One)." https://www.themeateater.com/hunt/big-game/diy-deer-hunter-profile-andy-may-part-one-of-two
- [A2] Wired to Hunt Ep. 378, "What Would Andy May Do?" https://www.themeateater.com/listen/wired-to-hunt/ep-378-what-would-andy-may-do
- [A3] Wired to Hunt Ep. 805, "Mindsets of the Whitetail Masters: Andy May." https://www.iheart.com/podcast/1119-wired-to-hunt-podcast-31019453/episode/ep-805-mindsets-of-the-whitetail-203601718/
- [A4] NDA, Andy May podcast notes. https://deerassociation.com/andy-may-on-aggressive-diy-deer-hunting-tactics-and-in-season-scouting/

**The Hunting Public**
- [H1] MeatEater, "How The Hunting Public Finds Quality Public Land Deer Hunting." https://www.themeateater.com/wired-to-hunt/whitetail-scouting/how-the-hunting-public-finds-quality-public-land-deer-hunting
- [H2] Wired to Hunt Ep. 386 (Warbritton & Clements). https://www.themeateater.com/listen/wired-to-hunt/ep-386-rut-hunting-public-and-pressured-land-with-aaron-warbritton-and-greg-clements
- [H3] Wired to Hunt #165 (Warbritton). https://www.themeateater.com/listen/wired-to-hunt/wired-to-hunt-podcast-165-aaron-warbritton-s-midwe
- [H4] "Aaron Warbritton on How to Hunt the Rut on Public Land." https://www.yahoo.com/lifestyle/aaron-warbritton-hunt-rut-public-182943275.html
- [H5] Legendary Whitetails, "Public Land Q&A with The Hunting Public." https://community.legendarywhitetails.com/blog/public-land-q-a-with-the-hunting-public/
- [H6] onX, "Mapping Whitetails with THP, Ep. 2: Access & Pressure." https://www.onxmaps.com/hunt/blog/e-scouting-whitetail-deer-hunting-public-episode-2-identifying-access-hunting-pressure
- [H7] onX, "Mapping Whitetails with THP, Ep. 4: Bedding & Stand Locations." https://www.onxmaps.com/hunt/blog/mapping-whitetails-with-the-hunting-public-episode-4-deer-bedding-areas-tree-stand-locations
- [H8] Outdoor Life, "Tips from The Hunting Public: Kansas Public Land." https://www.outdoorlife.com/hunting/deer-hunting-kansas-public-land/
- [H9] THP launch video (Warbritton, Clements, Ferenbaugh). https://www.facebook.com/TheHuntingPublic/videos/aaron-warbritton-greg-clements-and-zach-ferenbaugh-discuss-the-launch-of-their-n/925881040911009/

**Others**
- [P1] Peterson, "How to Handle the Crowds While Whitetail Hunting Public Land." https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-handle-the-crowds-while-whitetail-hunting-public-land
- [P2] Peterson, "How Whitetail Hunters Can Overcome Public Land Overcrowding." https://www.themeateater.com/wired-to-hunt/whitetail-scouting/how-whitetail-hunters-can-overcome-public-land-overcrowding
- [K1] Kenyon, "How to Kill a Nocturnal Buck." https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-kill-a-nocturnal-buck
- [K2] Tramp, "How to Find Whitetail Sanctuaries on Public Land." https://www.themeateater.com/wired-to-hunt/whitetail-scouting/how-to-find-whitetail-sanctuaries-on-public-land
- [S1] Sturgis, "5 Public Land Rut Hunt Strategies." https://www.whitetailhabitatsolutions.com/blog/diy-public-land-rut-hunting-strategies
- [S2] Sturgis, "How to Hunt a Deer Bedding Area." https://www.whitetailhabitatsolutions.com/blog/how-to-hunt-a-deer-bedding-area
- [T1] Whitetail Landscapes, "Technical Hunting Series: Scent Signals, Wind and Thermals." https://sportsmensempire.com/podcasts/technical-hunting-series-scent-signals-wind-and-thermals
- [T2] Whitetail Landscapes, "Technical Hunting Series: Big Woods Bucks." https://sportsmensempire.com/podcasts/technical-hunting-series-big-woods-bucks
- [W1] Winke, "How and When You Should Hunt Whitetail Bedding Areas." https://www.bowhunter.com/editorial/how-to-hunt-whitetail-bedding-areas/518139
- [W2] Grand View Outdoors, stand approach (search snippet only, L). https://www.grandviewoutdoors.com/big-game-hunting/whitetail-deer/how-to-stop-spooking-deer-away-from-your-treestand
- [X1] Hansen, "How Mobile Hunting Tactics Impact Public Ground." https://www.themeateater.com/wired-to-hunt/whitetail-management/how-mobile-hunting-tactics-impact-public-ground

**Research**
- [R1] Diefenbach et al. 2005, "Bear and deer hunter density and distribution on public land in Pennsylvania," *Human Dimensions of Wildlife*. https://pure.psu.edu/en/publications/bear-and-deer-hunter-density-and-distribution-on-public-land-in-p/ (see also the NDA summary: https://deerassociation.com/scouting-large-blocks-of-land-fast-and-effectively/)
- [R2] Rosenberger et al. 2022, "Resource selection of deer hunters in Georgia's Appalachian Mountains," *Wildlife Society Bulletin*. https://wildlife.onlinelibrary.wiley.com/doi/full/10.1002/wsb.1356 (numbers via NDA: https://deerassociation.com/10-highlights-from-new-deer-science-you-can-use/)
