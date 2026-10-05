# 01 — Spartan Forge (spartanforge.ai) Competitive Research

Captured 2026-09-25. Sources at bottom. Tags: **[confirmed]** = vendor page/app store; **[review]** = third-party reviewer/forum; **[uncertain]** = conflicting or inferred; **[inferred]** = my technical deduction, not stated by vendor.

---

## 1. Overview

- **What:** Whitetail-first hunting map + "intelligence" app. Pitch: "the ONLY hunting app using science and data to predict whitetail deer movement." Combines hi-res aerial (UAV) imagery, LiDAR, parcel/ownership, weather, and a neural-net deer movement forecast.
- **Company:** Spartan Forge LLC (app store developer name). One aggregator attributes it to "American Mapping Company" **[uncertain]**. Android package `com.voidsoftware.outfitter` (suggests a contracted/acquired codebase originally named "Outfitter" **[inferred]**).
- **Founder/CEO:** Bill Thompson — ~20+ yrs Army intelligence (CW4, signals intel/AI for special ops), ex-DARPA advisor. Brand framing is military intel: "Find, Fix, Finish, Exploit, Analyze, Disseminate" targeting cycle; features named Intel tab, Battlemap, Blue Force Tracker, Eagle Eye, CyberScout. High media profile (Joe Rogan, Fox & Friends, many hunting podcasts).
- **Launched:** iOS release 2021-10-01. 100k+ Android downloads. iOS 4.3★ (631 ratings).
- **Latest release:** iOS 1.19.23 (~2026-09-24): "Updated Tracks Interface, Snap-To Measurements, Liquid Glass Support." 2026 cadence: Battlemap + CarPlay + tap-anywhere Land Info + two-finger measure (Jun 2026), CarPlay update (Jul), bug fixes (Aug).
- **Positioning vs onX:** Cheaper ($79.99 vs onX Premium $99.99 / Elite higher), plus prediction, LiDAR, UAV, historical imagery/weather, journaling. onX wins on polish, offline, parcel accuracy, network effect.
- **Species:** Whitetail core. Elk/western pages (slope <20° benches, north-slope bedding), hunt units by state, "Support for Waterfowl" (Dec 2024), even morel-hunting marketing. Eastmans' TagHub (western draw research) uses Spartan Forge as its map engine ("Maps & Charts 2.0" → `map.spartanforge.ai/login/taghub`).

---

## 2. Pricing & Platforms

| Item | Detail | Tag |
|---|---|---|
| Paid (single tier, all states, all features) | **$12.99/mo or $79.99/yr** ("save 51%") | confirmed (pricing page) |
| Trial | 7-day, card required, auto-charges | confirmed. Older reviews/App Store text say 14-day; billing confusion is a recurring 1★ theme |
| Free tier | App Store copy: "default maps, weather data, basic property ownership, drop and manage pins." Not documented on website | uncertain |
| Legacy/other IAPs in App Store | Monthly $7.99 / $8.99 / $12.99; yearly $39.99 / $59.99 / $79.99; **"Outfitter Subscription" $29.99** (undocumented) | confirmed (IAP list); legacy grandfathered "OG" pricing likely **[inferred]** |
| Promo codes | Affiliate codes e.g. 20% off (SeekOne) | review |
| Other reported prices | $9.99/mo, $95.90/yr (aichief.com) — conflicts with vendor; low-reliability source | uncertain |

**Platforms**
- iOS (incl. **CarPlay** since Jun 2026, iOS 26 Liquid Glass), Android 7.0+, **web app** `map.spartanforge.ai` (desktop).
- Multi-device sync; user content in a "My Content" tab (waypoints, tracks, teams).
- **Web-only features:** EagleEye oblique imagery, CyberScout AI (mobile in beta), Sun Exposure layer, split-screen maps. Desktop is the "power" surface; mobile is field surface.

---

## 3. Feature-by-Feature Breakdown

