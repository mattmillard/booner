# 07 — Seasonal Patterns, Sep → Jan: How Deer Change and How the Bowhunter Must Follow (Central Missouri)

Scope: Callaway / Cooper County, about 38.8°N. The landscape is Missouri River bottoms (large corn/soy fields), upland ag fields (soybeans, corn, winter wheat, hay/alfalfa), oak-hickory ridges and hollows, CRP/NWSG, and cedar. This doc goes deeper than doc 05 §1 (calendar), §5 (food) and §6 (weather/moon), and doc 06 §4.5 (phase scheduler). Where the numbers differ, **this doc supersedes them on seasonal timing and food**. Written 2026-09-27.

**Evidence tags** (same as docs 05/06)
- **[R]** Peer-reviewed, agency or university data (GPS collars, fetal aging, NASS statistics). Strong.
- **[R-w]** Research exists, but the effect is weak or inconsistent, or the study is from another region or species.
- **[E]** Expert consensus (NDA biologists, Eberhart, Infalt, Sturgis, May, The Hunting Public, Winke). Widely practiced, not formally tested.
- **[F]** Folklore, or claims that research contradicts.
- **[I]** My inference or synthesis. Treat it as a tunable default.

Numbers in brackets like [12] point to the Sources list at the end.

---

## 0. Takeaways (read first)

1. **Peak breeding is fixed by photoperiod. Anchor everything to P = Nov 13 (±3 d) for central MO.** MDC: breeding "peaks each year in mid-November" [1] [R]. Illinois fetal data (n = 4,781 fetuses): mean conception Nov 10, adults and yearlings Nov 8–11, doe fawns Dec 2 [2] [R]. An older Missouri study put adult peak breeding at Nov 16 [2, citing Hansen, Beringer & Schulz] [R]. The moon, weather and hunters do not move P [23][24] [R].
2. **Crops move deer more than the calendar does from mid-Sep to early Nov.** In central MO, soybean leaf drop and harvest, and corn harvest, happen between Sep 20 and Nov 10 (§1.3) [6] [R]. Each harvested field instantly removes a food source and, for corn, a cover source. The app should model field state explicitly, not by date alone.
3. **The late-September soybean-at-dusk pattern ends when the leaves yellow.** Statewide, MO soybeans reach 50% dropping leaves around Sep 29 on average. In **2026 the crop is about a week early: 52% on Sep 20, vs a 42% average** [6][7] [R]. White oak acorn fall peaks in the same window (Sep 25–Oct 10) [10] [R]. So expect the evening bean-field pattern to collapse in the first days of October 2026.
4. **The "October lull" is a hunter lull, not a deer lull.** Buck movement is flat from late September through the first 3 weeks of October, then rises steeply from about Oct 20 [14][15] [R]. Daylight sightings fall because deer are in the timber on acorns, crops come off, and pressure starts [I].
5. **Buck movement peaks from P−7 to P. Scraping peaks around P−14.** Scraping peaks about 2 weeks before peak breeding and nearly stops once breeding is widespread [19][20] [R]. In SW Wisconsin, peak male movement ran Oct 23–Nov 12, and the highest hourly movement came Nov 5–11 [13] [R]. At peak rut, day and night movement rates converge [12], and about 70% of excursions happen in daylight [16] [R].
6. **2026 MO archery is closed Nov 14–24**, which covers P to P+11 (firearms portion) [43]. For an archery-only hunter, the best windows are **Oct 28 – Nov 13** (scrapes, seeking, chasing) and **Nov 25 – Dec 15** (post-rut, second rut).
7. **Late season is a food-and-cold game.** From mid-December, energy-dense food (standing beans or corn, waste grain, brassicas, green wheat, red oak acorns) near thermal cover, hunted in the evening, beats everything else. Cold departures from normal push feeding into daylight [4][27][32] [R/E].
8. **Moon: weight 0, but record it.** There is no effect on breeding dates (7-state UGA analysis that includes Missouri; New Brunswick; Dye et al.) [23][24] [R]. There is no effect on buck movement (MSU GPS) [12][42] [R].

---

## 1. Calendar backbone for 38.8°N

### 1.1 Sun and photoperiod (computed for Fulton, 38.85°N, 91.95°W)
| Date | Sunrise | Sunset | Day length | Note |
|---|---|---|---|---|
| Sep 15 | 06:48 CDT | 19:18 | 12.5 h | Archery opens |
| Oct 1 | 07:02 | 18:52 | 11.8 h | |
| Oct 15 | 07:16 | 18:31 | 11.3 h | |
| Oct 31 | 07:33 | 18:10 | 10.6 h | |
| **Nov 1** | **06:34 CST** | **17:09** | 10.6 h | **DST ends 2026-11-01**. Evening sits move an hour earlier by the clock. Deer do not change; model in sun-relative time. |
| Nov 15 | 06:50 | 16:56 | 10.1 h | |
| Dec 1 | 07:07 | 16:47 | 9.7 h | |
| Dec 21 | 07:22 | 16:49 | 9.4 h | Earliest sunset is about Dec 7 [I] |
| Jan 15 | 07:25 | 17:08 | 9.7 h | Archery closes |

Legal archery hours are sunrise −30 min to sunset +30 min [43]. **All time-of-day weights in §8 are sun-relative.**

### 1.2 Rut phase table (default P = Nov 13; every date is P-relative and editable)
| Phase | P-relative | 2026 dates | Archery open? |
|---|---|---|---|
| Early season | ≤ P−40 | Sep 15 – Oct 4 | yes |
| October "lull" | P−39 … P−22 | Oct 5 – Oct 22 | yes (early antlerless firearms Oct 9–11 → pressure) |
| Pre-rut (scrape phase) | P−21 … P−8 | Oct 23 – Nov 5 | yes (youth firearms Oct 24–25) |
| Seeking / chasing | P−7 … P−1 | Nov 6 – Nov 12 | yes |
| Peak breeding / tending | P … P+7 | Nov 13 – Nov 20 | **Nov 13 only**, then closed Nov 14–24 |
| Post-rut | P+8 … P+21 | Nov 21 – Dec 4 | from Nov 25 |
| Second rut | P+18 … P+35 | Dec 1 – Dec 18 | yes (late antlerless firearms Dec 5–13 → pressure) |
| Late season | ≥ P+36 | Dec 19 – Jan 15 | yes (alt. methods Dec 26 – Jan 5) |

- The second rut combines adult does that recycle about 28 days after a missed first estrus [21] [R] (so around P+28 = Dec 11) with doe fawns. 20–30% of MO doe fawns breed [3], with a mean conception around Dec 2 [2] [R].
- The phase boundaries are soft. Encode them as overlapping membership functions (§8.2), not hard switches [I].

### 1.3 Missouri crop progress, statewide % (NASS; 2019–2023 five-year average) [6] [R]
| Week ending ≈ | Corn mature | Corn harvested | Soy dropping leaves | Soy harvested | Wheat planted | Wheat emerged |
|---|---|---|---|---|---|---|
| Sep 15 | 52 | 10 | 16 | – | – | – |
| Sep 22 | 70 | 19 | 34 | 2 | 1 | – |
| Sep 29 | 80 | 31 | 51 | 5 | 3 | – |
| Oct 6 | 90 | 45 | 68 | 14 | 10 | 2 |
| Oct 13 | – | 58 | 84 | 28 | 26 | 8 |
| Oct 20 | – | 69 | 93 | 43 | 42 | 17 |
| Oct 27 | – | 77 | – | 57 | 55 | 31 |
| Nov 3 | – | 83 | – | 69 | 68 | 45 |
| Nov 10 | – | 90 | – | 81 | 81 | 61 |
| Nov 17 | – | 93 | – | 89 | 90 | 74 |
| Nov 24 | – | – | – | 95 | 95 | 84 |

**Current year (NASS national Crop Progress, week ending Sep 20, 2026; the 2021–2025 average is in parentheses)** [7] [R]: corn mature 79 (76), **corn harvested 32 (23)**, **soy dropping leaves 52 (42)**, soy harvested 7 (4), wheat planted 2 (2). **2026 is running about 5–8 days ahead of normal on corn harvest and soybean senescence** [I, derived]. The next report is Sep 28. The app should pull it weekly (§8.4).

