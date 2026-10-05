# 05 — Whitetail Bowhunting Expertise → Encodable Algorithms (Central Missouri)

Scope: Callaway / Cooper County, MO: Missouri River bluffs and bottoms, row crops, oak-hickory ridges and hollows, CRP/NWSG, cedar. Goal: turn expert and research knowledge into heuristics the app can compute: bedding raster, travel corridors, stand score per wind, entry/exit route, daily hunt rating.

**Evidence tags**
- **[R]** Peer-reviewed or university GPS-collar research. Strong.
- **[R-w]** Research exists but shows a weak, inconsistent, or small effect.
- **[P]** Physics/meteorology. Well established, but applying it at deer scale is still approximate.
- **[E]** Expert consensus (Infalt, Sturgis, Kenyon, Eberhart, NDA biologists). Widely practiced but not formally tested.
- **[F]** Folklore, or claims that research contradicts.

Numbers in brackets like [8] point to the Sources list at the end.

---

## 0. Design takeaways (read first)

1. **The calendar and time of day dominate. Weather and moon barely matter.** Rut phase and the crepuscular cycle drive most of the variation in movement [8][9][18][21]. Temperature relative to normal is the only weather variable with a fairly consistent effect [11][16][26]. The moon effect is about zero [9][10][11][12]. Keep weather to about ±25% of the hunt rating and give the moon 0%.
2. **Wind and access decide whether a hunt works.** Research can't measure this directly, but every expert source agrees. It is also the part of the app that is most defensible and most valuable: which stand, for this wind, with this approach.
3. **Hunting pressure is measurable and large.** Bucks avoid a hunted stand site for about 3 days, and are drawn back only after about 6 days. Twelve hours of sitting in a week halves the odds of daylight use. Daylight visits fell from 1 in 3 to 1 in 20 over a season [22][23][66]. The app should track sit history per stand and enforce cooldowns.
4. **Mature bucks bed in screening cover, not in "a sanctuary".** Heavily used beds had twice the screening cover of unused sites. Bucks switch focal areas every 6–10 h, and during the rut end each day about 0.9 mi from where they started [8]. Model bedding as a probability surface with several nodes, not as a single point.
5. **Bucks use food plots and fields mainly at night** (2–5× more at night than by day under pressure) [8][24][25]. Daylight opportunity sits on the corridor between cover and food, and in staging cover. That argues for corridor-weighted stand scoring rather than field-edge scoring.

---

## 1. Central Missouri calendar

### 1.1 Regulatory windows, 2026–27 (MDC [1]). Verify against the 2026 Fall Deer & Turkey booklet.
| Portion | Dates |
|---|---|
| Archery | **Sep 15 – Nov 13, 2026** and **Nov 25, 2026 – Jan 15, 2027** |
| Firearms early antlerless (open counties) | Oct 9–11 |
| Firearms early youth | Oct 24–25 |
| **Firearms November** | **Nov 14–24** (the archery permit is not valid; a bowhunter needs a firearms permit and, per MO rules, hunter orange — verify) |
| Firearms late youth | Nov 27–29 |
| Firearms late antlerless (open counties) | Dec 5–13 |
| Alternative methods | Dec 26, 2026 – Jan 5, 2027 |
| Legal hours (archery) | ½ hr before sunrise to ½ hr after sunset |

**App rules:**
- Legal-light window = sunrise − 30 min to sunset + 30 min, computed per location.
- Flag Nov 14–24. For an archery-permit-only user, this is the most frustrating gap, because it covers peak breeding.
- Add a *pressure multiplier* on firearms portions and the days after. Deer shift to cover and to night; one MSU study saw daytime use of cover rise 240% by the second gun weekend [8].

### 1.2 Rut timing, central MO
- MDC: peak mating is mid-November [2]. Midwestern fetal data put mean conception at **Nov 8 (adults), Nov 11 (yearlings), Dec 2 (doe fawns)** [3] [R]. Penn State puts peak conception around Nov 13–17 in PA. Breeding timing is photoperiod-driven and **does not move with weather** [15][28] [R].
- Buck movement peaks slightly *before and during* peak conception. In SW Wisconsin, peak movement ran Oct 23 – Nov 12, with variance peaking around Nov 7 [18] [R].

**Default phase table for 38.8°N** (all dates editable):
| Phase | Dates | What deer do | Where to hunt |
|---|---|---|---|
| Early season | Sep 15 – ~Oct 5 | Predictable bed→feed pattern. Heat limits daylight movement. White oak drop, green/yellowing soybeans, clover plots. | Evening at food / staging. Low-impact bed-edge sits only with a perfect wind. |
| "October lull" | ~Oct 5 – Oct 22 | **Movement is not actually lower**: MSU daily distance was about 4,000 yd/day Oct–Nov [8]. Sightings drop because of acorns (feeding in timber), leaf cover, pressure, and harvest changes. [R] contradicts the "lull" as biology. | Acorn flats, oak-edge staging, harvested-crop edges. Hunt conservatively. |
| Pre-rut | Oct 23 – Nov 1 | Scrapes and rubs peak. Bucks expand their range. Daylight activity rises. | Scrape lines and rub lines between doe bedding and food. Evening, plus mornings on cold fronts. |
| Seeking / chasing | Nov 1 – Nov 12 | Daily distance rises to about 7,000–7,500+ yd/day. Daylight bedding falls (about 10% less, roughly 1.25 h less daylight bedding) [8][9]. Excursions shift from 85% at night to 70% in daylight [20]. | **All-day sits.** Funnels between doe bedding areas. Downwind edges of doe bedding. Saddles, hubs, pinch points. |
| Peak breeding / "lockdown" | Nov 8 – Nov 20 | Tending bouts last 24–48 h per doe. "Lockdown" is not supported by GPS data; bucks shift focal areas instead [19] [R]. | Doe-bedding perimeters and pinch points, with midday included. **Mostly closed to archery (Nov 14–24).** |
| Post-rut | Nov 25 – Dec 5 | Bucks recover and go back to food. Unbred does and fawns cycle again about 28 days later. | Food-to-cover edges in the evening. |
| Second rut | ~Dec 1 – Dec 15 | Doe fawns come into estrus (mean about Dec 2 [3]). Fewer bucks chase, and they do it in short bursts. | Evening food with doe groups. |
| Late season | Dec 10 – Jan 15 | Food and cold drive movement. Bucks want high-energy food: standing corn/beans, turnips, winter wheat, red oak acorns. They bed in thermal cover. | **Evening** over the best remaining food, especially the first cold days after a warm spell [36]. |

