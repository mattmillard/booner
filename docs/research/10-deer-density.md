# 10 — How many deer and mature bucks does 1,000 acres hold? (Callaway, Cooper, Cole, Boone)

The hunter's question: "How many deer, and mature bucks, might a 1,000-acre area hold? It depends somewhat on timber,
but not always. You can almost assume heavy slope drop-offs are timber... I don't know the best way to assume those
things." This doc answers with numbers, shows where they come from, and gives the app a formula it can run on any drawn
area or parcel group. Written 2026-10-03.

**Evidence tags** (same as docs 05–07): **[R]** peer-reviewed, agency or university data. **[R-w]** research exists but
is old, from another state, or weak. **[E]** expert or extension consensus. **[F]** folklore. **[I]** our inference or
arithmetic, a tunable default. **[I, computed]** = we computed it here from agency data (CDL 2025 + 3DEP DEM, MDC harvest).

1,000 ac = 1.5625 sq mi = 4.05 km². "Per sq mi" below means MDC's per-square-mile figures, which use roughly the
non-urban land area of each county (§1.1).

---

## 0. The answer (read first)

For an **average 1,000 acres** of these four counties (about 35% timber, the county mix of crops and pasture), in the
**fall, before hunting seasons**:

| | Low | **Typical** | High | Notes |
|---|---|---|---|---|
| All deer | 25 | **40** (Cooper ~31, Callaway ~45) | 60 | §1 |
| Adult does | 9 | **17** | 25 | ~1.8 adult does per antlered buck |
| Fawns | 6 | **14** | 22 | ~0.8 fall fawns per adult doe |
| Antlered bucks (1.5+) | 6 | **10** | 13 | §2 |
| Bucks 2.5+ | 3 | **5–6** | 8 | |
| **Bucks 3.5+ ("mature")** | 1.5 | **2.5–3** | 4.5 | |
| **Bucks 4.5+** | 0.5 | **1–1.5** | 2.5 | |

Each row is its own range; the low and high columns don't add up across rows.