Notes:
- The Missouri *state* weekly PDF series stopped after May 2025. The national weekly report still carries Missouri rows [6][7] [R]. The Oct–Nov 2025 national reports were also disrupted by the federal shutdown, so fall-2025 has gaps [I].
- Statewide numbers include the Bootheel (earliest) and the north (latest). Central MO should sit close to the state mean. **Missouri River bottom fields are often harvested later in wet years** (access and flooding) [I]. Let the user override field state.

---

## 2. Food calendar, Sep → Jan

### 2.1 Why the diet shifts (nutrition logic)
- **Protein demand falls and energy demand rises in fall.** Adults need only 6–10% crude protein (CP) for fall/winter maintenance, vs 14–22% in summer. In fall deer "seek foods with high levels of carbohydrates" to lay down fat, and in winter they select energy-rich over protein-rich foods [4] [R].
- **Late summer and winter are "the most nutritionally stressful times"** [4] [R]. By mid-September native forbs are mature and lignified. Green soybean leaves (CP around 19–30%, very digestible, high moisture) are the best forage on the landscape [4][31][44] [R].
- **Acorns and corn are low in protein and high in energy**, which makes them fall and winter staples [4] [R]. Rumen studies: acorns make up **76–90% of the autumn diet when available** [10, citing Harlow 1975 and McCullough 1985] [R]. Across the range, autumn is the only season when mast (28%) is a large share of the diet [11] [R].
- **Deer are small-rumen concentrate selectors.** They cannot live on low-quality forage and switch quickly to whatever is most digestible and palatable [11] [R]. Expect a sharp switch to a new food within days of it becoming available, not a gradual drift [I].

### 2.2 Week-by-week food table (central MO; defaults for the app) [I, built on the cited facts]
| Window | Primary draw (in order) | Secondary | What changes deer movement |
|---|---|---|---|
| **Sep 15–25** | Green soybean leaves (R5–R6); alfalfa/clover; early white oak drop | Persimmon (not ripe yet), apples, browse | Evening bean-field pattern at its strongest. Corn harvest starts in the bottoms (32% statewide by Sep 20, 2026). |
| **Sep 26–Oct 5** | **White oak acorns (peak fall)**; soybeans at yellowing lose pull | Alfalfa, clover, apples, early persimmon | Leaf drop passes 50% (Sep 29 avg; about Sep 20 in 2026). Deer shift into the timber. Corn harvest 30–45%. |
| **Oct 6–15** | White oak (ground density falls 4× within 2 weeks of peak) → **red/black oak starts**; harvested bean and corn fields (waste grain) | Persimmon (ripening), honey locust, alfalfa | Soy harvest 14 → 28%, corn 45 → 58%. Winter wheat planting starts. The first 32°F frost comes around the third week of October [34]. |
| **Oct 16–31** | Red oak acorns; waste corn and beans; fresh-emerged wheat (patchy); clover/alfalfa | Persimmon after frost, honey locust, browse | Soy harvest 43 → 57%, corn 69 → 77%. Standing-corn cover is disappearing. Does still feed on the best food, and **does are where the bucks will go**. |
| **Nov 1–15** | Whatever does are eating: red oak, green wheat, alfalfa, waste grain, brassica plots | Browse (greenbrier, coralberry, honeysuckle) | Mostly harvested (soy 69 → 81%, corn 83 → 90%). Bucks lose food focus (§4). |
| **Nov 16–30** | Green wheat, brassicas (after a hard frost), alfalfa regrowth, red oak | Standing beans or corn if any, browse | Post-rut bucks return to food. Cold snaps push feeding earlier. |
| **Dec 1–31** | **Standing soybeans / corn (if any) >> brassica bulbs and tops > green wheat/rye > waste corn > red oak** | Honey locust pods, persimmon remnants, Japanese honeysuckle, greenbrier, coralberry, sumac fruit | Energy demand plus cold. Evening feeding moves into daylight on cold afternoons. |
| **Jan 1–15** | Same as December. Standing beans are the top attractor in the Midwest. | Browse carries the load where grain is gone | Activity is at its annual low (energy conservation) [27] [R]. |

### 2.3 Soybeans: the late-September pattern and why it breaks
**Why deer pile into beans right before dusk in late September** (a synthesis):
1. **Nutrition.** Green leaves are the highest-quality forage available at the worst time of year for native forage [4][31][44] [R]. MU Extension: deer eat soybeans "from germination to yellowing; pods are eaten … throughout the winter if not harvested" [3] [R].
2. **Timing is crepuscular plus risk-managed.** Adult bucks enter food plots "at greater rates right around sunset". Use of food plots and feeders is 2–5× higher at night than by day [12] [R]. Open fields are high-risk, so daylight use is compressed into the last 30–45 min of light [I].
3. **Heat.** Minnesota deer were active at 6–16°C (43–61°F) and less active above that [27] [R]. In the second half of September, highs are often 75–85°F in central MO, so movement shifts toward last light [I].
4. **Social.** Summer bachelor groups are still intact until mid/late September and feed on the same fields [22] [E].

**When the pattern breaks** [R for the crop dates; E/I for the behavior]:
- **Yellowing (R7).** Leaf moisture falls from about 60% to about 15% and leaves wilt and drop. There is a 1–2 week window where "the leaves won't be as appetizing and the beans aren't quite fully mature" [29] [E]. A Clemson crop physiologist notes that in drought or at high deer density, deer will eat any stage [29] [E].
- The break coincides with the **white oak drop** (peak Sep 25–27 at 38.9°N; 81–92% of acorns fell Sep 14 – Oct 14) [10] [R]. It is a *choice* toward acorns, not an aversion to beans [29] [E].
- **Leaf drop to mature, standing pods.** There is modest evening use of pods. Soybean seed is about 35–40% CP and very energy-dense [31] [E]. Standing beans regain strong attraction **only once other food fades (late Nov – Jan)** [30][31] [E].
- **Harvest.** Waste beans draw evening use for some days to weeks. But a cut field is short, open and "a nutrition desert" relative to its green state [12] [R]. Daylight use near the middle of big bottom fields goes to about zero [I].

**App rule:** in a normal year, the bean-field pattern for a given field is worth weighting heavily only while that field is green: from about Sep 15 to NASS "dropping leaves" ≈ 40–50%, minus about 7 days for yellowing [I]. For 2026, that window has essentially closed by **about Sep 25 – Oct 1**, so evening bean sits should get a low weight from October on unless the user logs green beans.

### 2.4 Corn: food and cover
- Deer eat "dented corn during the fall and winter" [3] [R].
- **Standing corn is cover as much as food.** It "offers the deer more places to bed and feed during daylight, therefore making natural bedding areas less of a destination" (Eberhart) [30] [E]. Nebraska study: female home ranges **grew about 32% after corn harvest** as deer looked for new food and cover (VerCauteren & Hygnstrom 1998, JWM 62:280, from a secondary summary [28]) [R; verify magnitude].
- **Harvest is a step change.** Cover drops to zero overnight. Deer that bedded in the corn relocate to permanent cover: wooded draws, river-bottom timber, CRP, cedar thickets [28] [R/E]. Scrape areas and edges beside standing corn get daylight buck use that disappears after harvest [30] [E].
- Late season: **standing corn is the top food and cover combination** where a farmer leaves it. Harvested corn keeps moderate evening value from waste grain (varies with harvest efficiency) [I].