### 3.1 Deer Prediction ("Intel" tab)
- **What:** Daily forecast of deer behavior for the location under the **map crosshair** (not device GPS). Two outputs:
  - **Movement:** *Core Area (CA)* — deer stay near beds in daylight, below-average movement → hunt bedding-area stands. *Transition Area (TA)* — deer move beyond core to scrapes/food → hunt scrapes/food edges. *Full Range (FR)* — deer cover entire range, "like peak rut" → hunt scrapes, expect strange bucks.
  - **Pattern ("patternability"):** *Normal (NOR)* — expected timing/routes. *Abnormal (AB)*. *Very Abnormal (VA)* — unpredictable places/times.
- **How:** Neural network trained on GPS-collar datasets from state agency/university deer studies ("over 2,000 collective deer-years" per founder; site copy says "thousands of years of GPS deer collar data," "hundreds of GPS-collared deer"), joined to historic weather at those collar locations. Inputs at inference: forecast temp, wind speed/direction, barometric pressure, humidity, sunrise/sunset, moon overhead/underfoot/phase. Vendor admits moon's weight is unknown ("may not have any effect").
- **Accuracy claim:** 65–66% (internal/collared-deer test). Not independently validated. Predictions vary by nearby weather station, so two spots can differ.
- **Granularity:** Daily per location; no documented hourly curve or multi-week outlook **[uncertain — could exist in app; not in docs]**. No dedicated rut-phase calendar; "rut" is only an analogy for FR days. Reviewers wanted rut/migration data.
- **Why hunters like it:** Gives a *tactical recommendation* (which stand type to hunt today), not just a 1–5 star score. "Real collar data" story is credible vs competitors' pure weather heuristics. Great for deciding *which* day to burn PTO/sit a sensitive stand.
- **Criticism:** Forum skeptics call it barometer+temperature dressed up; "listening to an app instead of hunting"; one universal model, not personalized to your farm (STAT Outdoors contrast).

### 3.2 CyberScout™ (AI assistant)
- **What:** Hunting-specific LLM chat ("expert-trained hunting AI") in the web app; mobile in beta. Example prompts: "What does the optimal bedding area look like for a whitetail in PA?", turkey decoy setup.
- **How:** Q&A tactics/education. No evidence it reads your map, parcels, or LiDAR to auto-detect beds/funnels **[confirmed absence in docs; uncertain in app]**. Reviewer joke: "CyberScout will eat an afternoon."
- **Gap:** There is **no automated AI terrain analysis layer** (auto bedding/funnel/pinch-point detection) documented. Terrain "AI" is really the human reading LiDAR + slope + sun exposure. This is a major opportunity.

### 3.3 LiDAR
- **What:** "Customizable LiDAR" shaded-relief layer — **1 m for ~66% of Lower 48, 10 m elsewhere**. Reveals benches, saddles, ditches, drainages, old roadbeds, depressions, trails under canopy.
- **Customization:** Adjustable styling (reviewers mention combining with slope-angle shading); split-screen LiDAR vs imagery on desktop.
- **Why loved:** Most-praised feature across reviews ("puts Spartan Forge way ahead"); pairing LiDAR + slope to find flat benches for bedding is the canonical workflow.
- **Criticism:** Same data free on USGS/CalTopo; weak in some areas (southern Ohio report).
- **Source:** Coverage numbers match USGS 3DEP 1 m DEM + 1/3 arc-second (~10 m) seamless DEM exactly **[inferred — vendor never names source]**.

### 3.4 Imagery (UAV, historical satellite, EagleEye)
- **UAV imagery:** Aircraft-captured (not satellite) 5–15 cm; "3–10 years of historical imagery across ~60% of U.S." (older copy: 40%; 3–8 yrs). Leaf-off years available in many areas — key for seeing trails/beds under hardwoods. **Heavily Midwest-concentrated**; Southeast users complain. UAV coverage layer (Jun 2025) shows where it exists; UAV date selector.
- **Historical satellite ("Sat-1" replacement, Oct 2024):** Multi-year imagery across Lower 48 with date selector; ~1 m back to 2017. Use: timber cuts, burns, regrowth, ag changes.
- **EagleEye (web only):** 4 side-profile (oblique) views of terrain/vegetation in most UAV areas — see under edges/into draws hidden from nadir view. Four cardinal obliques strongly suggest a commercial aerial vendor (EagleView/Pictometry- or Nearmap-class) **[inferred]**.
- **Why loved:** "Outstanding high-resolution UAV imagery"; switching years is easy (easier than onX).
- **Complaint:** Downloadable offline imagery is much lower quality than online; pixelation when zoomed in rural areas.