### 1.3 Food calendar, central MO [4][5][52][65] [E/R]
| Food | Available | Notes |
|---|---|---|
| Soybeans (green) | Aug – mid Sep | Leaves are highly preferred until they yellow; attraction collapses when leaves drop (late Sep). Standing dry beans are a strong late-season food if left. |
| White oak acorns | **Late Sep – mid Oct drop** | Deer's first choice (low tannin). Can be over 75% of the late-fall diet in good mast years [65]. MDC runs an annual mast survey; use it as a seasonal prior [52]. |
| Red / black oak acorns | Oct – Dec (drop slower, persist) | Used after the whites are gone and into late season. |
| Corn (standing) | Until harvest. In MO, harvest is usually 50–75% done by mid-Oct (NASS) [49]. | Standing corn is both **cover and food**; bucks can bed in it. Harvest suddenly deletes cover and moves deer. |
| Harvested corn / beans | Oct – Jan | Waste grain. Evening use. Late-season value depends on how clean the harvest was. |
| Winter wheat | Planted Oct (about 15–25% planted by mid-Oct), green Nov – Jan | Strong late-season green forage. |
| Clover / brassica plots | Clover all season; brassicas are best after hard frost (Nov – Dec) | Bucks use plots 5× more per acre than natural cover, but mostly at night [8]. |
| Browse (greenbrier, sumac, dogwood, Korean lespedeza, buckbrush, honeysuckle) | Year-round; critical when acorns fail | Found in early-successional cover and edges, so bedding cover and food overlap [5][8]. |
| Persimmon, honey locust, apple | Sep – Nov | Soft-mast hotspots; point features supplied by the user. |
| Water | Not limiting in MO [5] | Matters only in drought or early-season heat: ponds near bedding during 80°F+ days [E]. |

**Crop layer:** use the USDA Cropland Data Layer [61] for the crop *type*. Harvest *timing* is not in CDL, so model it as a probability that the field is harvested, using NASS weekly MO crop-progress percentages [49]. Let the user override field state (standing / cut / plowed / planted to wheat).

### 1.4 Temperature normals for anomaly calculations
Columbia (KCOU) average highs: **Oct about 66°F, Nov about 54°F, Dec about 43°F** [64]. Use NOAA 1991–2020 daily normals, interpolated by day, per nearest station.

---

## 2. Thermals

### 2.1 Physics [P] [44][45]
- **Night:** radiative cooling makes a dense air layer that flows **downslope and down-drainage** ("drainage flow", katabatic). Speeds are usually ≤3–4 m/s (≤7–9 mph) and generally much lighter on MO-scale relief. It follows drainages like water and **pools in hollows, creek bottoms, and river bottoms** (cold-air pools) [45].
- **Morning transition:** upslope flow starts on a slope **within minutes of direct sun on that slope** [44]. East- and south-facing slopes flip first. North-facing slopes, shaded hollows, and valley floors flip last.
  - The *valley-wide* inversion break-up and the down-valley → up-valley reversal happen **several hours** after the slopes flip. Deep Colorado valleys took 3–5 h [44].
  - MO hollows (30–120 m relief) and the river bluffs should transition faster: roughly **1–3 h after sunrise** [P/E, estimated]. Hunter-reported timing is about 1–2 h after first light in hill country [40], and the transition is swirly and unreliable [40].
- **Day:** upslope and up-valley flow strengthens and deepens. Convective mixing brings down the stronger winds from above, so gusts and swirls appear by late morning [44].
- **Evening transition:** starts when a slope goes into shadow (east- and north-facing first), then a calm, then gentle laminar downslope flow [44]. Sturgis puts reliable falling thermals at only about the **last 30–60 min of light** [35] [E]. Plan an afternoon sit for two air regimes: prevailing/rising for the first about 3 h, falling for the last hour [35].
- **Synoptic override:** thermals dominate when ambient wind is light; stronger wind mixes them out [40][44] [P].
  - Working thresholds [E/P]: **<5 mph** at ground level means thermals dominate. **5–10 mph** is mixed; thermals bend the plume near the ground, especially in hollows. **>10–12 mph** means synoptic wind dominates, except in the lee eddies of ridges.
  - Kenyon's thermal-hub guidance: winds under 5 mph are "more consistent" for hub hunting [32].
- **Cloud cover weakens thermals** (less heating by day, less radiative cooling at night). On overcast, breezy days, treat thermal strength as ≈0 [40].
- **Aspect insolation:** south slopes get up to about 40% more sun and can be up to about 10°F warmer than north slopes [39]. Their upslope flow starts sooner and runs stronger.

### 2.2 Encodable thermal model
```
inputs: DEM, aspect, slope, sky_view/hillshade(t), sunrise, sunset, sun_az/el(t),
        cloud_frac(t), wind10m_speed(t), wind10m_dir(t), canopy_class
# 1) is this cell sunlit? (hillshade with actual sun position; slope-aware)
sunlit(c,t)        = hillshade(c, sun_az(t), sun_el(t)) > 0
t_lit(c)           = first time today sunlit(c,t) is true
# 2) thermal direction: downslope unit vector d(c) = -grad(z)/|grad(z)| (smoothed DEM, ~30 m)
# 3) thermal sign & strength
if t < t_lit(c) + lag(c):           sign = -1   # drainage/downslope (lag: 15-45 min open slope,
                                                #  60-180 min hollow floor / cold pool; scale by valley depth)
elif t > t_shadow(c) or t > sunset - 60min:  sign = -1 (ramping in over ~30-60 min)
else:                                sign = +1   # upslope
strength = base(slope) * (1 - cloud_frac)^1.0 * seasonal_rad(t)
         * f_wind(wind_ground)      # f=1 below 3 mph, linear to 0 at ~12 mph
# ground-level synoptic wind (canopy reduction factor, NWCG WAF): open 0.4-0.5,
#   partial shelter 0.3, open-stand timber 0.2, dense timber 0.1 of 20-ft wind  [46]
wind_ground = wind20ft * WAF(canopy_class)
V_eff(c,t) = wind_ground * u(wind_dir) + sign * strength * THERM_MAX * d(c)   # THERM_MAX ~ 1.5-3 mph
```
- Better option: run **WindNinja** (USFS; mass-conserving terrain wind with an optional **diurnal slope-flow** term) on 30–100 m DEMs, per forecast hour [48] [P]. It gives terrain channeling and lee sheltering, which the simple vector sum misses.
- **Cold-air-pool flag:** cells with high flow accumulation, low slope (<5°), and a strong negative TPI at 300–500 m. Before about sunrise + 1.5 h and after sunset − 45 min, scent here pools and drifts *down-drainage* regardless of forecast wind. Morning stands in bottoms are therefore risky for anything downstream in the drainage. Evening stands in bottoms are good if deer come *from* downstream [E/P].
- **Thermal hub** = 3+ draws converging at a low point (the "crow's foot") [32][33]. Scent pools and swirls there. Deer (and bucks during the rut) pass through, scent-checking several drainages at once [E].
  - Kenyon: hunt hubs in pre-rut/rut on calm, frosty mornings, in **wider bottoms with gradual side slopes** (narrow, steep = whirlpool) [32].
  - Encode: hub_score = n_draws_converging × rut_weight. The penalty for scent uncertainty ∝ side-slope steepness ÷ valley width.

### 2.3 Hill rules of thumb [E] [34][35][41]
- **Morning:** be *above* deer travel. Rising thermals carry scent up and away from deer below. But a buck bedded *above* you will smell you [34]. Enter before first light, or wait until the thermal flips if the approach crosses below bedding.
- **Evening:** be *below* or level with travel, never above it. As air cools, scent falls onto trails below [35]. A forecast wind "at your right knee" tends to tail back *uphill* toward your left before thermals fall (Sturgis) [35].
- **Midday rut:** thermals rise and swirl. Favor spots where scent goes to deer-free zones: bluff faces, open fields, the river, roads [34].

---

## 3. Wind and scent