### 2.5 Acorns: white vs red, mast years, and how deer choose between acorns and ag
- **White oak group** (white, post, bur, chinquapin, swamp white) matures in one season and drops mid-Sep to mid-Oct. It is lower in tannin and preferred [9][E]. **Red oak group** (northern red, black, scarlet, shumard, pin, blackjack) takes two seasons, drops mostly Oct – Nov, and persists because tannin preserves it [9] [R/E]. White oaks germinate in fall, so what they leave rots or sprouts; reds stay available into winter [E].
- **Timing data at our latitude.** Front Royal, VA (38.9°N) collected mast weekly: 81–92% fell Sep 14 – Oct 14, and peak mast fall came within 3 days (Sep 25–27) across 4 samples. Ground density fell 4.4× on average in the 2 weeks after peak. By November, >90% of the acorns left on the ground were weevil-infested [10] [R]. *Missouri adjustment:* red oak drop runs later than VA pooled data suggest. Model the red peak around Oct 10 – Nov 5 [I].
- **Deer relocate to mast.** Radio-collared does expanded their home ranges to take in oak stands during mast fall in good years but not in a poor year (1987). Acorn foraging was about 50% of foraging time at peak fall, and pellet-group density in oak stands was 3× higher during peak fall [10] [R].
- **MDC Mast Survey** (annual since 1960; 5 regions of central and southern MO; Mast Production Index MPI 0–300: poor 0–75, fair 76–150, good 151–225, excellent 226–300). Long-term MPI averages are about 126 for white oak and about 135 for red oak. 2012 (drought) collapsed to a white oak MPI of 42 and red oak 78 [8] [R]. **Good crops come about 1 year in 3–4, and only about 30% of big healthy trees bear even in good years** [9] [R]. White and red crops fail independently, because red acorns reflect the previous year's flowering [9] [I/R]. *I could not find a published 2026 MDC mast report. Check MDC in late Sep/Oct, or log a user observation.*
- **Choosing between acorns and ag.** When acorns are abundant they are the primary fall food; otherwise deer eat "corn, lespedeza, wheat, other crops" and native browse [5] [R]. MDC: in poor mast years wildlife "travel a greater distance … and are more likely to feed around agricultural areas and forest edges", which concentrates deer and **raises hunter success**. Good mast years disperse deer and **lower success** [8] [R]. MDC attributed part of the **15% drop in the 2024–25 harvest** to "a bumper acorn crop" (plus a later firearms opener) [37] [R]. European data show the same pattern: oak masting cut ungulate crop damage by about 30–37% [45] [R-w, other species].
- **Encodable consequence:** mast index scales timber food weight up and field food weight down, and vice versa (§8.3).

### 2.6 Other foods
| Food | Window (central MO) | Notes |
|---|---|---|
| Alfalfa / clover | All season until hard freeze; regrowth into Nov | Stays green when everything else browns, so relative attraction *rises* in Oct–Nov [E]. MDC lists alfalfa and clover as preferred [5] [R]. |
| Winter wheat / cereal rye | Planted Oct (10% by Oct 6, 55% by Oct 27, 90% by Nov 17) [6]; emerged 7–14 d later | Useful 2–3 weeks after emergence. **Prime from mid-Nov to Jan**, especially on cold days [I/E]. MDC lists wheat as preferred [5]. |
| Brassicas (turnip, radish, kale plots) | Usually ignored until a hard frost or mid-Nov, then hammered through Jan | UT research: brassicas do **not** get sweeter after frost. Late use reflects fewer alternatives and higher energy demand [32] [R]. |
| Persimmon | Ripens Sep – Oct; drops Oct – winter, many after frost [33] | Point hotspot. Deer check groves daily while fruit falls [E]. |
| Honey locust | Pods drop Sep – Jan; deer use dried pods | Late-season point food [33] [E]. |
| Apples (old homesteads) | Sep – Oct | Point hotspot early season [E]. |
| Browse: greenbrier, sumac, rough-leaf dogwood, coralberry ("buckbrush"), Japanese honeysuckle (evergreen-ish), Korean lespedeza, oak sprouts, blackberry | Year-round; **critical in a mast failure and in late season** | MDC preferred list [5] [R]. Browse sits inside early-successional bedding cover, so late-season bedding and feeding overlap [12] [R]. |

---

## 3. Daily timing by phase (GPS evidence → hunting times)

### 3.1 Research baseline
- **Crepuscular everywhere.** About 60% of adult-buck behavior at twilight is walking or feeding/tending. Bucks are bedded most in daylight and least at dawn and dusk [12] [R]. Peak movement at dawn and dusk holds across seasons and moon phases [18] [R].
- **Early season: night movement dominates.** Hourly movement at night was about **2× the daytime rate early in the hunting season** (warmer temperatures, "thinking like a deer"). **With the onset of breeding, day and night rates became similar** [12] [R].
- **Daily distance by phase** (MSU, Mississippi; adults 2.5–5.5+ years; 15-min fixes): pre-rut about 4,800 yd/day → early rut >7,000 → **peak rut >7,500 (4 mi)** → post-rut about 5,000. Walking time roughly doubles in the rut months. Net 24-h displacement is **1.7× higher** in peak and late rut (about 0.9 mi from start to end of day) [12] [R].
- **Penn State (Pennsylvania):** buck home range grew steadily from about 1 mi² in late September to nearly 4 mi² from late October to mid-November. Buck movement was flat from late September through the first 3 weeks of October, then rose exponentially from the third week of October. Does travel about 1 mi/day throughout. Half of females are bred by Nov 13 every year [14][15] [R]. Movement increased equally across all daylight hours at peak rut, and there was no "lockdown" [17] [R].
- **SW Wisconsin** (188 GPS males, 2017–2020): peak rut Oct 23 – Nov 12 by changepoint, matched by fawn-backdated conception dates. Maximum hourly movement came in the week of **Nov 5–11**. Males 3+ years had the highest variance, alternating between searching and tending, and were *more nocturnal at peak rut* than yearlings. **No significant weather effect** [13] [R].
- **Excursions:** about 60% of bucks make them in fall. They average about 16 h (2 h to several days) and about 1.5 mi (0.25–8 mi). **Maryland: 85% nocturnal before the rut, 70% in daylight at peak, back to 70% nocturnal after** [16] [R]. MSU: excursions clearly peak in the breeding season, and mobile bucks (about ⅓) keep two seasonal ranges an average of 4.4 mi apart [12] [R].
- **Pressure:** in Oklahoma, deer increased daytime cover use by **240% by the second weekend of gun season**, and hunter sightings of collared bucks fell 62% [12] [R].

### 3.2 Phase → when to hunt
| Phase (2026) | Buck daylight movement | Best sit timing | Why |
|---|---|---|---|
| Early (Sep 15 – Oct 4) | Low. Night about 2× day [12]. Concentrated in the last 30–45 min of light. | **Evening** on food or staging. Mornings only with a surgical entry on bed-to-food returns (field-edge mornings bump feeding deer). | Heat; bed → feed pattern; bachelor groups still predictable [22] [E]. |
| Lull (Oct 5 – Oct 22) | Flat movement [14]; daylight sightings drop | **Evening near beds** (within about 100 yd, not food) [Infalt, 46] [E]. Mornings on acorn flats and transitions. Spend few sits and save A-sites [E]. | Deer feed in the timber (acorns). Harvests reshuffle cover. Early antlerless firearms Oct 9–11 adds pressure. |
| Pre-rut (Oct 23 – Nov 5) | Rising fast from about Oct 20 [15]. Scrape peak about Oct 30 [19]. | **Mornings rise to equal or better than evenings.** 3–4 h sits AM (bed-perimeter/doe-bedding downwind) and PM (corridors, staging) [35] [E]. Add midday on cold-front days. | Bucks scent-check doe bedding mid-morning and food downwind edges in the afternoon [E]. |
| Seeking / chasing (Nov 6 – 12) | **Highest.** Day ≈ night per hour [12]; 70% of excursions in daylight [16] | **All-day sits.** 9 AM – 2 PM is productive [12][35] [R/E]. | Maximum travel; bucks moving through funnels between doe groups. |
| Peak / tending (Nov 13 – 20) | Still high but lumpy: tending bouts of 24–48 h per doe [17]; bucks shift focal areas every 6–10 h [12] | All-day in doe-bedding cover (only Nov 13 is open to archery in 2026). | "Lockdown" is a sampling artifact: bucks are with does in cover, not idle [17] [R]. |
| Post-rut (Nov 25 – Dec 4) | Falls back toward about 5,000 yd/day [12]. Mostly evening; still random cruising. | **Evenings on food** with doe groups. Mornings only near doe bedding on cold days. All-day is still worth it on the first cold days [35] [E]. | Recovery feeding; checking the remaining estrus does. |
| Second rut (Dec 1 – 18) | Short bursts around food sources holding doe fawns | **Evenings** over the best food with doe/fawn groups. | Doe fawns come into estrus around Dec 2 [2]; adult recycles around Dec 11 [21]. |
| Late (Dec 19 – Jan 15) | Lowest annual activity (Jan–Feb low) [27]. Feeding shifts earlier on cold afternoons. | **Evenings**, starting 2–3 h before sunset on cold, clear, calm days. Warm mornings after frigid nights are OK near bedding edges [Infalt/Sturgis, doc 06] [E]. | Energy balance: feed in the warmest daylight hours instead of paying thermoregulation costs at night [E]. |