### 3.5 3D maps
- Drag/tilt terrain in 3D from any angle/elevation. Battlemap drawings render in 3D but must be drawn in 2D. Useful to visualize saddles/benches and stand-to-bed sightlines.

### 3.6 Map layers & presets
- **Base/overlay layers (documented):** trails, roads, buildings, water, land cover, agriculture, public land, private land, **slope angle shading**, counties, cities, **timber cuts**, **fire history**, hunt units/GMUs (with **Hunt Unit Info Sheet**, Jun 2025), 10 ft contour topo ("configurable topo"), UAV coverage.
- **3 customizable map presets** (Jun 2024): save layer stacks (e.g., "LiDAR+slope", "UAV leaf-off", "parcels+sat") and flip between them in one tap. Compass-swipe gesture (toggleable). "One-tap terrain/slope/property boundary toggles."
- **Split-screen** comparison (web).
- **Complaint:** Layers "not as extensive nor customizable as onX"; missing national forests/trail detail in early versions; onX has oak/crop/timber layers SF lacks.

### 3.7 Parcel / landowner data
- Public & private boundaries all 50 states; owner name, tax/mailing address, physical address. **Tap any location → Land Info** sheet (Jun 2026). Users color-code borders by permission status (reported).
- **Complaint:** Ownership stale (sales ~2 yrs old still showing prior owner); public boundary accuracy below onX. Provider not disclosed **[uncertain — Regrid/LightBox/ReportAll-class aggregator likely]**.

### 3.8 Sun Exposure (web only)
- **What:** Terrain-shading layer: pick **month + time of day in 30-min steps**; auto-clamped to local sunrise/sunset. Color ramp yellow/red (sun) → green/blue (shade). Opened from compass toolbar; panel lower-left.
- **How:** Solar position + DEM slope/aspect + (claimed) obstructions → illumination/hillshade per time step **[standard hillshade-by-sun-position; inferred]**.
- **Hunting use:** Early-season bedding on shaded north slopes/benches; predict **thermals** (sun-warmed slopes → rising air mid-morning; shaded/cooling → falling air evenings); access-route planning; elk cool microclimates.
- **Why loved:** Makes thermals visible; unique vs onX. Reviewers highlight toggling by season/time for tactics.

### 3.9 Wind, weather, thermals
- **Hourly weather & wind forecast** for crosshair location.
- **Historical weather** via Journal: pick date + drop pin → temp, precip, wind direction, etc. **Historical wind plot / wind analysis** (prevailing wind by period) listed as a differentiator.
- **Wind/scent cone:** Some references to "wind cones" but no vendor documentation of a stand-pin scent cone overlay (HuntWise/onX have one) **[uncertain — treat as absent/weak]**.
- Thermals only via Sun Exposure (no explicit thermal-flow model).
- Weather provider undisclosed.

### 3.10 Moon / solunar
- Moon data shown (reviews mention "moon data"); moon overhead/underfoot is a model input. No dedicated solunar-table feature documented **[uncertain]**.

### 3.11 Battlemap (Jun 2026)
- Freehand drawing + text on map; stylus size/color/style; **arrow stylus** for thermals/routes/wind; text size/color; bottom-sheet style menu. Saves instantly, syncs mobile↔web. Draw in 2D only. **Not shareable between users yet** ("sharing capability soon").
- Replaces the old workaround of many pins + measure lines. Paired release: two-finger measure, updated measurements, snap-to measurements (Sep 2026).

### 3.12 Waypoints / pins / symbols
- Custom pin set (stands, sightings, access, avoid, etc.; "New Pins" 2024/2025), **multiple photos per pin** (Sep 2024), **distance-to-pin**, **directions to pin** (Dec 2024, incl. CarPlay driving). Import pins from other apps (onX/GPX).
- **Complaint:** Waypoint UX clunkier than onX; early versions couldn't view downloaded waypoints offline.