### 3.1 How deer use wind [E] [30][41][42]
- **Bedding:** mature bucks bed **with the wind at their backs and vision downhill or out**. They smell behind and watch in front [30][31].
  - Hill-country version (Infalt): bed on the **leeward side of the ridge, in the upper third / about 1/2–3/4 of the way up**. The prevailing wind comes over the top and forms an eddy, while rising thermals bring scent up from the valley. The two currents converge on the bed [42].
- **Approach:** "almost all mature bucks" approach food and bedding **from the downwind side, or with the wind quartering across their face**. They J-hook into beds to wind-check them [30].
- **Rut cruising:** bucks cruise the **downwind side of doe bedding areas** and scent-check from downwind [30]. Georgia scrape-camera studies saw old bucks checking scrapes from well downwind, out of camera range [29].
- **Research caveat [R-w]:** GPS studies have not shown wind *direction* consistently steering travel routes at landscape scale [17]. Treat "bucks walk into the wind" as a *local approach* behavior near beds, scrapes, and food, not as a rule for whole-route travel.

### 3.2 Scent plume model [P] with [E] parameters
Treat human scent as a plume from the stand, or from each point on the walk-in, advected by the effective ground wind `V_eff` (§2.2).

**Half-angle of the plume.** Use the wind-direction standard deviation σθ, by stability class. EPA guidance gives Pasquill–Gifford σθ breaks of **A ≥22.5°, B 17.5–22.5°, C 12.5–17.5°, D 7.5–12.5°, E 3.8–7.5°, F <3.8°** [47] [P].

At deer scale in timber, add terrain and canopy turbulence. App defaults [P/E]:
| Ground wind | Plume half-angle | Notes |
|---|---|---|
| <2 mph (calm / thermal only) | treat as **radius 40–60 yd all around**, plus drift along ±d(c) (thermal) | Swirl. Unpredictable. |
| 2–5 mph | ±35° | Bends with terrain. Thermal-dominated in hollows. |
| 5–10 mph | ±20–25° | Most predictable band for stand sets. |
| 10–15 mph | ±15° | Good. Lee eddies appear on leeward slopes. |
| >15 mph | ±10–15° plus gust-driven swings | Downwind cone is narrow, but **forecast direction error** dominates. |

**Forecast direction error:** widen by ±15–20° for a 1-day forecast and ±25–30° for day 3+ [E]. Better: use the ensemble or hourly spread of direction across the sit window. The stand score uses **P(wind in acceptable arc)**.

**Detection length L:**
- Anecdotal claims run 400 yd to over ½ mile under ideal conditions (humid, 50–70°F, light breeze) [56]. There is no rigorous dose–distance curve [F/E].
- Use exponential decay, `p_detect(d) = exp(−d / λ)`. Suggested λ: **150 yd in open or light wind**, 100 yd in dense timber, ×1.2 when RH is 50–90%, ×0.8 when dry or hot, ×0.7 in steady rain. Cap the plume at 400 yd.

**Lee-slope eddy:** when wind >10 mph blows over a ridge, flow separates on the lee slope. At the surface, the air there can move *upslope, toward the ridgeline* (reverse flow), and swirl near the crest. This is exactly why bucks bed there [42]. For stands on lee slopes in strong wind, set the plume direction as uncertain (half-angle ±60°) unless WindNinja resolves it.

**Terrain channeling:** in drainages deeper than about 20 m, ground wind aligns with the drainage axis, in whichever along-axis direction the ambient wind projects onto, when ambient wind is <10 mph [P]. Encode: project V_eff onto the drainage direction in cells with flow accumulation above a threshold and side-slope >15°.

### 3.3 Playing the wind: stand geometry rules [E] [30][34][67]
- **Crosswind set:** the ideal wind is **perpendicular to the expected deer travel line**, and your plume lands in a deer-free zone (open field, bluff drop, river, road, lake) [30][34].
- **Downwind cruiser problem:** mature bucks often travel *just downwind* of the trail or bed edge you'd hunt. Place the stand so a buck skirting downwind still passes inside bow range but outside your plume (Kenyon's "cut the corner") [30]. In practice this means the stand sits on the downwind side of the corridor, 15–25 yd off the main trail. The downwind cruiser route then passes between you and the trail, or your plume blows over an area the buck won't use (open field, drop-off).
- **Hunt-once-per-wind:** each stand has 1–3 acceptable wind arcs. Keep an A/B/C stand set covering the common winds (fall in central MO: S–SSE ahead of fronts, W–NW behind them; check the KCOU wind rose [57]).
- **Access wind ≠ sit wind.** Evaluate the wind during entry and exit separately, because the time-of-day thermal differs.

---

## 4. Terrain and cover: where deer bed and travel (DEM + land cover encodable)

### 4.1 Feature catalog
| Feature | Why deer use it | Evidence | DEM / land-cover encoding |
|---|---|---|---|
| **Screening cover** (thickets, early successional, cutovers, CRP/NWSG, cedar, standing corn) | Used bed sites had **2× the screening cover** and 2× the herbaceous/thicket vegetation of unused sites [8]. Bucks favor stemmy, grassy cover over mature timber [38]. | **[R]** | NLCD shrub/scrub + herbaceous + young forest. NAIP/Sentinel canopy texture. CDL grass/pasture with high NDVI in Sep = probably NWSG/CRP. Evergreen forest on hillslopes = cedar. Standing corn = CDL corn × P(not harvested). |
| **Upper third of slope / sidehill** | Wind, sight, and escape cover [41][42] | [E] | relative slope position `rsp = (z − zmin)/(zmax − zmin)` in a 300–500 m window. Score peaks at 0.6–0.85. |
| **Leeward side of ridge** | Shelter from wind; scent currents converge [42] | [E] | aspect within ±60° of (wind_from + 180°), with rsp 0.5–0.85. Compute **per wind direction** (8 or 16 bins). |
| **Points / ridge spurs** | Bed at the tip with wind at the back, watching downslope. Trails converge at point ends [31] | [E] | geomorphon = spur/ridge [59], convex plan curvature, high TPI (150 m), and the point tip (distance to the end of the ridge line <75 m). |
| **Benches** | Flat travel and bedding shelves on steep slopes; traveling deer aren't skylined [41] | [E] | local slope <8–10° with mean slope >15° within 50–100 m, rsp 0.3–0.85, elongated along the contour. |
| **Saddles** | Easiest ridge crossing; deer not skylined. Classic rut funnel | [E] | ridge network (geomorphon ridge / high TPI), cells that are local elevation minima along the ridge but maxima across it (Hessian eigenvalues of opposite sign on a smoothed DEM). Depth ≥3–5 m. |
| **Travel ¾ down the ridge side** | Avoid the skyline [31] | [E] | low-resistance band where rsp 0.55–0.85 parallels the ridge. |
| **Inside corners** (timber wrapping a field corner) | Funnel plus multiple wind options | [E] | vectorize the forest/field boundary. Vertices with interior angle ≤120° measured on the *field* side. |
| **Cover funnels / pinch points** | Mature bucks avoid crossing open ground; cover strips concentrate travel [31] | [E] + [R] (bucks choose covered routes [8]) | corridor width = distance across a cover strip perpendicular to least-cost flow. Circuitscape current density [60] peaks at pinches. |
| **Edges** | Travel and browse at habitat transitions | [E] | distance to forest/open edge. Edge density. |
| **Ditches, draws, creek corridors in ag** | Linear cover through open land | [E] | NHD flowlines [63] plus flow accumulation. Wooded riparian buffers across cropland = corridor. |
| **Creek crossings** | Low banks and shallow riffles concentrate crossings | [E] | along NHD lines: points with low bank height (DEM relief across the channel <1.5 m) and gentle approach slopes, between cover on both sides. |
| **Thermal hubs / draw convergences** | Rut scent-checking hubs [32][33] | [E] | stream-network nodes where ≥3 first/second-order draws join within 150 m. |
| **South-facing slopes (cold)** | Solar gain, out of NW wind [39] | [E]; physics [P]. Realtree warns cover and food still trump aspect [39]. | aspect 135–225° × cold_weight(temp anomaly, late season). |
| **Islands of cover / isolated thickets** | Low pressure, secluded. MSU buck #273's favorite focal areas were "secluded islands of cover" [8] | [R-qualitative]/[E] | small (0.5–10 ac) cover patches far from roads and houses, surrounded by open land. |
| **Distance from human activity** | Deer avoid areas near trails [54], use roads and plots at night [8][25], and change behavior under hunting pressure [55] | [R] | distance to roads, houses, trails (**Katy Trail** runs along the river in Cooper/Boone/Callaway), parking, public-land access points. Penalty decays over roughly 100–400 m. |