---

## 4. Buck behavior shift, late October → November

### 4.1 Sequence (P = Nov 13)
| Event | Timing | Evidence |
|---|---|---|
| Velvet shed; testosterone rising | Late Aug – mid Sep | [22] [E]. Missouri bucks are typically hard-horned by the Sep 15 opener [I]. |
| Bachelor groups dissolve | Mostly the last 2 weeks of Sep, some into Oct | NDA: groups break "as the rut approaches"; a bachelor pattern "will fade quickly in the pre-rut period" [22] [E] |
| Rubbing | From velvet shed. Peaks in pre-rut, then stays at that level through breeding | [20] [R/E] |
| Scraping | Starts several weeks after the first rubs. **Peaks about 2 weeks (2–3 weeks) before peak breeding → around Oct 27 – Nov 1.** Nearly stops once breeding is widespread; late-Nov marking almost ceases | UGA (Miller; Alexy video study) [19][21] [R] |
| Scrape visits at night | **About 85% at night**. Mature bucks rarely showed up on scrape cameras during season | [19][20] [R] |
| Home range expansion | Late Sep about 1 mi² → about 4 mi² late Oct – mid Nov (PA) | [14] [R] |
| Movement takeoff | About the 3rd week of Oct (P−21) | [15] [R] |
| Peak searching and travel | P−7 … P (Nov 6–13); highest hourly movement in week P−8…P−2 in WI | [12][13] [R] |
| Tending | Doe in estrus about 24 h (Noble) to 24–48 h (NDA). Bucks with does are hard to see, but not "locked down" | [17][21] [R] |
| Post-rut recovery | About P+7 onward. Bucks eat more, bed more, walk less | [12] [R] |
| Second estrus / doe fawns | About P+18 … P+35 | [2][21] [R] |

### 4.2 Where bucks go as the food focus fades
- **Food still anchors the does, and does anchor the bucks.** Through the rut, map doe bedding and doe food, then put bucks between and downwind of them [E]. Doc 05 §4.3 has the doe vs buck bedding rules.
- **Cruising lines** [E]: downwind edges of doe bedding cover; bed-to-bed funnels (saddles, inside corners, creek crossings, strips of cover between CRP blocks); leeward sides of ridges; thermal hubs on calm frosty mornings (doc 05 §2.3). Pre-rut: morning around doe bedding, afternoon along the downwind edges of doe food [E].
- **Multiple focal areas, not one sanctuary.** 74% of MSU bucks changed focal areas every 6–10 h [12] [R]. A "vanished" buck has usually shifted focal area or gone on an excursion [12][17] [R].
- **When bucks abandon food focus:** P−10 to P+7 in practice, about Nov 3–20 [I, from the movement curves and weight-loss data [12]]. **Return to food:** P+7 onward, about Nov 20 [12] [R].
- **Firearms overlay (Nov 14–24):** heavy pressure plus peak breeding. Afterward, expect a sharp shift of daylight use into thick cover for at least 1–2 weeks [12] [R, OK analog].

### 4.3 Lockdown: myth vs data
PA GPS on mature bucks (15-min fixes, 16,500 ac): "During peak rut, these deer were just crazy". There was no lockdown, and the apparent disappearances came from focal-area shifts [17] [R]. The MSU data agree: daily home range stays around 200 ac even at peak [12] [R]. There is a real effect for older bucks (3+ years): they switch between searching (high movement) and tending (low movement, in thick cover), and WI found them more nocturnal at peak [13] [R]. **App:** at P…P+7, keep the midday weight but move site priority toward doe-bedding interiors and edges (§8.5).

---

## 5. Stand position changes, and why

### 5.1 The seasonal migration of the good stand
| Phase | Primary set | Secondary | Morning / evening | Why |
|---|---|---|---|---|
| Early season | **Field-edge staging** (inside cover 30–150 yd off a *green* bean or alfalfa field; corner or inside-corner entry trails) | Isolated white oak or apple trees; bed-to-food transitions | **PM**. AM only if you can reach bed-side transitions without crossing the field. | Predictable bed → feed. Daylight use of open fields is compressed to last light [12]. |
| Lull | **Acorn flats / white oak ridges; transition trails 75–200 yd off beds** [doc 06 I1, L1] | Harvested-field edges near cover; persimmons | PM near beds, AM on mast | Food has moved into the timber. Stay light, since first sits are the best sits [46][47] [E]. |
| Pre-rut | **Primary scrape areas** (Eberhart), rub lines between doe bedding and food; **downwind of doe bedding** | Staging near doe food; thermal hubs | **AM ≥ PM**, plus midday on fronts | Scraping peaks P−14 [19]. Bucks start scent-checking doe cover [E]. |
| Seek / chase | **Funnels between doe bedding areas**; saddles; inside corners; creek crossings; CRP/timber seams | Downwind edges of doe bedding | **All day** | Maximum travel, 70% of excursions in daylight [16]. |
| Peak breeding | **Doe-bedding perimeters and interiors** (thick cover) | Pinch points near them | All day | Tending in cover [17]. |
| Post-rut | **Food again**: best remaining food nearest thick cover (green wheat, brassicas, standing beans/corn) | Funnels between doe groups | **PM** | Recovery feeding; bucks re-pattern [12]. |
| Late season | **Food-edge / staging on the best energy food**, closest to thermal cover (cedar, south-facing thick slopes, CRP) | Bed-edge on warm mornings after frigid nights | **PM** | Energy urgency [4][27]. |

### 5.2 Moving with the crops (event rules)
- **Soybean field turns yellow or drops leaves** → drop its food weight (§8.3). Move PM sets from the bean edge to the **nearest white oaks** and to the timber transitions between beds and oaks [I/E].
- **Corn field harvested** → cover disappears. (a) Remove its bedding-cover value. (b) Bump the value of adjacent permanent cover (draws, bottom timber, CRP) as new bedding within about 800 m. (c) For about 3–10 days, waste grain plus the novelty of the open field gives evening visits, mostly at dark [I]. (d) Scrape lines that relied on standing-corn cover lose daylight value [30] [E].
- **Bean field harvested** → evening waste-bean draw for about 1–3 weeks (decaying), low daylight value in the field interior. Edges within 100 yd of cover keep some value [I].
- **Winter wheat emerges** → a new green-food polygon. It becomes a primary PM food target from about mid-Nov [I/E].
- **Brassica plot after the first hard frost (≤28°F), or Nov 15** → primary late food [32] [R/E].
- **Mast observations** → white oaks dropping heavily: sit the oak flats now. The window lasts about 2–3 weeks, and ground density collapses within 2 weeks of peak [10] [R]. White oaks empty and reds dropping: move to red oak ridges and flats [I].

### 5.3 First-sit advantage across the season [E, with R support]
- Infalt: 11–12 of his top 15 bucks came on the first sit. Andy May: about 80%. Eberhart: 3–4 hunts per season per secure location [46][47][48] [E]. Research: bucks avoid a hunted stand site for about 3 days; daylight visits fell from 1 in 3 to 1 in 20 over a season (doc 05 §7) [R].
- **Budget:** spend the first sits in the phase each set is built for. Early-season field-edge sets: 1–2 evening sits on the best wind, early (Sep 15–30), before beans turn. Scrape and doe-bedding sets: **untouched until P−16 … P−7 (Oct 28 – Nov 6)**, then hunt hard. Late-season food sets: hold until the first real cold front after Nov 25 [I, synthesis of E].
- Warbritton: on public land, hunt the **last week of October** rather than early November to dodge vacation pressure [49] [E].