### 3.13 Tracks
- GPS track recording ("route tracking"); stored in My Content; **Tracks interface redesigned Sep 2026**. Little public detail.

### 3.14 Offline maps
- Download areas for no-signal use. Reported caps (older review): ultra-low res ~1,500 mi², low res 16 mi², high res only **2.25 mi²** per download; offline imagery quality poor. **Biggest field complaint** vs onX/BaseMap **[review; may have improved]**.

### 3.15 Journaling / harvest logging
- Paid feature. Entry auto-captures **GPS + weather**; notes; individual deer sightings per entry; photos (trail cam captures can be logged manually); entries **pinned to map**. No built-in analytics/insights documented. Journal UI called "overly busy."
- No dedicated harvest-log/scorecard workflow documented **[uncertain]**.

### 3.16 Sharing / groups — Blue Force Tracker
- Draw a boundary polygon, invite buddies → **pins dropped inside the polygon auto-share to the group in real time** (stands, sightings, access, hazards). Live teammate *location* sharing: not clearly documented **[uncertain]**; moge.ai claims location sharing.
- **Why loved:** Zero-friction group intel on a lease — no manual "share" per pin.
- **Constraint:** Network effect — "80%+ of hunters/landowners use onX," so shared data often lives elsewhere.

### 3.17 Trail cameras
- **No integration** (no cellular cam feeds, no photo AI). Only manual journal/pin photos. Competitors (Trail Pro Intel, HuntStand/Tactacam, Moultrie, Spypoint apps) fill this.

### 3.18 Rut predictions
- None as a standalone calendar/map. Only FR "rut-like" days and blog tactics. Opportunity.

### 3.19 Other
- **CarPlay** (drive to pin, land info while driving back roads — great for door-knocking permission).
- Slope-angle mapping, 10-ft contours, general map settings, hunt-unit info sheets, fire history, timber cuts.
- Eastmans' TagHub engine; Pro program via GuideFitter; Outfitter SKU.

---

## 4. Data Sources & Likely Tech

| Data | Vendor statement | Likely actual source |
|---|---|---|
| LiDAR / elevation | "1 m for ~66% of Lower 48, 10 m remainder" | **USGS 3DEP** 1 m DEM + 1/3″ seamless DEM **[inferred, high confidence]** |
| Contours | 10 ft | Derived from DEM **[inferred]** |
| Slope, sun exposure | Custom layers | DEM-derived slope/aspect/hillshade by solar position (e.g., NOAA SPA / SunCalc) **[inferred]** |
| UAV imagery 5–15 cm + EagleEye obliques | "aircraft, not satellites," 2016+ | Licensed commercial aerial survey (EagleView/Nearmap-class, 4-way obliques) **[inferred]** |
| Historical satellite ~1 m, 2017+ | Multi-year Lower 48 | Could be NAIP (60 cm–1 m, leaf-on) and/or commercial basemap vendor **[uncertain]** |
| Parcels/owners | 50 states | Commercial aggregator (Regrid/LightBox/ReportAll-class) **[uncertain]**; staleness complaints consistent with infrequent refresh |
| Public land / hunt units | All states | PAD-US + state agency GMU layers **[inferred]** |
| Timber cuts, fire history | Layers | Likely USFS/Global Forest Change (Hansen) + MTBS/NIFC fire perimeters **[inferred]** |
| Weather (forecast + historical) | Hourly + historical | Undisclosed commercial/NOAA-based API **[uncertain]** |
| Prediction training | GPS-collar studies from state agencies/universities, 2,000+ deer-years | Partnerships (not named publicly) |
| Infra | "Custom map servers," scaled for 500k users | Self-hosted tile servers **[confirmed claim, stack unknown]** |

---

## 5. What Makes the Experience BEST (UX patterns)