### 4.2 Missouri-specific landscape notes [E]
- **Missouri River bottoms:** cropland (corn/beans) with willow and cottonwood thickets, sloughs, and oxbows toward the river. Levees and ditches act as travel lines. The **bluff-toe transition from bottom to bluff** is a major interface between bedding in the bluff hollows and cedar and feeding in the bottoms. Floods (spring, and occasionally fall) re-shuffle bottomland bedding. Add a *flood/inundation flag* from river stage.
- **Bluffs and glades:** south- and west-facing bluffs carry cedar and glade openings, which make late-season thermal cover and good lee-side bedding in NW winds. Cliffs and steep bluff faces are **scent dumps**: great downwind targets for your plume [34].
- **Dissected oak-hickory hills** (Reform CA area, bluff hills): hollows, points, benches, and saddles. This is classic "hill country" logic. Note: Reform CA shrank by about 1,000 ac (the north portion closed Jul 1, 2025 for an Ameren solar project) [51].
- **CRP / NWSG:** switchgrass, indiangrass, and bluestem are top bedding cover. Nearly 95% of MO CRP is cool-season or NWSG mixes. Heavy stands of dense old grass hold bedding cover but little food [6][7]. Fescue pasture is poor cover [E].
- **Cedar thickets:** 8–15 ft cedars are strong bedding and weather cover [6].

### 4.3 Doe vs buck bedding [E] [36][38]
- **Doe family groups** bed closer to food, in larger thickets. They are more tied to food (females accept daytime risk to feed; they used food plots by day more than males did [24][25] [R]).
- **Mature bucks** bed more isolated: points, lee edges, islands of cover. Sturgis places **buck bedding "behind" doe bedding relative to food**, sometimes a mile or more from evening food [36]. MSU: buck home ranges have a median of 859 ac (27% under 500 ac, 22% over 2,000 ac), with daily ranges of only about 200 ac even at peak rut [8] [R].
- **Encode two rasters:**
  - `P_bed_doe`: cover × proximity to food (best 50–400 m) × low disturbance.
  - `P_bed_buck`: cover × terrain security features × distance to food (best 300–1,600 m) × distance from doe cores (0.2–1 km) × stronger disturbance avoidance.

### 4.4 Bedding probability model
```
# all features normalized 0..1; w = default weights (calibrate later with user-marked beds / cams)
logit_P_bed_buck(c, wind_dir, date, temp_anom) =
   2.0*screen_cover(c)                    # [R] MSU 2x screening cover
 + 1.0*slope_pos_upper(c)                 # rsp 0.6-0.85 bump
 + 1.0*leeward(c, wind_dir)               # per-wind raster, [E]
 + 0.8*point_or_bench(c)
 + 0.6*cover_edge_with_view(c)            # thick cover abutting open view/downslope
 + 0.5*south_aspect(c)*cold_weight(date,temp_anom)
 + 0.6*island_of_cover(c)
 + 0.5*dist_food_buck_bump(c)             # peaks 300-1600 m from active food
 - 1.5*human_disturbance(c)               # roads/houses/trails/parking, decays 100-400 m
 - 1.0*hunter_pressure_recent(c)          # from sit log, 3-5 day decay [R]
 - 0.8*open_mature_timber_no_understory(c)
 - 2.0*flooded_or_water(c)
 - 1.0*crop_harvested_recently(c)         # cover deletion
P_bed_buck = sigmoid(logit - bias)        # bias so ~5-10% of forest/cover cells > 0.5
```
- **Post-process:**
  - Cluster cells above 0.5 into *bedding nodes* (≥0.3 ac).
  - Keep the top-k per 160 ac. Bucks use several focal areas and switch every 6–10 h [8].
- **Seasonal variants:**
  - Early season: shade and airflow. Downweight south aspect, upweight north/east aspects and proximity to water on days >80°F. Deer pant at ≥86°F (30°C) and show heat stress above 77°F (25°C) [16].
  - Late season: upweight south aspect, cedar/evergreen, and NW-wind lee.

### 4.5 Travel corridor model
- **Resistance surface** R(c), lower = easier:
  - Open ground in daylight: high (×5). Mature open timber: ×2. Thick cover: ×1 (but ×1.5 in impenetrable brush). Standing corn: ×1.
  - Slope: ×(1 + (slope/25°)²).
  - Skyline ridgetop: ×1.5. Bench / ¾-down sidehill / saddle / ditch / riparian strip: ×0.6.
  - Human disturbance: ×(1 + 3·disturbance). Water deeper than wading or the river: ×50. Creek crossing points: ×0.8.
  - Daylight corridors use the **daytime** R (open penalty high). Night R relaxes the open-ground penalty. MSU and Brosnan: bucks use open food at night [8][25].
- **Sources and sinks:** bedding nodes → active food polygons for the date (phase table §1.2). Rut: bedding node ↔ doe bedding nodes (buck), and doe-node ↔ doe-node.
- **Compute:**
  1. **Circuitscape/Omniscape current density** [60] for corridor probability, since it captures multiple routes and pinch points.
  2. **k least-cost paths** (k = 3–5, with a diversity penalty) for trail lines to display.
  3. **Funnel score** = local current density ÷ corridor width. Top percentiles = pinch points.

---

## 5. Food by phase → which sinks are active
```
active_food(date, cdl, field_state, mast_index):
  early (Sep15-Oct5): soy_green (until leaf-drop), clover_plots, white_oak_stands (weight = mast_index_white), alfalfa
  lull (Oct5-Oct22):  white/red oak flats (dominant if mast good), harvested fields (waste grain), plots
  pre-rut/rut:        food still matters for does -> doe bedding/food define where bucks go;
                      buck sinks = doe bedding nodes + food edges
  post-rut/late:      standing corn/beans >> brassica plots (after frost) > winter wheat > harvested corn > red oak
weights scale with: field size (bigger = more night use, less daylight), distance to cover (<100 m edges get daylight use),
                    pressure (hunted fields shift to night)
```
Oak stands are hard to map from NLCD. Use NLCD deciduous forest on upland ridges × MoRAP/LANDFIRE forest type where available, and let users drop "mast tree" pins. In poor mast years deer move farther between bed and food [65], so widen the food distance kernels.