### 5.4 Morning vs evening choice per phase (summary)
The ratio of AM to PM stand value by phase: Early 0.5 · Lull 0.7 · Pre-rut 1.1 · Seek 1.1 · Peak 1.0 · Post-rut 0.7 · Second rut 0.7 · Late 0.4 [I, derived from §3]. Entering in the morning past a food field in early season or late season does more harm than any rating gain, so penalize AM sets that require crossing active food [E].

---

## 6. Moon: research vs folklore

| Claim | Evidence | Tag |
|---|---|---|
| "Rutting moon": the second full moon after the autumnal equinox triggers or shifts peak breeding (Alsheimer/Wensel school) | UGA analysis of >2,500 does from **7 states including Missouri** (3–19 years each): **no correlation between moon phase and breeding timing at any location**. New Brunswick (1,600+ does, 9 years): mean conception fell in the same 4-day window (Nov 26–29) in 8 of 9 years regardless of moon [23]. Dye et al. 2012 (MS/TX captive and wild): "moon phase did not predict accurately conception date for individuals or populations" [24]. | **[F]** |
| Moon phase changes buck daylight movement | MSU GPS: "absolutely no pattern of variation that can be associated with moon phase" [12]. MSU Lunar Legends: trivial solunar effects [42]. PSU: not significant (doc 05 §6). | **[F]** |
| Photoperiod sets breeding | Decreasing day length triggers estrus and rising testosterone [3]. Breeding is consistent year to year [1][23]. | **[R]** |

**Practical:** weight = 0 in every rating. **Record** moon phase, illumination, moonrise/moonset and overhead/underfoot times on every sit, so the user's own data can test it later (§8.6).

---

## 7. Weather interactions by phase

### 7.1 Evidence summary
- **Temperature:** Minnesota deer were active at 6–16°C and less active above 16°C (61°F), with activity shifting to night when warm [27] [R]. MSU: weather relationships were "weak … little biological significance" [26] [R-w]. Auburn (SC): minimal effect on dawn/dusk peaks; in post-rut, more night and morning activity and less daytime activity [25] [R-w]. Dawn and dusk are the periods *least* affected by weather in every study [25] [R].
- **Cold fronts:** PSU found no difference in movement before, during or after fronts [25] [R]. WI rut: no weather effect [13] [R]. Experts are unanimous that post-front cold, clear mornings are good [doc 06 A2, S1] [E].
- **Rain:** PSU bucks cut movement by up to half on rainy days unless it was windy. Does were unaffected [25] [R].
- **Wind:** PSU found the least movement in calm conditions [25] [R-w]. Auburn found post-rut buck activity fell with wind [25] [R-w].
- **Seasonal energetics:** activity bottoms out in Jan–Feb [27] [R]. In cold weather deer seek digestible carbohydrates and fats [32] [R/E].

### 7.2 By phase (encodable; magnitudes are [I])
| Phase | Weather that helps | Weather that hurts | Rating effect |
|---|---|---|---|
| Early (Sep 15 – Oct 4) | Highs ≤75°F; the first cool front of fall (a −10°F or more departure) | Highs ≥85°F: movement pushed to the last 20 min or after dark; ponds and water near beds matter | Temp anomaly −10°F → PM ×1.2; high ≥85°F → PM ×0.7, and AM relatively ×1.1 |
| Lull | Cold fronts and frosts (the first 32°F around the third week of Oct [34]) | Heat waves | ±15% on anomaly |
| Pre-rut / seek | **Late-Oct / early-Nov cold fronts**: pre-rut bucks' daytime scent-checking gets a boost [E]. Frosty calm mornings → thermal-hub sets. | Highs ≥70°F: midday movement drops but the rut still runs. Breeding date does not change [23]. | Anomaly ≤ −10°F → AM/midday ×1.2 (cap); warm → midday ×0.8; **never move P** |
| Peak | Minor | Heavy rain (bucks move about half) [25] | Rain → ×0.7 buck movement |
| Post-rut / second rut | Cold (Sturgis: ≤50°F maximizes cruising [35]) | Warm spells | ≤50°F → ×1.15 |
| Late season | **First cold days after a warm spell; highs below normal with sun; calm**. Snow cover boosts food concentration. | Extreme cold plus high wind: deer hunker in thermal cover. Warm spells → night feeding. | Anomaly −10 to −20°F → PM ×1.3 and PM window starts 2–3 h before sunset; wind >20 mph → ×0.8 |

Keep the combined weather effect within **±25–30%** (consistent with doc 05). Never double-count "front" and "temperature drop".

---

## 8. Encodable model for the app

Everything below is a default. Every constant sits in a single config (`seasonal.yaml`) and the user can override it. Tags: numbers are **[I]** unless stated, calibrated to the evidence above.

### 8.1 State per hunt area and per field
```
Season state (per area):
  P            : peak-conception date   default 2026-11-13, sd 3 d  (prior; §8.6 updates it)
  mast_white   : MPI 0-300              default 126 (long-term avg [8]); user/MDC override
  mast_red     : MPI 0-300              default 135 [8]
  nass         : weekly MO series {corn_mature, corn_harv, soy_drop, soy_harv, wheat_plant, wheat_emerg}
  nass_offset_d: area offset vs state   default 0 (central MO ≈ state mean); bottoms +3 d in wet falls
  frost_32_date, frost_28_date : observed (Open-Meteo) or climatology (32°F ≈ Oct 18-24, 28°F ≈ Nov 1) [34]

Field state (per CDL polygon; CDL gives crop type):
  crop ∈ {soy, corn, wheat, alfalfa_hay, grass_hay, food_plot_{clover,brassica,grain}, fallow}
  stage ∈ soy:{green, yellowing, dropped_standing, harvested}
          corn:{standing_green, standing_mature, harvested, tilled}
          wheat:{bare, planted, emerged, established}
  stage_source ∈ {user_log (authoritative), nass_probabilistic}
  t_stage : date the stage began (user logs), or expected date (NASS)
```

**Probabilistic stage when the user has not logged the field** (NASS-driven). Interpolate the weekly NASS series to daily values and shift by `nass_offset_d`:
```
p_soy_drop(t)  = NASS soy_dropping_leaves%(t)/100
p_soy_yellow(t)= NASS soy_dropping_leaves%(t+7)/100          # yellowing leads leaf drop ~7 d [I]
p_soy_harv(t)  = NASS soy_harvested%(t)/100
P(green)=1-p_soy_yellow;  P(yellowing)=p_soy_yellow-p_soy_drop
P(dropped_standing)=p_soy_drop-p_soy_harv;  P(harvested)=p_soy_harv
corn: P(harvested)=corn_harv%(t)/100; P(standing)=1-P(harvested)
wheat: P(emerged)=wheat_emerg%(t)/100, but only for fields flagged "wheat this year"
       (CDL shows the *previous* crop at planting time, so default: soy fields → P(wheat follows)=0.25) [I]
```
Use expected values for rasters. A user log collapses the probability to 1 immediately.

### 8.2 Phase membership (soft)
Trapezoid membership m_phase(d), with d = date − P in days. Weights mix as Σ m_phase × w_phase (normalized).
| Phase | full membership | ramps (linear) |
|---|---|---|
| early | ≤ −42 | −42 → −36 |
| lull | −36 … −24 | −42→−36 up, −24→−20 down |
| pre_rut | −20 … −9 | −24→−20 up, −9→−6 down |
| seek_chase | −6 … −1 | −9→−6 up, −1→+1 down |
| peak | +1 … +6 | −1→+1 up, +6→+9 down |
| post_rut | +9 … +18 | +6→+9 up, +18→+22 down |
| second_rut | +18 … +30 (overlaps post) | +15→+18 up, +30→+36 down |
| late | ≥ +36 | +30→+36 |