1. **Crosshair-driven context.** Intel/weather follow the map center, not the phone's GPS → plan any spot from the couch; scrub the map, the forecast updates.
2. **Recommendation, not a number.** CA/TA/FR each map to a concrete tactic ("hunt your bedding stand today"). Categorical states are easier to act on than a 0–100 score.
3. **Saved layer presets (3 slots) + one-tap toggles.** Terrain analysis = rapidly flipping LiDAR/slope/UAV/parcel stacks; presets make that one tap.
4. **Time-scrubbable layers.** Imagery year selector, UAV date selector, sun-exposure month/half-hour slider, historical weather date picker. "Time as a dimension" is the core e-scouting UX.
5. **Split-screen compare** (LiDAR vs imagery, slope vs coverage) on desktop.
6. **Desktop for planning, phone for execution, instant sync.** Heavy tools (EagleEye, Sun Exposure, CyberScout) live on web.
7. **Geofenced auto-sharing (Blue Force Tracker).** Pins inside the group polygon share automatically — no per-pin share step.
8. **Freehand Battlemap with arrow stylus** — draw access routes, wind, thermals like on paper; faster than pins+lines.
9. **Tap-anywhere Land Info** and **CarPlay** directions-to-pin — permission-knocking and access workflows.
10. **Oblique "look under the edge" imagery** (EagleEye) — novel e-scouting.
11. **Founder-accessible support / community** — reviews repeatedly credit Bill's responsiveness on social.
12. **Military-intel brand language** gives features memorable names and a coherent mental model (Intel, Battlemap, Blue Force).

---

## 6. Weaknesses, Gaps & Complaints

**Frequent complaints (reviews/forums)**
- **Offline maps** weak: tiny high-res download caps, low-quality offline imagery; onX/BaseMap better.
- **Parcel data stale/inaccurate**; public boundaries below onX.
- **UI clunky / less intuitive** than onX for waypoints & navigation; low-contrast text, small tap targets; busy journal; historic crashes in Intel tab.
- **Desktop** once called "basically unusable" (older); now core platform — improved but mixed.
- **UAV coverage uneven** — Midwest-heavy; Southeast/West gaps; pixelation zoomed-in rural.
- **LiDAR not exclusive** — free from USGS/CalTopo; skeptics question paying.
- **Prediction skepticism** — "barometer + temp," unvalidated 65–66%, not personalized, not location-learning.
- **Billing/trial friction** — card-required trial auto-charges; 7 vs 14-day confusion; cancellation complaints.
- **Network effect** — friends/landowners on onX; data sharing hard.
- **Feature fragmentation** — key tools web-only (Sun Exposure, EagleEye, CyberScout).

**Functional gaps (vs a "complete" whitetail app)**
- No automated terrain AI (bed/funnel/saddle/pinch detection).
- No stand-pin wind/scent cone with forecast timeline (undocumented at best).
- No explicit thermal flow model beyond sun shading.
- No rut calendar/state rut data.
- No trail-camera integration or photo AI.
- No analytics over journal data (sightings vs wind/temp/moon correlations).
- No personalized model from user's own logs.
- Battlemap not shareable; no per-stand "best wind" rules/alerts.
- No harvest-report/tag integration for eastern states (TagHub is western).

---

## 7. Ideas to Steal / Improve — Missouri-focused, free-data, self-hosted (Spartan Forge + onX)

**Steal directly**
- Crosshair-driven Intel panel (forecast + tactic for map center).
- Categorical daily movement state with tactic text (CA/TA/FR analog) + pattern confidence.
- 3+ saved layer presets, one-tap toggles, split-screen/swipe compare.
- Time sliders on every temporal layer (imagery year, sun month/half-hour, weather date).
- Geofenced group auto-share polygons.
- Freehand draw with arrow stylus; snap-to and two-finger measure.
- Tap-anywhere parcel/land info; directions to pin.
- Journal entry auto-stamps GPS + weather (historical backfill by date).