---

## 6. Weather, moon and movement: evidence vs myth

| Factor | Claim | What research shows | Tag | App weight |
|---|---|---|---|---|
| **Rut phase** | Movement peaks in the rut | MSU: 4,000 yd/day (Oct) → 7,500+ (peak rut); daylight bedding falls from 38% to 23%; hourly movement rises from 219 to 400 yd/h [8][10]. Wisconsin peak Oct 23 – Nov 12 [18]. | **[R]** | Primary driver |
| **Time of day** | Crepuscular | Bimodal peaks at sunrise and sunset, evening heavier. PSU October: about 2× the dusk/dawn rate vs. day and night [21]. MSU: about 60% of twilight behavior is moving/feeding [8]. Bucks still move midday, especially in the rut; MSU says hunt all day in the rut [8]. | **[R]** | Primary driver |
| **Temperature vs normal** | Cold snaps boost daylight movement | The most consistent weather effect [11][26]. Goethlich (116 GPS deer, SC): daytime activity falls as temperature rises. Females in the breeding season: P(active) 0.57/0.42/0.31 at 10/20/30°C; post-breeding 0.67 at −5°C vs 0.34 at 20°C [16]. Penn State saw no clear effect of warm Oct/Nov on rut timing or movement [14]. Grant Woods uses departure from normal [28]. | **[R-w] to [R]** | ±15–20% |
| **Heat** | Hot days kill daylight movement | Heat stress above 77°F, panting at ≥86°F [16]. Activity shifts to night and twilight. | **[R]** | −15–25% above 75–80°F |
| **Cold fronts** | Deer move before/after fronts | PSU: no statistical or biological pre-storm increase; slight drops during and after winter storms [13]. MSU/NDA: no strong correlation during the rut [15]. Hunters report good post-front mornings (a front means cooler, clearer, NW wind). | **[R-w]**, mostly captured by temperature | ≤+10%, and never double-count with temperature |
| **Barometric pressure** | 30.00–30.30" and rising = best | Absolute pressure has no consistent correlation in Texas, MSU, or Oklahoma [11][27]. Goethlich: the **4-hour pressure change** predicted better than absolute pressure, but responses were inconsistent across sex, season, and time of day [16]. | **[R-w]/[F]** for absolute values | 0–5% (4-h tendency only) |
| **Rain** | Deer don't move in rain | PSU: **bucks' movement fell by up to half on rainy days**; does unaffected. Strong wind cancels the rain effect [14]. "Deer move right after rain" is hunter lore [E]. | **[R]** bucks | −10–20% in steady rain; +5% first dry hours [E] |
| **Wind speed** | Windy = deer bed down | Mixed. PSU: more movement on windy *days*, less on windy nights [17]. Demarais & Zaiglin: dip at 15–19 mph, rebound at ≥20 [17]. Oklahoma / Chesapeake Farms: no consistent effect [11][17]. Goethlich: small effects [16]. | **[R-w]** | ±5–10%. More important for *scent* than for movement. |
| **Humidity** | — | Small and inconsistent [16]. | [R-w] | 0 (it affects scenting λ instead) |
| **Moon phase** | Full moon = night feeding | MSU (48 bucks, 15-min fixes): on top "4-star" solunar days, +4 yd/h movement and +0.6% bedding. That is **trivial** and within collar error [9][10]. Webb (Oklahoma): no effect [11]. PSU: 4–6 m/h difference, not significant [12]. MSU publication: "absolutely no pattern" by moon phase [8]. | **[F]** | 0 (display only) |
| **Moon position (overhead/underfoot)** | Solunar majors | MSU: trivial [9]. Goethlich found statistical differences in some season × period combinations, but they were small and inconsistent [16]. | **[F]/[R-w]** | 0 |
| **Pressure from hunters** | Bucks go nocturnal | Auburn/McCoy: avoidance of hunted stands for about 3 days, attraction back by about day 6; 12 h of sits in a week halves daylight odds; daylight visits fell from 1:3 to 1:20 by week 13; young bucks are as wary as old ones [22][23][66]. MSU: bucks shift *where and when*, not *away* [8]. | **[R]** | Large (§7) |

**Diel detail:** bucks move ~269 yd/h and are bedded ~34% of daylight on average. In the rut they move ~100 yd/h more, with about 10% less daylight bedding [9]. Excursions happen for ~60% of bucks in fall: mean ~1.5 mi, mean ~16 h, range 2 h to several days. During peak rut, 70% happen in daylight [20]. Expect "new" bucks on camera in the Nov 1–15 window.

---

## 7. Hunting pressure and mature buck behavior

- **Stand cooldown [R]:** after a sit, the harvest-zone avoidance lasts ~3 days (avg), with return to normal attraction by ~day 6 [22][23][66]. Model:
  `stand_freshness = 1 − 0.5·exp(−days_since_last_sit / 2.0)`
- **Cumulative pressure [R]:** ≥12 h in the prior 7 days halves the odds of daylight use [23].
  `stand_pressure = 1 − 0.5·min(1, hours_last_7d / 12)`
- **Property-wide pressure [R]:** firearms openers and weekends mean more cover use and more night use [8]. Neighbor pressure is unknown, so let the user set a public/private pressure slider. Public land gets +pressure on weekends and holidays.
- **First-sit advantage [R + E]:** follows from the above. Anecdotal harvest logs show most mature bucks killed on the first sit of a stand [23][37]. Recommend: **save "A" stands for the right wind + phase + temperature**. Show "fresh stand" as a positive factor.
- **Cover-shift response:** under high pressure, weight thick-cover interior and corridor sets up, and field-edge sets down. MSU: bucks avoided crops on high-risk days and used plots at night [8].
- **Intrusion cost:** every walk-in that leaks scent into bedding or corridor cells adds pressure to those cells (decays over 3–5 days). The route optimizer (§9.5) minimizes this. Scouting and camera checks in core areas count as pressure too [E].
- **Mobile vs sedentary bucks [R]:** about ⅓ of MSU adult bucks had two seasonal ranges averaging 4.4 mi apart. Some vanish seasonally for reasons that have nothing to do with pressure [8]. Explain this in the UI so users don't over-attribute.

---

## 8. Stand placement rules of thumb (to encode as constraints and penalties)