### 8.3 Food attraction A(food, t, state) ∈ [0, 1] (relative pull per acre, before cover/pressure/daylight factors)
**Soybeans (by stage):**
| Stage | A | Decay / notes |
|---|---|---|
| green (R5–R6) | **1.00** until Oct 5; after that 0.9 | Top food in Sep |
| yellowing (R7) | **0.30** | 1–2 weeks [29] |
| dropped_standing (R8, pods on plant) | 0.40 until Nov 15 → ramps to **1.00 by Dec 10** → stays 1.0 through Jan | Late-season value of standing beans [30][31] |
| harvested | 0.55 on day 0 → exponential decay, half-life 10 d, floor 0.15. From Dec 1: floor 0.25 and ×1.3 on cold days | Waste beans. "Nutrition desert" soon after [12] |

**Corn:**
| Stage | Food A | Cover C (bedding/security, 0–1) |
|---|---|---|
| standing_green (Aug – mid Sep) | 0.35 | **0.85** |
| standing_mature | 0.50 until Nov 15 → **0.95 by Dec 10** | **0.85** (−0.1 when leaves fall off in Dec) |
| harvested | 0.50 day 0 → half-life 14 d, floor 0.20. From Dec 1: floor 0.35 and ×1.3 on cold days | **0.0** |
| tilled | 0.05 | 0.0 |

**Soybean cover C:** green 0.25 (fawns and does bed in tall beans) · yellowing 0.15 · dropped_standing 0.05 · harvested 0.

**Acorns (per oak-forest cell; weight from the forest-type raster or user mast pins):**
```
drop_white(t) = normal density, mean Sep 30, sd 9 d   (≈ 80-90% falling Sep 14 - Oct 14 [10])
avail_white(t)= cumulative drop(t) × exp(-(t - Sep30)+/14 d)   # consumption/germination collapse ~4× in 2 wk [10]
drop_red(t)   = normal density, mean Oct 22, sd 14 d  [I: MO red oak later than pooled VA data]
avail_red(t)  = cumulative drop(t) × exp(-(t - Oct22)+/45 d)   # tannin-preserved, persists into Dec
A_white = 1.00 × clamp(mast_white/126, 0, 2.0) × avail_white_norm
A_red   = 0.70 × clamp(mast_red/135, 0, 2.0)   × avail_red_norm   (0.85 after Nov 15 when whites gone)
mast failure (MPI<75): A_acorn → ×0.2; all ag-field A ×1.3; food-distance kernels ×1.5 [8]
bumper (MPI>200):     ag-field daylight weight ×0.7 Sep 25 - Nov 10 [8][37]
```

**Others:**
| Food | A (by window) |
|---|---|
| alfalfa / clover | Sep 0.65 · Oct 0.75 · Nov 0.80 (**after the first ≤24°F**: 0.45) · Dec–Jan 0.40 |
| winter wheat / rye | planted 0.05 · emerged +0–14 d 0.35 · +14 d onward 0.70 · from Nov 15 0.85 · Dec–Jan 0.85 (×1.2 on cold days) |
| brassica plot | 0.25 until the first ≤28°F or Nov 15 (whichever comes first) → 0.90 through Jan [32] |
| persimmon (pin) | Sep 15–Sep 30 0.3 · Oct 1–Nov 30 0.85 · Dec 0.4 |
| honey locust (pin) | Oct–Jan 0.45 |
| apple (pin) | Sep 1–Oct 31 0.80 · Nov 0.4 |
| browse (early-successional, edge, CRP, cedar-glade) | 0.30 year-round → 0.45 from Dec 1 → ×1.5 in a mast failure |
| harvested grass hay / pasture | 0.10 |

**Daylight usability of a food cell** (multiplies A for daylight hunting value, **not** for night use):
```
edge_factor  = 1.0 if dist_to_security_cover ≤ 50 m; 0.6 at 100 m; 0.25 at 200 m; 0.1 beyond 300 m [I; MDC: plots within 50 yd of cover for daytime use [5]]
size_factor  = 1.0 for fields ≤ 10 ac, 0.7 at 40 ac, 0.45 ≥ 120 ac (big bottom fields → night) [I]
pressure_factor = doc 05 §7 / doc 06 §4.6 (hunted-stand cooldowns; firearms-portion ×0.5 for 10 d after opener [12])
```

### 8.4 How harvest state changes the rasters
On a user log **or** when P(harvested) crosses 0.5 for an unlogged field:
1. **Food raster:** replace the field's A with the harvested-stage curve above (starting t_stage).
2. **Cover raster:** corn C → 0. Recompute the bedding probability (doc 05 §4.4). Add a +0.15 "displaced-deer" bonus to permanent cover cells within 800 m of the field for 21 days, decaying linearly [I; VerCauteren home-range expansion [28]].
3. **Corridors:** recompute least-cost paths (doc 05 §4.5), since open fields now cost more to cross in daylight. Crossing cost in a harvested field = ×3 by day, ×1 at night [I].
4. **Scrape/edge sets** adjacent to a now-harvested corn field: daylight value ×0.6 [30] [E].
5. **Wheat:** if the user logs "planted to wheat", start the wheat curve (emergence default +8 d).
6. **Weekly NASS pull:** fetch Monday's national Crop Progress (Missouri rows; parse with pypdf layout mode, which works on the 2026 PDF) and update the unlogged-field probabilities. Show a banner: "Soybeans 52% dropping leaves statewide (avg 42%): bean-field evening sits are fading."

### 8.5 Stand-type priorities per phase (multiplier on the site's base suitability from doc 05 §9.4)
Stand types: **FE** open field edge · **ST** staging (inside cover 30–150 m off food) · **MT** mast tree or oak flat · **TC** bed↔food transition or corridor · **BB** buck-bed perimeter · **SC** primary scrape area · **DB** downwind edge of doe bedding · **FN** funnel between doe bedding areas (saddle, inside corner, creek crossing, cover seam) · **TH** thermal hub.
| Phase | FE | ST | MT | TC | BB | SC | DB | FN | TH |
|---|---|---|---|---|---|---|---|---|---|
| early | **1.0** | **1.0** | 0.8 | 0.8 | 0.5 | 0.3 | 0.3 | 0.3 | 0.3 |
| lull | 0.4 | 0.7 | **1.0** | **1.0** | 0.7 | 0.5 | 0.4 | 0.4 | 0.4 |
| pre_rut | 0.3 | 0.7 | 0.6 | 0.8 | 0.8 | **1.0** | **0.9** | 0.8 | 0.8 |
| seek_chase | 0.2 | 0.5 | 0.3 | 0.6 | 0.6 | 0.6 | **1.0** | **1.0** | 0.8 |
| peak | 0.2 | 0.4 | 0.3 | 0.5 | 0.5 | 0.3 | **1.0** | 0.9 | 0.6 |
| post_rut | 0.6 | **1.0** | 0.5 | 0.8 | 0.5 | 0.4 | 0.7 | 0.8 | 0.4 |
| second_rut | 0.7 | **1.0** | 0.4 | 0.7 | 0.4 | 0.3 | 0.6 | 0.7 | 0.3 |
| late | **1.0** | **1.0** | 0.5 (red oak only) | 0.7 | 0.6 | 0.1 | 0.3 | 0.3 | 0.2 |

Multiply FE and ST by the A of the food they face (§8.3), and MT by A_acorn. The late-season BB value applies to warm mornings after frigid nights only (bedding in thermal cover).

**Time-of-day weights** (sun-relative windows: AM = SR−30 … SR+120 min; MID = SR+120 … SS−150; PM = SS−150 … SS+30; clipped to legal light):
| Phase | AM | MID | PM | Notes |
|---|---|---|---|---|
| early | 0.55 | 0.10 | **1.00** | PM mass concentrated in the last 45 min; heat ≥85°F → PM ×0.7 |
| lull | 0.70 | 0.20 | **0.90** | |
| pre_rut | **1.00** | 0.45 | 0.95 | Cold front → MID ×1.4 |
| seek_chase | **1.00** | **0.80** | 0.90 | All-day recommended [12][35] |
| peak | 0.90 | 0.75 | 0.80 | All-day in doe cover |
| post_rut | 0.65 | 0.40 | **1.00** | ≤50°F → all ×1.15 [35] |
| second_rut | 0.65 | 0.40 | **1.00** | |
| late | 0.40 | 0.30 (0.55 on cold sunny days) | **1.00** | Cold anomaly → PM window opens at SS−180 |
Derivation: night about 2× day early, converging in the rut [12]; excursions 70% daylight at peak [16]; crepuscular baseline [12][18] [R]; magnitudes [I].