**Beat them with free Missouri data**
- **Elevation/LiDAR:** USGS 3DEP 1 m DEM (Missouri coverage extensive — verify statewide via 3DEP index) + MSDIS (Missouri Spatial Data Information Service) LiDAR/DEM. Render multi-directional hillshade, slope, TPI, curvature, geomorphons locally (GDAL/WhiteboxTools) → self-hosted PMTiles/MBTiles.
- **Imagery:** NAIP (60 cm, leaf-on, multiple years, free) with year slider; MSDIS county/state orthos for leaf-off where available **[verify]**; USGS/Esri Wayback-style year compare only if licensing permits.
- **Public land:** MDC Conservation Areas (boundaries + area regs/brochures), Mark Twain NF (USFS), USACE lakes, PAD-US, MDC MRAP (Missouri Recreational Access Program) private lands open to public. Overlay managed-hunt/draw areas.
- **Parcels:** No free statewide MO parcel layer **[verify]** — aggregate counties that publish open GIS; fall back to Regrid free/county links; show "last updated" date per county to avoid SF's stale-data trust problem.
- **Land cover/food:** USDA Cropland Data Layer (annual crop type: corn/soy/winter wheat = food sources), NLCD forest/edge, NHD streams/ponds, USFS timber harvest + Hansen forest-loss for fresh cuts, MTBS/prescribed burns.
- **Weather:** NWS api.weather.gov (hourly forecast, free), Open-Meteo (forecast + ERA5 historical back decades, free) → historical wind roses per stand, backfilled journal weather.
- **Sun/moon:** SunCalc (client-side) → sun-exposure layer on all platforms (SF's is web-only), moon phase/rise/overhead/underfoot, legal shooting hours (MO: 30 min before sunrise to 30 min after sunset).

**Improve on Spartan Forge's gaps**
- **Automated terrain analysis ("AI Scout" layer):** DEM + land cover rules/ML to flag candidate **benches** (slope <~8–10° on/below steeper sideslopes), **saddles** (geomorphon/TPI), **pinch points/funnels** (narrow timber between ag/open, creek crossings, fence/field inside corners from NLCD/CDL), **thick-cover bedding** (leeward of ridges, south/east-facing cover in cold, north slopes in heat), ranked with explanations. Clearly label as hypotheses.
- **Wind + scent cone per stand pin** with hourly forecast scrubber; per-stand "good winds" rule → green/red stand list for each hour; access-route downwind check (route line vs scent cone vs bedding polygons).
- **Thermal model:** combine sun exposure + time + slope aspect → rising/falling thermal arrows by hour (morning upslope after sun hits, evening downslope); overlay with wind.
- **Missouri rut calendar:** MDC rut/breeding research (peak breeding typically mid-November **[verify with MDC]**) + firearms/archery season dates + moon; show phase bands (seeking/chasing/breeding/post) on the Intel timeline.
- **Movement index without collar data:** transparent, rule-based score from published whitetail research (temp drop vs prior days, pressure trend, wind speed, precip ending, moon position, rut phase); later calibrate with user sightings (personalization SF lacks). Optionally correlate MDC daily county harvest (Telecheck summaries) with weather as a weak ground truth **[feasibility unverified]**.
- **Journal analytics:** sightings/harvests vs wind, temp, pressure, moon, time → "your best conditions for Stand X."
- **Trail cam:** manual import with EXIF time/location + weather backfill; group by camera pin; later optional local image classifier (buck/doe/none) self-hosted.
- **Offline first-class:** large high-res region downloads (whole county) from self-hosted PMTiles; offline includes pins, tracks, parcels, LiDAR, presets — SF's #1 complaint.
- **Trust:** show data vintage/source on every layer (parcel date, imagery year, DEM source).
- **Missouri regs context:** season dates, CWD management zone/antler-point restriction counties, MDC area rules on tap.
- **Share everything:** Battlemaps, presets, stand sets shareable to group (SF can't); GPX/KML/onX import-export to break network-effect lock-in.
- **Whitetail/bowhunting specifics:** 20–40 yd range rings around stand pins; shooting-lane/visibility cues from 3D; entry/exit route planner avoiding bedding polygons and ag field edges at dawn; stand "last hunted" timer to limit pressure.

---

## 8. Sources

Vendor
- https://spartanforge.ai/
- https://spartanforge.ai/pages/pricing
- https://spartanforge.ai/pages/deer-prediction
- https://spartanforge.ai/pages/cyberscout%E2%84%A2
- https://spartanforge.ai/pages/blue-force-tracker
- https://spartanforge.ai/pages/sun-exposure
- https://spartanforge.ai/pages/mapping-tech
- https://spartanforge.ai/pages/mission
- https://spartanforge.ai/pages/whitetail-hunting
- https://spartanforge.ai/pages/elk-hunting
- https://spartanforge.ai/pages/hunting-app-comparison
- https://spartanforge.ai/blogs/journal/introducing-battlemap
- https://spartanforge.ai/blogs/journal/new-feature-sun-exposure-layer
- https://spartanforge.ai/blogs/journal/new-update-historical-imagery-for-lower-48-states
- https://spartanforge.ai/blogs/journal/the-intel-tab-breaking-down-deer-movement-type
- https://spartanforge.ai/blogs/journal/the-intel-tab-deer-pattern-types
- https://spartanforge.ai/blogs/journal/journaling-to-success
- https://spartanforge.ai/blogs/journal/scout-through-the-years-with-historical-weather
- https://spartanforge.ai/blogs/journal/the-ultimate-app-overview-w-ceo-bill-thompson

App stores / listings
- https://apps.apple.com/us/app/spartan-forge-hunt/id1562873100 (description, IAPs, version history, privacy)
- https://apps.apple.com/us/app/spartan-forge-hunt/id1562873100?see-all=reviews
- https://play.google.com/store/apps/details?id=com.voidsoftware.outfitter
- https://apkpure.com/spartan-forge-hunt/com.voidsoftware.outfitter
- https://mwm.ai/apps/spartan-forge-hunt/1562873100
- https://justuseapp.com/en/app/1562873100/spartan-forge/reviews

Reviews / press / comparisons
- https://www.outdoorlife.com/hunting/spartan-forge-hunting-app/
- https://fieldethos.com/tested-spartan-forge-hunting-app/ (2025-09-13)
- https://fieldethos.com/spartan-forge-hunting-app/ (2022-11-22)
- https://www.sufferingoutdoors.com/2023/02/onx-hunt-vs-spartan-forge.html
- https://www.statoutdoors.com/blog/best-hunting-apps-2026
- https://www.trailprointel.com/blog/best-hunting-apps-2026
- https://www.trailprointel.com/blog/best-free-hunting-app-2026
- https://huntiq.org/blog/the-ultimate-hunting-app-comparison-guide/
- https://landtrust.com/post/from-battlefield-intelligence-to-whitetail-insights-how-spartan-forges-bill-thompson-is-reengineering-hunting-tech
- https://blog.eastmans.com/spartan-forge-battle-map-explained-a-hunters-review/ (2026-08-31, content not retrievable)
- https://eastmans.com/products/eastmans-taghub-spartan-forge-members-special-landing/
- https://seek-one.com/products/spartan-forge-app-download
- https://moge.ai/product/spartan-forge
- https://aichief.com/ai-lifestyle-tools/spartan-forge/ (low reliability; conflicting prices)

Forums (Reddit not reachable via search tools; forum threads used instead)
- https://www.hunttalk.com/threads/spartan-forge.328840/ (2025-04-21)
- https://rokslide.com/forums/threads/onx-vs-spartan-forge.363151/ (403; via search snippets)
- https://rokslide.com/forums/threads/spartan-forge-thoughts.313244/ (403; via search snippets)
- https://www.rokslide.com/spartan-forge-review/ (403; via search snippets — offline caps, layer list, Eagle Eye)
- https://www.archerytalk.com/threads/spartan-forge-in-2024.6249014/ (paywalled; snippets only)

YouTube (titles located, not transcribed)
- https://www.youtube.com/watch?v=HAFDG3fehdM (Ultimate App Overview w/ CEO)
- https://www.youtube.com/watch?v=r_xw5DTQSoM (2026: onX vs Spartan Forge vs GoHunt vs HuntWise vs BaseMap)
- https://www.youtube.com/watch?v=oaISsCMlT7M (Spartan Forge Review & Walkthrough 2024)

Data reference
- https://www.usgs.gov/3d-elevation-program/about-3dep-products-services