| Rule | Value | Tag / source |
|---|---|---|
| Distance from buck bedding (timber / hill) | **75–150 yd** is typical. **100–200 yd** in forested terrain. | [E] [38][41] |
| Distance from buck bedding (marsh / tight cover, pre-hung, perfect access) | 30–100 yd | [E] [38] (Infalt style) |
| Pressured deer, marginal wind, weak access, many exits | 150–300 yd | [E] [41] |
| Daylight use radius | Many mature bucks stay within about 300–400 yd of the bed in daylight | [E] [41] |
| Offset from the trail or funnel center | **15–25 yd, downwind side**, broadside to travel | [E] [67] |
| Shot distance design | 10–30 yd (optimum 15–25) | [E] |
| Stand height | 17–22 ft on flat ground. On a slope, measure height relative to the *uphill* trail. Lower is fine with good background cover. | [E] |
| Tree | Live, ≥10–12" DBH. Back cover (multi-trunk, cedar, oak that holds leaves, neighboring trunks). Not skylined. | [E] |
| Sun | Avoid facing the low sun: AM sun (az ~100–130° in Oct–Dec) behind or beside you, PM sun (az ~230–260°) likewise. Penalize when the expected deer approach bearing is within ±30° of sun azimuth while sun elevation is <15°. | [E] |
| Crosswind | Wind ⟂ travel. Plume into a deer-free zone. | [E] [30][34] |
| Morning vs evening | Morning: bedding-edge and staging sets, entered well before light; bucks returning from food [36][38]. Evening: staging and food-edge sets, and corridors 100–300 yd off the food. Afternoon sits at beds are "nearly impossible" (deer already bedded) [36]. Late season: evenings [36]. | [E] |
| Rut midday | 9 AM – 2 PM in funnels between doe bedding areas, saddles, hubs [8] | [R]+[E] |
| Pre-hung or saddle, silent setup | Prefer quiet setups near beds [36][38] | [E] |
| Eberhart's priority list (pressured deer) | Primary scrape areas, fruit/mast trees, inside bedding areas, bedding-to-bedding and terrain funnels, cover protrusions into fields, scrape-lined runways, narrow draws into fields, bed-to-feed funnels, rub clusters, runway convergences, water (where scarce) [43] | [E] |

---

## 9. Proposed scoring model

### 9.1 Inputs
| Layer | Source | Derivatives |
|---|---|---|
| DEM | USGS 3DEP 1 m lidar where available, else 1/3" (10 m) [62] | slope, aspect, TPI (50/150/500 m), relative slope position, plan/profile curvature, TRI, geomorphons [59], flow accumulation/direction, valley depth, hillshade(t), sky-view |
| Hydrography | NHDPlus HR flowlines and waterbodies [63] | stream order, confluence nodes (hubs), crossings, river stage for flooding |
| Land cover | NLCD (latest), USDA CDL (annual crop type) [61], NAIP/Sentinel-2 NDVI, user edits | cover class, screening-cover proxy, edges, inside corners, cover-strip width, oak/cedar proxy |
| Human disturbance | OSM/TIGER roads, buildings, trails (Katy Trail), public-land parking and access (MDC areas) | distance-decay disturbance raster |
| Weather | NWS NDFD / HRRR hourly: wind10m speed/dir, gusts, temp, cloud, precip, pressure | ground wind (WAF), thermal model, temp anomaly vs NOAA normals, 4-h Δp, front detection |
| Astronomy | sunrise/sunset, sun az/el, moon (display only) | legal light, hillshade(t), sun-glare penalty |
| Calendar | rut-phase table (§1.2, editable), MDC portions (§1.1) | phase weights, pressure periods |
| User data | stands, sit log, parking, observed beds, scrapes, rubs, trails, camera hits, harvests, mast trees, field states | calibration, pressure, overrides |

### 9.2 Outputs
1. `P_bed_buck[wind_bin]`, `P_bed_doe` rasters (§4.4).
2. `Corridor_current[phase, daylight]` plus trail polylines and a pinch-point list (§4.5).
3. `StandScore[stand_or_cell, wind_bin, AM/PM, phase]` (§9.4).
4. `EntryRoute[stand, t_entry]` and `ExitRoute[stand, t_exit]` with a scent-intrusion cost (§9.5).
5. `HuntRating[day, AM/PM/midday, stand]` (§9.6), with a plain-language "why".

### 9.3 Candidate stand generation
```
candidates = cells where:
   tree_cover(c) and not open field interior
   and corridor_current within 10-30 yd of c is in top 20th percentile  (daylight R)
   and dist(c, P_bed_buck node edge) >= 60 yd (timber) or >= 30 yd (marsh/thick grass)
   and dist(c, road/house) >= 100 yd
non-max suppression: keep best per 60 yd radius
```

### 9.4 Stand suitability for a given wind and time
```
StandScore(s, wind_dir, wind_spd, t) =
    Opportunity(s,t) * ScentSafety(s,t) * ShotGeom(s) * AccessQuality(s,t) * SunPenalty(s,t)

Opportunity(s,t) = Σ_paths  flow(path,t) * 1[path passes within 10-30 yd of s]
                   # flow from corridor current, weighted by phase:
                   # AM: food->bed flows (deer returning); PM: bed->food flows; rut: bed<->bed flows, all-day
                   + hub_bonus + saddle_bonus + inside_corner_bonus + scrape/rub user pins (rut-weighted)

ScentSafety(s,t) = exp( - k1 * ∫plume(s,V_eff(t)) * P_bed_buck        # smelling bedding
                        - k2 * ∫plume * Corridor_current(t)              # smelling the approach
                        - k3 * ∫plume * ActiveFood(t) )                  # smelling food (PM)
                   * P(wind within acceptable arc over sit window)      # forecast spread
   # plume = cone(half_angle(wind_spd, stability), decay λ), direction = V_eff at stand height
   # (use 20-ft wind with partial canopy factor for elevated stand; thermals matter less aloft
   #  in wind > 5 mph, but falling evening thermals still sink scent - add downslope drift term)
   # special: approach of downwind-cruising bucks -> add a virtual path offset 20-60 yd downwind
   #          of each high-flow trail; its overlap with plume is heavily penalized  [E, Kenyon]

ShotGeom(s) = 1 if main trail offset 15-25 yd & roughly broadside, decays outside 10-35 yd
AccessQuality(s,t) = exp(-k4 * route_cost(s,t))  from §9.5
SunPenalty(s,t) = 0.8 if expected approach bearing within ±30° of sun az with sun_el < 15°, else 1
```
Precompute StandScore for 16 wind bins × {AM, midday, PM} × phase. At runtime, look it up and blend by forecast probability over the bins.

### 9.5 Entry / exit route (time-dependent least-cost path)
```
cost(step from a to b at time τ) =
    walk_time(a,b)                                      # Tobler: v = 6·exp(-3.5·|tanθ + 0.05|) km/h [58]
  + α_vis   * visibility_to_deer(b,τ) * open(b)          # crossing open ground near P_bed/ActiveFood
  + α_sky   * skyline(b)                                 # ridge crest silhouette
  + α_noise * brush_density(b)                           # thick brush = noise
  + α_scent * ∫ plume(b, V_eff(τ)) * [ P_bed_active(τ) + ActiveFood(τ) + Corridor(τ) ]
  + α_trail * Corridor_current(b)                        # ground scent on deer trails
  + α_bed   * P_bed_buck(b)^2                            # never walk through beds
  - β_water * in_creek_channel(b)                        # creek bed walking masks scent/sound [E]
  - β_edge  * downwind_field_edge(b)                     # walk the downwind edge of fields
  - β_shield* terrain_shielded_from_bedding(b)           # behind a ridge / below a bench lip
where P_bed_active(τ): morning entry (pre-light) -> deer are on FOOD or moving back -> weight ActiveFood high,
                      P_bed moderate; evening entry (2-3 h pre-sunset) -> deer BEDDED -> weight P_bed high.
Exit: evening exit after dark -> deer are ON FOOD -> avoid fields (plume + visibility) -> exit via back side;
      morning exit (late AM) -> deer bedded -> avoid bedding plumes.
```
- Algorithm: A* on a 5–10 m grid, with a time-expanded state if the walk crosses a thermal transition. Otherwise use the V_eff at the mid-walk time.
- Return the top 2 routes. Flag any route where cumulative scent overlap with P_bed exceeds a threshold ("this stand is not huntable on this wind/time").
- Sturgis walks ½ h out of his way for a 10-min access [36]. Weight α_scent and α_bed high relative to walk_time (e.g., 1 min of walking ≈ 1% bedding overlap).