**Overall buck daylight-movement index by phase** (for the daily hunt rating, relative to peak = 1.0): early 0.45 · lull 0.45 · pre_rut 0.70 · seek_chase **1.00** · peak 0.90 · post_rut 0.60 · second_rut 0.55 · late 0.45 (cold-day ×1.3). Shape from MSU/PSU/WI movement curves [12][13][15] [R]; levels [I].

### 8.6 Hunter-logged signals that shift the calendar
Log types (one tap in the journal; each carries date, location, confidence):
| Signal | Effect | Shift rule |
|---|---|---|
| `field_harvested(field, date)` | Field stage → harvested (§8.4) | Authoritative |
| `field_state(field, green / yellowing / dropped / planted_wheat / wheat_up)` | Sets stage | Authoritative. The mean offset vs NASS across the user's logs updates `nass_offset_d` (clamped ±14 d) |
| `acorns_dropping(group=white/red, intensity=light/heavy)` | Starts or re-centres the drop curve for that group in that area | heavy white → mean_white := log date + 3 d (clamp Sep 15–Oct 20) |
| `acorns_gone(group)` | avail → 0.1 for that group | |
| `mast_rating(group, poor/fair/good/excellent)` | Sets MPI 50/113/188/263 | Also accepts MDC survey entries |
| `first_scrapes(count, fresh)` | Evidence on P: widespread fresh scraping ≈ P−21 … P−14 | observation → P_obs = date + 17 d, sd 7 |
| `scrape_peak / many_hot_scrapes` | ≈ P−14 [19] | P_obs = date + 14, sd 5 |
| `chasing_seen` / `bucks_cruising_midday` | ≈ P−7 … P | P_obs = date + 4, sd 5 |
| `tending_pair` / `doe_alone_bucks_following` | ≈ P−3 … P+5 | P_obs = date + 1, sd 4 |
| `scrapes_abandoned` (previously hot, no refresh in 5+ d) | ≈ P … P+7 | P_obs = date − 3, sd 5 |
| `bucks_back_on_food` | ≈ P+7 … P+14 | P_obs = date − 10, sd 6 |
| `frost(temp)` | Sets frost dates (brassica trigger, alfalfa decline) | Authoritative |
| `food_plot_used(heavy)` | Local A ×1.2 for 7 d | |

**Updating P:** precision-weighted mean of the prior (Nov 13, sd 3 d) and the observations (above sds, down-weighted ×0.5 for sightings of a single deer). **Clamp the posterior to Nov 8 – Nov 18.** Photoperiod keeps population peaks within a few days year to year [23][1] [R]. A large apparent shift more likely means a local sampling artifact (one hot doe, pressure) than a moved rut [I]. Display the P estimate and the evidence behind it.

**Also record on every sit** (for the future learning phase: docs/07-build-plan.md, phase 8): moon phase, illumination, moon overhead/underfoot times (weight 0), temperature anomaly vs the NOAA daily normal, front passage in the last 24 h, wind, precipitation, field states within 1 km, and sightings by sex/age and time. This lets per-user calibration test the weights above (including the moon) instead of trusting defaults.

### 8.7 Pseudocode tie-in
```
rating(site, t) =
    base_suitability(site, wind, thermal)                       # doc 05 §9.4
  × Σ_phase m_phase(t-P) · stand_type_weight[phase][site.type]  # §8.5
  × food_term(site, t)          # FE/ST/MT: A(faced food) × edge_factor × size_factor (§8.3)
  × tod_weight(phase-mix, window(t)) × buck_daylight_index(phase-mix)
  × weather_mult(phase, temp_anom, rain, wind, front)           # §7.2, total clamp [0.75, 1.30]
  × pressure_mult(site, sit_history, firearms_portion)          # doc 05 §7, doc 06 §4.6
  × moon_mult = 1.0                                             # §6
```

---

## 9. Caveats and open items
- **The Missouri conception anchor rests on MDC's "mid-November" statement plus older Missouri fetal data (Nov 16 adult peak) and large Illinois data (Nov 10 mean).** A recent MDC fetal dataset would tighten P. Ask MDC's cervid program, or collect crown-rump data from late-season does (NDA method [39]).
- **Crop dates are statewide.** Central MO is likely near the mean, but bottomland harvest can lag in wet years. User logs should dominate quickly.
- **The red oak drop timing for MO** is an inference (the VA latitude-matched data pooled species). Refine it with user `acorns_dropping` logs.
- **VerCauteren & Hygnstrom's 32% home-range expansion** came from a secondary summary. Verify it before quoting in the UI.
- **The MSU GPS data are from Mississippi** (rut Dec 25 – Jan 7). Use their *phase-relative* shapes, not the calendar dates. The WI and PA data give the Midwest calendar.
- **No published 2026 MDC mast survey was found** as of Sep 27, 2026. Default to average and prompt the user for a mast rating.
- **Firearms overlap:** 2026 archery is closed Nov 14–24, so the planner should avoid recommending archery sits then. Doc 05 §1.1 notes the permit and orange questions.

---