How to read it:
1. **These are resident equivalents** — time-weighted deer, i.e. how many deer-years the ground carries. Bucks' ranges
   (600–800 ac by MDC's figure, more in the rut) overlap the boundary, so **2–4× as many distinct bucks set foot on
   1,000 ac** over a fall, and more during rut excursions (§3.3). "Uses" is not "lives on".
2. **Timber matters, but as a mosaic.** Inside a county, ground that is 50–70% timber with crops and edges next to it
   holds roughly 1.2–1.6× the county average. Open crop bottoms far from cover hold 0.2–0.5×. Mostly-forest ground
   does not keep climbing: deer per acre of timber falls as timber share rises (§3.1).
3. **Steep ground is timber, flat ground is unknown.** On these counties' slopes ≥15%, 66–87% of land is forest and
   row crops are essentially absent (<1% of row-crop acres sit on ≥12% slope). But only about a third of the forest is on
   ≥15% slopes, so slope alone **misses two-thirds of the timber** — use CDL/NLCD/lidar first and slope only to fill gaps (§4).
4. **The mature-buck count is the softest number.** No MDC county age data is published. It rests on a survival model
   calibrated to statewide harvest ages, and **2026 is a regime change**: the antler-point restriction (APR) ended in
   Boone/Cole in 2024, in Callaway in 2025, and statewide (including Cooper) in 2026. Expect fewer 2.5- and 3.5-year-old
   bucks per 1,000 ac by about 2027–2028 (§2.3).

---

## 1. Deer density from MDC harvest data

### 1.1 County harvest (MDC Table 14 / harvest summaries)
| County | Total 2023 / 2024 / 2025 | Antlered bucks 2023 / 24 / 25 | Harvest per sq mi, 3-yr mean | Antlered per sq mi | MDC area used |
|---|---|---|---|---|---|
| Boone | 3,644 / 3,174 / 3,439 | 1,616 / 1,520 / 1,652 | **5.6** | 2.62 | ~609 sq mi |
| Callaway | 5,775 / 4,440 / 5,197 | 2,255 / 1,785 / 2,360 | **6.6** | 2.74 | ~780 sq mi |
| Cole | 2,049 / 1,866 / 2,029 | 794 / 866 / 926 | **5.7** | 2.46 | ~350 sq mi |
| Cooper | 2,587 / 2,216 / 2,320 | 1,077 / 994 / 1,066 | **4.5** | 1.98 | ~528 sq mi |
| Central Region | 48,577 / 39,860 / – | | 4.8 (2024) | | |

Sources [R]: [2023 report](https://mdc.mo.gov/sites/default/files/2025-07/2023%20pop%20status%20report%2020250604.pdf),
[2024 report](https://mdc.mo.gov/sites/default/files/2026-02/2024_pop_status_report.pdf) (Tables 6 and 14),
[2025–26 harvest summary](https://mdc.mo.gov/hunting-trapping/species/deer/deer-harvest-reports/deer-harvest-summaries/deer-harvest-summary-2025-2026).
The area column is back-calculated from MDC's harvest-per-sq-mi figure. It sits close to county land area minus CDL
"developed" land (Callaway 839 × 0.93 = 781; Cole 392 × 0.87 = 340) [I, computed].

- **Use a 3-year mean.** One year swings ±15%. In 2024 statewide harvest fell 15% because of "an abundant acorn crop"
  and record warmth, not because of fewer deer (2024 report) [R].
- **Callaway's 2025 antlered harvest jumped 32% while statewide rose only 12%.** 2025 is the year the APR was lifted
  there, so the extra ~18% is most likely yearling bucks that became legal [I].
- **Hunter density is high:** 6.7–10.7 firearms hunters and 2.4–3.5 archers per sq mi (2024 Table 6). That is
  roughly **10–17 firearms hunters and 4–5 bowhunters per 1,000 ac**, county average [R].

### 1.2 Harvest → population (two independent methods)
**Method A, from antlered bucks** [I], using research-backed rates:
- Fraction of antlered bucks shot each year: MU Extension says hunters take "40 to 70 percent of the antlered bucks"
  ([G9488](https://extension.missouri.edu/publications/g9488)) [E]. A Missouri radio-collar study on farmland (Randolph/Macon,
  1989–93) measured annual male survival of 0.44, with hunting causing 82–97% of male deaths on the rural sites
  ([Hansen & Beringer 2003](https://seafwa.org/sites/default/files/journal-articles/Hansen-326-336.pdf)) [R-w, old].
  Under the APR, yearlings are mostly protected, so the overall rate is lower. Our survival model (§2.3) gives about
  0.35 with an APR and 0.43 without. **Use h = 0.40 (0.32–0.50).**
- Adult does per antlered buck: Central-region bowhunter observations give **1.81 (10-yr average)**, 1.79 (2023) and
  1.42 (2024) ([2024 report Table 3](https://mdc.mo.gov/sites/default/files/2026-02/2024_pop_status_report.pdf)) [R, an index].
  MDC's worked example uses 1:2 ([Conservationist 2013](https://mdc.mo.gov/magazines/conservationist/2013-08/state-states-deer-herd)).
  **Use 1.8 (1.5–2.2).**
- Fall fawns per adult doe: in MDC's example, 35% of the fall herd is fawns, i.e. 11 fawns to 13 does (0.85) [R]. MU
  Extension: fawn mortality runs "as high as 40 percent" and 20–30% of doe fawns breed ([G9488](https://extension.missouri.edu/publications/g9488)) [E].
  The bowhunter survey's 0.39–0.44 fawns per doe is an index biased low (fawns are hard to tell from does by late fall
  and harder to see) [I]. **Use 0.8 (0.6–1.0).**
- Deer = bucks × (1 + 1.8 × (1 + 0.8)) = **bucks × 4.24**.

**Method B, from total harvest** [I]: MDC estimates **~1.7 million deer** statewide
([2025–2034 plan](https://mdc.mo.gov/sites/default/files/2025-02/Missouri_White-Tailed_Deer_Management_Plan_2025.pdf);
also in the [NDA 2026 Deer Report](https://deerassociation.com/wp-content/uploads/2026/01/DR2026.pdf)) against a harvest of 276k–326k (2023–25),
so harvest is ~16–19% of the estimate (we don't know whether that estimate is pre- or post-season). MDC's example
herd, harvested at a stabilizing rate, yields ~25%. **Use harvest = 24% (18–30%) of the fall herd.**

| County (per 1,000 ac, county-average land) | Method A (low / typ / high) | Method B (r = 30% / 24% / 18%) | **Use** |
|---|---|---|---|
| Boone | 28 / 43 / 69 | 29 / 37 / 49 | **28–55, typ 40** |
| Callaway | 29 / 45 / 72 | 34 / 43 / 57 | **30–60, typ 45** |
| Cole | 26 / 41 / 65 | 29 / 37 / 49 | **26–52, typ 38** |
| Cooper | 21 / 33 / 52 | 23 / 29 / 39 | **21–42, typ 31** |

Method A's "high" case implies only a 13–14% harvest rate, which is too low for a herd MDC calls stable to growing, so
we trimmed it to Method B's ceiling plus a margin [I].

**Cross-checks**
- Statewide: 1.7M deer over roughly 64k non-urban sq mi ≈ **26 deer/sq mi**. Our central typical is 21–29/sq mi [I].
- MDC's teaching example is **31 deer/sq mi** (7 bucks, 13 does, 11 fawns) = 48 per 1,000 ac
  ([Conservationist 2013](https://mdc.mo.gov/magazines/conservationist/2013-08/state-states-deer-herd)) [R].
- Per acre of timber: our typical estimates are ~64–69 deer per sq mi of forest in Boone, Cole and Callaway, and ~93 in
  Cooper (the least forested). Illinois (a low-forest state) had **30–37 deer/km² of forest = 78–96 per sq mi of forest**
  before the hunt ([Roseberry & Woolf 1998](https://www.semanticscholar.org/paper/HABITAT-POPULATION-DENSITY-RELATIONSHIPS-FOR-DEER-Roseberry-Woolf/272e9148ba127531458eab28248ab215c6eb2452)) [R-w].
  Both point the same way: the scarcer the cover, the more deer each timber acre carries.
- MU Extension's camera-survey example has 44 deer and 8 bucks on 1,000 ac. It is labelled **hypothetical**
  ([G9481](https://extension.missouri.edu/publications/g9481)) [E].
- Forest-health line for comparison: a continental analysis puts forest impairment above ~11.6 deer/km² (30/sq mi) ([Hanberry 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8495829/)) [R].
  Central MO sits near that line.

---

## 2. Herd composition: bucks and mature bucks

### 2.1 Sex ratio
- Central Region bowhunter survey, **does per buck**: 1.83 (2020), 1.79 (2023), 1.42 (2024), 10-yr average 1.81.
  Statewide 10-yr average 1.83; the Ozarks run 2.0–3.1 [R, index]. MU's management target is 1 buck to 2–3 does
  ([G9491](https://extension.missouri.edu/publications/g9491)) [E]. A ratio near 1.8 means a fairly balanced herd,
  which fits a decade of APR plus liberal doe harvest [I].

### 2.2 Buck harvest age (what the data actually say)
- **Statewide, % of the antlered harvest** (NDA Deer Reports [2024](https://deerassociation.com/wp-content/uploads/2024/01/2024DeerReport.pdf),
  [2025](https://deerassociation.com/wp-content/uploads/2025/01/2025-Deer-Report.pdf), [2026](https://deerassociation.com/wp-content/uploads/2026/01/DR2026.pdf)) [R]:

  | Year | 1.5 yr | 2.5 yr | 3.5+ yr |
  |---|---|---|---|
  | 2020 | 24% | 47% | 29% |
  | 2021 | 26% | 37% | 37% |
  | 2022 | 18% | – | – |
  | 2023 | 20% | – | – |
  | 2024 | 15% | – | – |

  For comparison, the Midwest averaged 28% yearlings in 2024 (Iowa/Wisconsin 42%), and the US 3.5+ share hit a record
  (NDA 2026) [R]. Missouri has not reported a 3.5+ share since 2021.
- **APR counties:** about **88% of the buck harvest was 2.5+**. Where the APR was rescinded (5 northern counties in 2012),
  the yearling share rose sharply ([2020 report, age-at-harvest section](https://mdc.mo.gov/sites/default/files/2021-09/2020_Deer_Population_Status_Report_0.pdf)) [R].
  In the 2004–07 APR experiment, antlered harvest fell 35–37% in year one, mostly yearlings, and more 2.5-, 3.5- and 4.5+-year-old
  bucks were shot than expected ([Conservationist 2008](https://mdc.mo.gov/magazines/conservationist/2008-09/experimental-antler-point-restriction)) [R].
- **APR timeline here:** Boone and Cole lost it in 2024 (CWD zone) ([KTTN 2024](https://www.kttn.com/missouri-hunters-face-new-regulations-for-deer-and-turkey-seasons-in-2024/)).
  Callaway lost it in 2025 ([KTTN 2025](https://www.kttn.com/mdc-announces-new-deer-hunting-rules-for-2025-2026-season/)).
  Cooper was among the last 18 APR counties in 2025, and MDC removed the APR statewide for 2026
  ([KOMU, Aug 2026](https://www.komu.com/news/state/missouri-changes-deer-hunting-regulations-ahead-of-2026-season/article_2b4fd33e-324e-4b79-a2a6-520c0fb786f4.html)) [R].
  All four counties also went without the APR in about 2015/16–2019 under an earlier CWD zone ([Lake Expo 2015](https://www.lakeexpo.com/news/lake_news/antler-point-restriction-removed-in-some-counties-to-help-curb-chronic-wasting-disease/article_b2ef7196-8a75-11e5-9aaf-83ba25e92435.html)).

### 2.3 From harvest ages to bucks on the ground (survival model) [I]
This is a stationary age pyramid with yearling survival S1 and survival S at 2.5+, plus 5% natural mortality. Each
scenario is checked against the harvest ages it produces.

| Regime | S1 / S | Population share 1.5 / 2.5 / 3.5 / 4.5+ | 2.5+ | **3.5+** | **4.5+** | Harvest rate | Harvest ages it predicts |
|---|---|---|---|---|---|---|---|
| APR (all four counties through 2023; Callaway 2024; Cooper 2025) | 0.80 / 0.47 | 40 / 32 / 15 / 13 | 60% | **28%** | **13%** | 0.35 | 17 / 44 / 39 (MO 2020–21: 24–26 / 37–47 / 29–37) ✓ |
| No APR, typical private (2026+) | 0.58 / 0.47 | 48 / 28 / 13 / 12 | 52% | **25%** | **12%** | 0.43 | 41 / 31 / 28 |
| Heavily pressured public | 0.50 / 0.40 | 55 / 27 / 11 / 7 | 45% | **18%** | **7%** | 0.50 | 50 / 30 / 20 |
| Managed private (passes ≤3.5, coop ≥2,000 ac) | 0.85 / 0.60 | 32 / 27 / 16 / 24 | 68% | **41%** | **24%** | 0.27 | 12 / 35 / 53 |

- The survival inputs are anchored by Missouri farmland male survival of 0.44 (Hansen & Beringer) [R-w] and MU's
  40–70% buck harvest [E]. The "managed" row is an expert-style target, not Missouri data [E/I].
- **Public vs. private:** an Alabama collar study found similar adult buck survival on public land (state APR) and
  private land (self-imposed QDM) ([Wiskirchen et al. 2023](https://deerlab.auburn.edu/files/2023/07/2023-WSB-Wiskirchen-et-al.pdf)) [R-w].
  So "public = no old bucks" is not a law. Public pressure is patchy: it piles up near parking (doc 06 §0) [R], and remote
  or hard-to-reach public pockets behave like private ground [E].
- **Management on one 1,000 ac has limits.** MU: a buck's range is "several hundred to over a thousand acres", and
  properties under ~1,500 ac struggle to shift age structure alone ([G9491](https://extension.missouri.edu/publications/g9491)) [E].
  Young males disperse: an average of 5.5 mi in north MO and 4.2 mi in the Ozarks, with 91–96% going under 10 mi
  ([2018 report](https://mdc.mo.gov/sites/default/files/2020-10/DeerPopStatusReport.pdf)) [R]. The neighbours' trigger
  fingers set the 3.5+ count.

### 2.4 Bucks per 1,000 ac (county-average land)
Antlered bucks = antlered harvest per sq mi ÷ h × 1.5625.

| County | Antlered bucks (h 0.50 / 0.40 / 0.32) | 3.5+ at 25–28% (typ) | 4.5+ at 12–13% (typ) |
|---|---|---|---|
| Boone | 8.2 / **10.2** / 12.8 | **2.6–2.9** | **1.2–1.3** |
| Callaway | 8.5 / **10.7** / 13.4 | **2.7–3.0** | **1.3–1.4** |
| Cole | 7.7 / **9.6** / 12.0 | **2.4–2.7** | **1.2** |
| Cooper | 6.2 / **7.7** / 9.7 | **1.9–2.2** | **0.9–1.0** |

Low/high for 3.5+ combine the low bucks with the 18% (pressured) share and the high bucks with 35%: **≈1.5–4.5 per 1,000 ac**.

---

## 3. Habitat drivers, home ranges, and "use ≠ live on"

### 3.1 Density vs landscape
- **Forest is the main driver; crops and development are negatives, shrub and woody wetland are positives.** Across the
  eastern US, deer density rose with deciduous/mixed forest, shrub and woody wetland and fell with crop and developed land.
  In the central region, high-density areas averaged 7.9% deciduous forest vs 3.2% in low-density areas; across regions, crop was 17–29% vs
  25–42% ([Hanberry 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8495829/)) [R].
- **Illinois:** a habitat index built on closed deciduous forest, distance between patches and an edge preference
  explained 81% of county density. Patches <0.02 km² (~5 ac) were dropped. Fragmentation and human presence showed no
  measurable penalty at the county scale ([Roseberry & Woolf 1998](https://www.semanticscholar.org/paper/HABITAT-POPULATION-DENSITY-RELATIONSHIPS-FOR-DEER-Roseberry-Woolf/272e9148ba127531458eab28248ab215c6eb2452)) [R-w].
- **Tennessee (distance sampling, 11 regions, 1.85–20 deer/km²):** harvest density was the best single predictor of
  deer density, and % woody area added little ([Relationships among deer density, harvest and landscape metrics in TN](https://www.researchgate.net/publication/338616186_Relationships_among_white-tailed_deer_density_harvest_and_landscape_metrics_in_TN_USA)) [R].
  → This supports **anchoring on county harvest** and using land cover only to redistribute within the county.
- **Missouri mosaic evidence:** in 2024 harvest per sq mi was St. Louis 6.4, Northeast 5.8, Central 4.8, Ozark 3.9
  (most forested), Northwest 3.4 (most row crop) (2024 report) [R]. Across our four counties, harvest density rises
  with forest share: Cooper 21.5% forest → 4.5/sq mi, Boone 34.5% → 5.6, Cole 35.3% → 5.7, Callaway 41.0% → 6.6
  [I, computed; n = 4]. Deer per **timber** acre falls as timber rises (§1.2 cross-check). → **Mosaics beat pure
  forest and pure crops; peak density is somewhere above ~40% forest with food next to it.** The exact optimum has not
  been measured for Missouri (thin).
- **Heavily forested ground (>50%) runs on acorns.** There, harvest swings with mast, and deer become harder to see in
  good mast years ([Conservationist 2013](https://mdc.mo.gov/magazines/conservationist/2013-08/state-states-deer-herd)) [R].
- **Edge:** deer favour edge and diverse cover (MDC [2018](https://mdc.mo.gov/magazines/conservationist/2018-11/white-tailed-deer-wild-places-they-shape))
  [E]. Crop damage concentrates at field edges next to woods, and small fields with lots of forest edge suffer most
  ([Iowa State](https://naturalresources.extension.iastate.edu/encyclopedia/white-tailed-deer-damage-management); Rogerson et al. 2014) [R-w].
  We found no quantitative edge-density → deer-density coefficient for Missouri (thin). Model edge as "crop or pasture
  within 300 m of cover" [I].

### 3.2 Home ranges
| Who | Size | Source |
|---|---|---|
| Missouri doe | **300–400 ac** | MDC [2018](https://mdc.mo.gov/magazines/conservationist/2018-11/white-tailed-deer-wild-places-they-shape) [E] |
| Midwest farmland doe (annual, IL/MI/NE/WI) | 0.99–1.47 km² = **245–363 ac** | [Walter et al. 2009](https://link.springer.com/article/10.1007/s10980-009-9374-4) [R] |
| Missouri buck | **600–800 ac** | MDC 2018 [E] |
| Bucks, SW Wisconsin (229 GPS) | 50–1,000 ac | NDA summary of Storm/WDNR ([NDA](https://deerassociation.com/6-facts-you-really-need-to-know-about-buck-home-ranges-and-1-you-dont/)) [R-w] |
| Bucks, Mississippi | 67% "sedentary", mean 361 ha (**~890 ac**); 33% "mobile", multi-part ranges averaging 6,530 ha | [MSU 2024](https://pubmed.ncbi.nlm.nih.gov/38352199) [R-w] |
| Rut excursions | 63% of 32 Maryland bucks made ≥1 trip (≥6 h, ≥0.5 km outside the range) right before or during the breeding season | [Karns et al. 2011](https://bioone.org/journals/Southeastern-Naturalist/volume-10/issue-1/058.010.0104/Investigation-of-Adult-Male-White-Tailed-Deer-Excursions-Outside-Their/10.1656/058.010.0104.short) [R-w] |
| Daily use | ~200 ac/day in every season (MSU) | NDA summary [R-w] |

### 3.3 How many distinct bucks use 1,000 acres [I, geometry]
Treat each range as a disc of area H (radius r) and the block as a square of area A and perimeter P. The expected
number of bucks whose range touches the block is density × (A + P·r + πr²). For a 1,000-ac square:

| Buck range | Touches the block (× resident count) | Spends ≥25% of time there (≈) |
|---|---|---|
| 300 ac (summer core) | 2.5× | ~1.4× |
| 700 ac (MDC fall) | **3.6×** | **~1.7×** |
| 1,500 ac (rut, with excursions) | **5.3×** | ~2× |

So with ~3 resident-equivalent 3.5+ bucks, expect **~5 that use the block regularly and ~10–15 that pass through
at least once** across Sep–Dec. Field evidence of this turnover: up to 30% of bucks on preseason cameras never showed
during the season, and in-season cameras found 60% more unique bucks than the preseason survey (UGA, via
[NDA](https://deerassociation.com/6-facts-you-really-need-to-know-about-buck-home-ranges-and-1-you-dont/)) [R-w].
A camera inventory at MU's 1 camera per 100 ac in August ([G9481](https://extension.missouri.edu/publications/g9481))
will count somewhere between the "resident" and "touches" columns.

### 3.4 Pressure
Density on the ground is set mostly at the county or landscape scale. Pressure mainly changes **buck age** (§2.3) and
**daylight use** (knowledge.md §1, §4): bucks shift where and when, not away [R]. Within a block, the app's existing
pressure model (parking and access, doc 06) should redistribute *daylight* use, not deer counts [I].

---

## 4. Inferring timber from terrain

### 4.1 What the land actually does here [I, computed]
We ran USDA CDL 2025 (30 m) against slope from the cached Mapterhorn/3DEP DEM (z14, ~7.4 m cells, smoothed σ ≈ 11 m),
masked to each county (scratch script, not committed). **Forest % of land in each slope bin:**

| Slope | Callaway | Boone | Cole | Cooper | Pasture/hay % (range) | Row crop % (range) |
|---|---|---|---|---|---|---|
| 0–2% | 10 | 10 | 7 | 7 | 18–24 | 33–58 (bottoms) |
| 2–5% | 19 | 17 | 17 | 8 | 27–50 | 10–56 |
| 5–8% | 36 | 30 | 21 | 14 | 43–55 | 3–33 |
| 8–12% | 61 | 51 | 35 | 31 | 29–47 | 1–13 |
| 12–15% | 78 | 67 | 53 | 52 | 15–36 | 0–4 |
| 15–20% | 87 | 78 | 66 | 70 | 8–23 | 0–1 |
| 20–25% | 93 | 88 | 77 | 85 | 4–11 | ~0 |
| ≥25% | 94–97 | 90–95 | 77–85 | 89–93 | 1–5 | 0 |

Whole-county cover (CDL): forest **Callaway 41.0%, Boone 34.5%, Cole 35.3%, Cooper 21.5%**. Grass/pasture/hay is 30–38%,
corn + soy 11–34% (Cooper highest), and developed land 5–14%.

- **Row crops almost never sit on steep ground:** only 0–5% of corn/soy/wheat acres are on ≥8% slope and ≤1% on ≥12%.
  The hunter's instinct is right [I, computed].
- **But steep ≠ all the timber:** only **31–36% of forest sits on ≥15% slopes**, and 63–80% sits on ≥8%. Bottomland
  timber, wooded upland flats and fencerows are flat. Slope-only inference would miss most of the timber [I, computed].
- **The 8–15% band is a coin flip** between timber and pasture (mostly fescue). Where cover type is missing, it should
  not be called timber.
- Agency guidance agrees. Missouri STC land grading: 5–9% "generally require[s] some soil conservation practices if
  extensively row cropped"; 9–14% is highly erodible and "typically... not used for cropland, but can be used for
  pasture and hay" ([STC Ch. 7.3](https://stc.mo.gov/wp-content/uploads/sites/5/2016/11/CHAPTER7.3AGLAND-Rev-11-28-16.pdf)) [R].
  NRCS land capability classes rise with slope and erosion, and class VI and above (generally steeper, eroded soils) is
  unsuited to cultivation ([USDA AH-210](https://www.govinfo.gov/content/pkg/GOVPUB-A-PURL-gpo20777/pdf/GOVPUB-A-PURL-gpo20777.pdf)) [R].
  Slope breaks for each class vary by soil.

### 4.2 Rules for the app
| Slope (DEM smoothed ~10–20 m) | P(forest) if no land cover | P(row crop) |
|---|---|---|
| < 5% | no inference (0.1–0.2) | possible |
| 5–8% | 0.25 | low |
| 8–12% | 0.45 | ~0.03 |
| 12–15% | 0.65 | ~0 |
| 15–25% | 0.80 | 0 |
| ≥ 25% (bluffs, breaks) | 0.90 | 0 |

Use these only to fill gaps or to sanity-check. **Better direct data, in order:**
1. **Lidar canopy height** from the 3DEP point cloud (`MO_FEMANRCS_2_2020` EPT, doc 03): canopy >~3 m = timber,
   1–3 m = brush/cedar/early successional. That is the best "cover" layer possible here [I].
2. **6-inch leaf-off imagery** (MSDIS) separates evergreen cedar thickets and brush from open hardwood [I].
3. **NLCD 2025 / Tree Canopy Cover (30 m)** — consistent forest vs pasture classes (doc 03).
4. **CDL 2025** — best for crop type by field (already in `pipeline/`). Its forest-vs-grass split comes from NLCD and
   blurs savanna, fencerows and brushy pasture.

---

## 5. Estimation method for any drawn area or parcel group

### 5.1 Inputs
- Polygon area A (ac) and perimeter P (m).
- Land cover areas inside the polygon (CDL 2025, NLCD, lidar canopy): forest, shrub/early-successional/CRP, woody
  wetland, pasture/hay/grass, row crop (corn, soy), green forage (alfalfa, wheat/double-crop, clover), developed, water.
- For crop and pasture pixels: within 300 m of cover (forest/shrub) or not.
- Where land cover is missing: forest fraction by slope bin (§4.2).
- County constants, refreshed each February from the MDC report: `ab_sqmi` and `tot_sqmi` (3-yr means, §1.1) and
  `W_county` (the same habitat weight computed over the whole non-urban county).
- Regime: APR in force or not (by county and year, §2.2), and pressure class (public-high / typical private / managed coop).

### 5.2 Formula [I — every coefficient is a default to tune against his camera and sighting data]
```
# 1. County anchor (per sq mi)
B_c   = ab_sqmi / h                       # h = 0.40 (0.32–0.50); 0.35 if APR, 0.43 if not
D_c   = B_c * (1 + Rdb * (1 + Rfd))       # Rdb 1.8 (1.5–2.2), Rfd 0.8 (0.6–1.0)
D_c   = clamp(D_c, tot_sqmi/0.30, tot_sqmi/0.18)   # Method B bounds

# 2. Habitat weight (area-weighted mean over the polygon)
w = { forest:1.0, shrub/early-succ/CRP:1.0, woody wetland:0.9,
      green forage ≤300 m of cover:0.9, row crop ≤300 m:0.7, row crop >300 m:0.2,
      pasture/hay ≤300 m:0.45, pasture/hay >300 m:0.2,
      developed open/low:0.15, developed med/high:0, water:0, barren:0.1 }
if forest share of (polygon + 1 km buffer) > 0.75: w.forest *= 0.8   # acorn-dependent big woods
W  = Σ area_i * w_i / A
Q  = clamp(W / W_county, 0.2, 2.0)

# 3. Outputs per polygon
deer   = D_c * Q * A/640                  # fall, pre-hunt, resident equivalents
bucks  = B_c * Q * A/640                  # antlered, 1.5+
does   = bucks * Rdb ;  fawns = does * Rfd
b25 = bucks * s25 ; b35 = bucks * s35 ; b45 = bucks * s45     # shares from §2.3 by regime/pressure
touch  = (A_m2 + P*r + π r²) / A_m2       # r from range size: 950 m fall, 1390 m rut
regular = residents * (1 + 0.27*(touch - 1))   # ≥25% of time there: ≈1.7× fall, ≈2× rut
```
Report every output as **low–typical–high** by running the low/high parameter sets (h, Rdb, Rfd, shares), and round:
1 decimal place under 5, whole numbers above.

### 5.3 Worked example (illustrative) [I]
A 1,000-ac Callaway block: 55% timber, 20% corn/soy within 300 m of timber, 5% interior crop, 15% fescue pasture next
to cover, 5% water and houses.
- County: B_c = 2.74 / 0.40 = 6.85 per sq mi. D_c = 6.85 × 4.24 = 29 per sq mi.
- W = 0.55 + 0.20 × 0.7 + 0.05 × 0.2 + 0.15 × 0.45 = 0.77. W_county ≈ 0.64 (from §4.1 cover, assuming 60% of crop
  and 70% of pasture lie within 300 m of cover). Q ≈ **1.2**.
- **Deer ≈ 54 (35–70). Antlered bucks ≈ 13 (10–16).** Callaway has no APR from 2025: 2.5+ ≈ 7, **3.5+ ≈ 3 (2–5),
  4.5+ ≈ 1.5 (0.7–3)**.
- Distinct bucks across the fall: ~45 antlered bucks touch the block at some point, about 20 use it regularly, and
  among the mature ones ~5 regular users and 10–15 that pass through, more in November.

### 5.4 Caveats — where the data is thin
- **No county age data.** The 3.5+/4.5+ shares come from a model fitted to statewide harvest ages that stop at 2021
  for 3.5+. The 2026 statewide APR removal will push yearling harvest up. Re-fit when MDC or NDA publish post-2026
  age data. Weakest number in the doc.
- **Harvest-to-population conversion** carries ±30% by itself (h, sex ratio, fawn ratio). County harvest also depends
  on effort, weather and mast (2024: −15% statewide on acorns and warmth). Hence the 3-yr mean.
- **Habitat weights are judgement**, informed by the direction of the research (Hanberry, Roseberry & Woolf, MO
  regional harvest) but not fitted to Missouri. **Calibrate with his trail cameras:** a 1 per 100 ac August survey
  (MU G9481) on one or two blocks gives a doe:buck ratio, fawn:doe ratio and buck count to replace Rdb, Rfd and Q.
- **Disease:** hemorrhagic disease (2007, 2010, 2012) knocked parts of Callaway down for years, and the region needed
  until ~2020 to recover (2018/2020 reports) [R]. A local HD year can cut a block well below the county number. CWD is
  present at low prevalence (Callaway 1 detection in 2024–25) [R].
- **Seasonal redistribution:** these are fall totals. Within a season deer pile onto green beans (Sep), oak flats
  (Oct), doe bedding (Nov) and standing grain or green wheat (Dec–Jan) (doc 07). The app should show *where* through its
  seasonal food model, not by changing the totals.
- **Urban ground:** Columbia and Jefferson City suburbs can hold high densities that are not hunted and are not in the
  harvest index. The app should not apply county numbers inside city limits.