### 9.6 Daily / period hunt rating
```
HuntRating(stand|property, day, period) = 100 * clamp(
      Phase(day)                       # 0.40-1.00 from table below   [R/E]
    * TOD(period, phase)               # AM 1.0, PM 1.0 (PM 1.05 early/late season), midday 0.3 / rut 0.75  [R]
    * Weather(day, period)             # clamp 0.75-1.25 (see below)  [R-w]
    * Pressure(stand, day)             # stand_freshness * stand_pressure * property_pressure  [R]
    * SetupFit(stand, forecast wind)   # max StandScore normalized; P(wind in arc)  [E]
, 0, 1)

Phase (central MO defaults; archery-legal only):
  Sep15-Oct5 0.55 | Oct6-Oct22 0.45 | Oct23-Oct31 0.70 | Nov1-Nov7 0.90 | Nov8-Nov13 1.00
  Nov14-24 (archery closed; if firearms permit w/ bow: 0.85) | Nov25-Dec5 0.60 | Dec6-Dec15 0.60
  Dec16-Jan15 0.45 (+ up to 0.25 via cold bonus below)

Weather multiplier (multiply terms, then clamp):
  temp:  ΔT = forecast_high - normal_high (°F)
         f_T = 1 + clamp(-0.015*ΔT, -0.15, +0.18)          # 10°F below normal → +15%
         late season (Dec16+): extra +0.10 per 10°F below normal, cap +0.25 (food urgency)  [E/R-w]
         heat: if period temp > 75°F: ×0.85; > 82°F: ×0.75                   [R]
  front: first AM/PM after cold-front passage (wind veers to W/NW, ΔT24h ≤ -10°F, Δp rising)
         ×1.05 (small; temp term already captures most)                     [E/R-w]
  rain:  steady rain in window ×0.85 (bucks), drizzle ×0.95; first dry period after ≥12 h rain ×1.05  [R/E]
  wind:  ground wind 4-15 mph ×1.0; 0-3 ×0.97 (movement) but see SetupFit (swirl);
         15-20 ×0.92; >20 ×0.88                                           [R-w]
  pressure: 4-h Δp; ignore absolute. |Δp4h| > 2 mb → ×0.97-1.03 by sign (rising +) — optional  [R-w/F]
  moon: ×1.00 (show phase/solunar for users who ask, labeled "no measurable effect in GPS studies")
```
**Why-text example:** "82: peak seeking phase (+), 9°F below normal (+), stand unhunted 8 days (+), NW 8 mph fits Stand B (plume over the bluff); steady rain after 3 PM (−)."

### 9.7 Calibration and validation
- Priors = the weights above. Update from the user's data:
  - Logistic regression / RSF on marked beds, camera detections, and sightings vs. random available points.
  - Sit log outcomes (deer seen, bucks seen, time of day), modeled as a Poisson regression on the rating's components.
- Store per-property coefficients with shrinkage toward the priors (hierarchical).
- Quick sanity checks: predicted pinch points vs. trail-camera traffic; predicted beds vs. winter scouting (post-season bed hunts are the cheapest ground truth).
- Missouri research resource: MDC/MU GPS-collar work on about 600+ deer in north and south MO (dispersal, 90% under 10 mi) [53], plus the step-selection paper on Missouri juvenile males using landcover and topography covariates [53]. Consider asking MDC for covariate effect sizes.

---

## 10. Open questions / caveats
- The **thermal timing lag in MO hollows** (1–3 h) is an estimate. Validate with a cheap anemometer/smoke log per property and learn a per-property `lag(c)`.
- **Scent detection distance** has no dose–response science. λ is a tunable guess; tune it from "busted" events in the sit log.
- **Leeward bedding / wind-at-back / J-hook** are expert-consensus behaviors with no controlled GPS validation. Keep their weights moderate and user-adjustable.
- **Rut dates** vary by year and doe age structure. Let users shift the phase table ±7 days using camera evidence (first chasing, scrape activity).
- CRP polygons are not public (FSA). Infer them from imagery and CDL, and let users confirm.

---