## Sources
1. MDC, *Missouri Conservationist* Sep 2024, "Ask MDC" (breeding peaks mid-November; fawning late May – early June): https://mdc.mo.gov/magazines/missouri-conservationist/2024-09/ask-mdc
2. Green, M.L. et al. 2017. Reproductive characteristics of female white-tailed deer in the Midwestern USA. *Theriogenology* 94:71–78 (Illinois, 4,781 fetuses; cites Hansen, Beringer & Schulz on Missouri, Nov 16 adult peak): https://pubmed.ncbi.nlm.nih.gov/28407863/ ; PDF: https://wwv.inhs.illinois.edu/files/9714/9012/4498/Reproductive_characteristics_of_female_white-tailed_deer_Odocoileus_virginianus_in_the_Midwestern_USA..pdf
3. MU Extension G9479, Ecology and Management of White-Tailed Deer in Missouri: https://extension.missouri.edu/publications/g9479
4. MU Extension G9487, Nutritional Requirements of White-tailed Deer in Missouri: https://extension.missouri.edu/publications/g9487
5. MDC, Deer: Food and Water Needs: https://mdc.mo.gov/improve-your-property/wildlife-management/deer-management/deer-food-water-needs
6. USDA NASS, Missouri Crop Progress & Condition weekly reports, fall 2024 (with 2019–2023 averages), e.g. https://www.nass.usda.gov/Statistics_by_State/Missouri/Publications/Crop_Progress_and_Condition/2024/20241007-MO-Crop-Progress.pdf (series index: https://www.nass.usda.gov/Statistics_by_State/Missouri/Publications/Crop_Progress_and_Condition/)
7. USDA NASS, national *Crop Progress*, released Sep 21, 2026 (week ending Sep 20, 2026; Missouri rows): https://www.nass.usda.gov/Publications/Todays_Reports/reports/prog3826.pdf
8. MDC, 2013 Oak Mast Survey Report (Olson; annual survey since 1960, MPI method, regional indices, effect on hunter success): https://mdc.mo.gov/sites/default/files/mdcd7/research_papers/2013_Oak_Mast_Survey_Report.pdf
9. MU Extension G9414, Managing Oaks for Acorn Production to Benefit Wildlife in Missouri: https://extension.missouri.edu/g9414
10. McShea, W.J. & Schwede, G. 1993. Variable acorn crops: responses of white-tailed deer and other mast consumers. *J. Mammalogy* 74:999–1006: https://research.fs.usda.gov/treesearch/33017
11. MSU Deer Ecology & Management Lab, "What do deer eat?": https://www.msudeer.msstate.edu/deer-diet.php
12. Strickland, Demarais et al. 2024. MSU Extension P3927, *Understanding Buck Movement* (MSU Deer Lab GPS; includes the Oklahoma pressure study): https://extension.msstate.edu/sites/default/files/publications/P3927_Buck%20Movement_web_rev.pdf
13. Hunsaker et al. 2025. Breeding-season movement of male white-tailed deer, SW Wisconsin. *Ecology & Evolution*: https://pmc.ncbi.nlm.nih.gov/articles/PMC12240682/
14. Penn State Deer-Forest Study, "October Lull – Take 2": https://www.deer.psu.edu/october-lull-take-2/
15. Penn State Deer-Forest Study, "Miles and Miles to Go": https://www.deer.psu.edu/miles-and-miles-to-go/
16. NDA, "Now You See Him: 9 Things We Know About Deer Excursions" (Karns/Maryland and 6-state data): https://deerassociation.com/now-you-see-him-9-things-we-know-about-deer-excursions/
17. NDA, "Is the Lockdown Phase a Myth?" (PA GPS, Olson): https://deerassociation.com/lockdown-phase-myth/
18. NDA, "What Deer Research Really Says About the Rut": https://deerassociation.com/what-deer-research-really-says-about-the-rut/
19. QDMA Canada, "Buck Use of Scrapes: What the Latest Research Reveals" (Alexy, UGA): https://www.qdma.ca/en/2014-03-27-13-07-39/what-we-do/deer-biology-management/104-buck-use-of-scrapes-what-the-latest-research-reveals/ ; American Hunter, "Most Scrapes Aren't Worth a Sit" (Miller: peak scraping about 2 weeks before peak breeding): https://www.americanhunter.org/articles/2010/9/22/most-scrapes-arent-worth-a-sit/
20. NDA, "A Guide to Rubs and Scrapes": https://deerassociation.com/guide-to-rubs-and-scrapes/
21. Noble Research Institute, "In a Rut: Breeding Season Behaviors in Deer": https://www.noble.org/regenerative-agriculture/wildlife/in-a-rut-breeding-season-behaviors-in-deer/
22. NDA, "The Biology of Bachelor Groups": https://deerassociation.com/biology-bachelor-groups/
23. NDA, "No Link Between Moon Phase and Rut Peak" (UGA 7-state incl. Missouri; New Brunswick): https://deerassociation.com/no-link-moon-phase-rut-peak/
24. Dye, M.P. et al. 2012. Factors affecting conception date variation in white-tailed deer. *Wildlife Society Bulletin* 36: https://wildlife.onlinelibrary.wiley.com/doi/10.1002/wsb.98
25. NDA, "Does Weather Impact Deer Movement?" (Auburn/Goethlich, PSU Deer-Forest, MSU): https://deerassociation.com/does-weather-impact-deer-movement/
26. MeatEater / Wired to Hunt, "Does Temperature Affect Deer Movement?": https://www.themeateater.com/wired-to-hunt/whitetail-hunting/does-temperature-affect-deer-movement
27. Beier, P. & McCullough, D.R. 1990. Factors influencing white-tailed deer activity patterns and habitat use. *Wildlife Monographs* 109: https://www.researchgate.net/publication/292370128_Factors_influencing_white-tailed_deer_activity_patterns_and_habitat_use
28. VerCauteren, K.C. & Hygnstrom, S.E. 1998. Effects of agricultural activities and hunting on home ranges of female white-tailed deer. *J. Wildl. Manage.* 62:280–285 (32% expansion after corn harvest, via secondary summary); related: Hygnstrom et al. 2011, *WSB*: https://wildlife.onlinelibrary.wiley.com/doi/10.1002/wsb.21 ; Great Plains review: https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1159&context=greatplainsresearch
29. MeatEater / Wired to Hunt, "Will Deer Eat Yellow Soybeans?": https://www.themeateater.com/wired-to-hunt/whitetail-management/will-deer-eat-yellow-soybeans
30. MeatEater / Wired to Hunt, "How Crop Rotations Impact Deer Movement" (Eberhart): https://www.themeateater.com/wired-to-hunt/whitetail-management/how-crop-rotations-impact-deer-movement
31. NDA, "Food Plot Species Profile: Soybeans": https://deerassociation.com/food-plot-species-profile-soybeans/
32. NDA, "Do Brassicas Actually Get 'Sweeter' After a Frost?" (Univ. of Tennessee): https://deerassociation.com/do-brassicas-get-sweeter/
33. MDC Field Guide, Persimmon: https://mdc.mo.gov/discover-nature/field-guide/persimmon ; Honey Locust: https://mdc.mo.gov/discover-nature/field-guide/honey-locust
34. MU IPM, Missouri Frost/Freeze Probabilities Guide: https://ipm.missouri.edu/FrostFreezeGuide/
35. Jeff Sturgis, "Bowhunting the Phases of the Rut": https://www.whitetailhabitatsolutions.com/blog/bowhunting-the-phases-of-the-rut
36. MDC, Deer Harvest Summary 2024–2025 (Callaway archery 871 / total 4,440; Cooper 398 / 2,216): https://mdc.mo.gov/hunting-trapping/species/deer/deer-reports/deer-harvest-summaries/deer-harvest-summary-2024-2025
37. KTVO, "Missouri deer harvest drops 15% in 2024–2025 season, MDC cites late start, acorn abundance" (Isabelle): https://ktvo.com/news/local/missouri-deer-harvest-drops-15-in-2024-2025-season-mdc-cites-late-start-acorn-abundance
38. MDC, *Conservationist* Oct 2016, "Studying White-Tailed Deer in the Digital Age" (MDC/MU GPS study, north MO and Ozarks): https://mdc.mo.gov/magazines/conservationist/2016-10/studying-white-tailed-deer-digital-age
39. NDA, "Detecting the Rut Peak" (fetal-aging method): https://deerassociation.com/detecting-rut-peak/
40. Soybean residue tissue quality (CP by leaf, stem, pod), Lower Mississippi Delta: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8309155/
41. MeatEater / Wired to Hunt, "How to Find Bucks After They Shed Velvet": https://www.themeateater.com/wired-to-hunt/whitetail-hunting/how-to-find-bucks-after-they-shed-velvet
42. MSU Extension P4068, *Lunar Legends: Does the Moon Influence Buck Activity?*: https://extension.msstate.edu/sites/default/files/publications/P4068_Lunar_web.pdf
43. MDC, 2026–2027 deer & turkey season dates: https://mdc.mo.gov/newsroom/mdc-sets-deer-turkey-hunting-dates-2026-2027-seasons
44. Same as [40] (leaf CP 19–20%, pod 12–27% in residue/hay context; NDA [31] reports 25–30% for well-fertilized forage).
45. Acorn availability reduces agricultural damage by ungulates (Poland, 2001–2020; red deer and wild boar): https://pmc.ncbi.nlm.nih.gov/articles/PMC13403050/
46. Outdoor Life, "Inside the Mind of Dan Infalt": https://www.outdoorlife.com/hunting/dan-infalt-deer-hunting-tips/ ; Wired to Hunt #27, "Hunting the October Lull w/ Dan Infalt": https://www.themeateater.com/listen/wired-to-hunt/the-wired-to-hunt-podcast-episode-27-hunting-the-o
47. MeatEater, "DIY Deer Hunter Profile: Andy May (Part One)": https://www.themeateater.com/hunt/big-game/diy-deer-hunter-profile-andy-may-part-one-of-two
48. D&DH, "Is He the Best Bowhunter in America?" (Eberhart): https://www.deeranddeerhunting.com/content/articles/is-he-the-best-bowhunter-in-america ; Eberhart, "Success Despite Heavy Consequential Hunting Pressure": https://wildgamedynasty.com/john-eberharthchp-tactics/
49. "Aaron Warbritton on How to Hunt the Rut on Public Land" (The Hunting Public): https://www.yahoo.com/lifestyle/aaron-warbritton-hunt-rut-public-182943275.html