## Sources
1. MDC — 2026–2027 deer & turkey dates: https://mdc.mo.gov/newsroom/mdc-sets-deer-turkey-hunting-dates-2026-2027-seasons
2. MDC Field Guide — White-tailed deer: https://mdc.mo.gov/discover-nature/field-guide/white-tailed-deer
3. Reproductive characteristics of female white-tailed deer in the Midwestern USA (Theriogenology 2017): https://www.sciencedirect.com/science/article/pii/S0093691X1730078X
4. MU Extension G9479 — Ecology and Management of White-Tailed Deer in Missouri: https://extension.missouri.edu/publications/g9479
5. MDC — Deer food and water needs: https://mdc.mo.gov/improve-your-property/wildlife-management/deer-management/deer-food-water-needs
6. MDC — Deer cover needs: https://mdc.mo.gov/improve-your-property/wildlife-management/deer-management/deer-cover-needs
7. MU Extension G9494 — Early successional vegetation for deer: https://extension.missouri.edu/publications/g9494
8. MSU Extension P3927 — Understanding Buck Movement (MSU Deer Lab GPS data): https://extension.msstate.edu/sites/default/files/publications/P3927_Buck%20Movement_web_rev.pdf
9. MSU Extension P4068 — Lunar Legends: Does the Moon Influence Buck Activity?: https://extension.msstate.edu/sites/default/files/publications/P4068_Lunar_web.pdf
10. MeatEater/Wired to Hunt — New research confirms the moon doesn't affect deer movement: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/new-research-confirms-the-moon-doesnt-affect-deer-movement
11. Webb et al. 2010, Int. J. Ecology — Fine-scale deer movements and environmental influences (GPS): https://onlinelibrary.wiley.com/doi/10.1155/2010/459610
12. Penn State Deer-Forest Study — Wandering in the moonlight: https://deer.psu.edu/wandering-in-the-moonlight
13. Penn State Deer-Forest Study — Spidey sense (storms/fronts): https://www.deer.psu.edu/spidey-sense/
14. NDA — Does weather impact deer movement?: https://deerassociation.com/does-weather-impact-deer-movement/
15. NDA — Cold fronts and bucks: https://deerassociation.com/hunting-cold-fronts/
16. Goethlich 2019, Auburn M.S. thesis — Effects of abiotic factors on white-tailed deer activity in South Carolina: https://etd.auburn.edu/handle/10415/7077
17. Deer & Deer Hunting — How wind affects deer movement: https://www.deeranddeerhunting.com/content/articles/wind-affects-deer-movement-hunting
18. Hunsaker et al. 2025, Ecology & Evolution — Breeding season movement of male deer, SW Wisconsin: https://pmc.ncbi.nlm.nih.gov/articles/PMC12240682/
19. NDA — Is the lockdown phase a myth?: https://deerassociation.com/lockdown-phase-myth/
20. NDA — 9 things we know about deer excursions: https://deerassociation.com/now-you-see-him-9-things-we-know-about-deer-excursions/
21. NDA — The two best times to see deer: https://deerassociation.com/best-times-to-see-deer/
22. Field & Stream — Do bucks really go nocturnal? (McCoy/Auburn, Strickland): https://fieldandstream.com/stories/hunting/deer-hunting/whitetail-hunting/nocturnal-whitetail-bucks-science
23. NDA — The power of the first sit: https://deerassociation.com/power-first-sit/
24. NDA — Intercept bucks in daylight: lessons from GPS-collar research: https://deerassociation.com/to-intercept-bucks-in-daylight-take-lessons-from-gps-collar-research/
25. Spatiotemporal patterns of male and female deer on a hunted landscape (Brosnan Forest): https://pmc.ncbi.nlm.nih.gov/articles/PMC9465197/
26. MeatEater — Does temperature affect deer movement?: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/does-temperature-affect-deer-movement
27. MeatEater — Does barometric pressure affect deer movement?: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/does-barometric-pressure-affect-deer-movement
28. Outdoor Life — Dr. Grant Woods on rut, weather and deer activity: https://www.outdoorlife.com/hunting/weather-hunting-the-rut/
29. QDMA Canada — Buck use of scrapes (camera research): https://www.qdma.ca/en/2014-03-27-13-07-39/what-we-do/deer-biology-management/104-buck-use-of-scrapes-what-the-latest-research-reveals/
30. Mark Kenyon — How to use the wind to hunt mature bucks: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-use-the-wind-to-hunt-mature-bucks
31. Mark Kenyon — Using terrain and topography on new properties: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-use-terrain-and-topography-to-hunt-new-properties
32. Wired to Hunt — How to hunt a thermal hub: https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-hunt-a-thermal-hub
33. onX — Hunting thermals / thermal hubs: https://www.onxmaps.com/hunt/blog/hunting-thermals
34. Jeff Sturgis — Morning thermal advantage: https://www.whitetailhabitatsolutions.com/blog/morning-thermal-deer-hunting-advantage
35. Jeff Sturgis — Evening thermal hunting tips: https://www.whitetailhabitatsolutions.com/blog/evening-thermal-hunting-tips-for-fooling-whitetails
36. Jeff Sturgis — How to hunt a deer bedding area: https://www.whitetailhabitatsolutions.com/blog/how-to-hunt-a-deer-bedding-area
37. Jeff Sturgis — First sit strategy: https://www.whitetailhabitatsolutions.com/blog/first-sit-for-whitetails-strategy
38. Realtree — How to hunt big buck bedding areas: https://realtree.com/deer-hunting/articles/how-to-hunt-big-buck-bedding-areas
39. Realtree — Are south slopes overrated in the late season?: https://realtree.com/brow-tines-and-backstrap/are-south-slopes-overrated-in-the-late-season
40. Realtree — Hunting thermals, explained by a meteorologist: https://realtree.com/bowhunting/how-to-hunt-thermals
41. ArcheryHunting.com — Hill country buck bedding: wind, thermals, terrain: https://archeryhunting.com/hill-country-buck-bedding-how-wind-thermals-and-terrain-shape-mature-buck-beds/
42. Outdoor Life — Inside the mind of Dan Infalt: https://www.outdoorlife.com/hunting/dan-infalt-deer-hunting-tips/
43. John Eberhart — Bowhunting Pressured Whitetails / Eberhart's Whitetail Workshop: https://www.eberhartswhitetailworkshop.com/ ; https://www.amazon.com/Bowhunting-Pressured-Whitetails-Expert-Techniques/dp/0811728196
44. Zardi & Whiteman 2013 — Diurnal Mountain Wind Systems (chapter): https://atoc.colorado.edu/~cassano/atoc4500/lecture_notes/2013_zardi_whiteman.pdf
45. Royal Meteorological Society — Anabatic and katabatic flow: https://www.rmets.org/metmatters/anabatic-and-katabatic-flow-metmatters-guide-mountain-winds
46. NWCG — Estimating winds for fire behavior (wind adjustment factors): https://www.nwcg.gov/publications/pms437/weather/estimating-winds-for-fire-behavior
47. US EPA — Meteorological Monitoring Guidance for Regulatory Modeling Applications (EPA-454/R-99-005; σθ stability classes): https://www.epa.gov/sites/default/files/2020-10/documents/mmgrma_0.pdf
48. USFS Missoula Fire Lab — WindNinja: https://www.firelab.org/project/windninja
49. USDA NASS — Missouri crop progress and condition reports: https://www.nass.usda.gov/Statistics_by_State/Missouri/Publications/Crop_Progress_and_Condition/
50. MDC — Missouri oaks: https://mdc.mo.gov/trees-plants/tree-and-plant-facts/tree-shrub-and-vine-facts/missouri-oaks
51. ABC17 — Ameren/MDC ending public access to part of Reform CA (2025): https://abc17news.com/news/top-stories/2025/06/03/ameren-conservation-department-ending-public-access-to-part-of-callaway-county-conservation-area/ ; MDC area page: https://mdc.mo.gov/discover-nature/places/reform-conservation-area
52. MDC — 2013 Oak Mast Survey Report (method; annual survey): https://mdc.mo.gov/sites/default/files/mdcd7/research_papers/2013_Oak_Mast_Survey_Report.pdf
53. MDC/MU deer GPS study (Conservationist): https://mdc.mo.gov/magazines/conservationist/2016-10/studying-white-tailed-deer-digital-age ; Scale-dependent habitat selection of dispersing deer in Missouri (Landscape Ecology 2024): https://link.springer.com/article/10.1007/s10980-024-01879-z
54. Sci. Reports 2024 — Deer limit spatio-temporal overlap with hikers: https://www.nature.com/articles/s41598-024-84000-3
55. Hunting intensity alters movement behaviour of white-tailed deer (Basic & Applied Ecology): https://www.sciencedirect.com/science/article/pii/S1439179115001668
56. How far can deer smell? (compiles MSU Deer Lab claims): https://www.ilearntohunt.com/blog/how-far-can-deer-smell/
57. Iowa Environmental Mesonet — KCOU wind rose tool: https://mesonet.agron.iastate.edu/sites/windrose.phtml?station=COU&network=MO_ASOS
58. Tobler's hiking function: https://en.wikipedia.org/wiki/Tobler%27s_hiking_function
59. Jasiewicz & Stepinski 2013 — Geomorphons (Geomorphology): https://doi.org/10.1016/j.geomorph.2012.11.005
60. Circuitscape / Omniscape: https://circuitscape.org/
61. USDA NASS Cropland Data Layer: https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php
62. USGS 3D Elevation Program: https://www.usgs.gov/3d-elevation-program
63. USGS National Hydrography (NHDPlus HR): https://www.usgs.gov/national-hydrography
64. Weather Spark — Columbia, MO climate: https://weatherspark.com/y/10940/Average-Weather-in-Columbia-Missouri-United-States-Year-Round ; NOAA normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
65. onX — Scouting oak tree acorns: https://www.onxmaps.com/hunt/blog/oak-tree-acorns
66. American Hunter — Deer stand burnout (McCoy/Auburn GPS): https://www.americanhunter.org/articles/2015/10/27/deer-stand-burnout-can-you-avoid-it/
67. Bowhunting.com — Tips for treestand placement (funnel offset): https://www.bowhunting.com/bowhunt101/treestand-placement-2/
