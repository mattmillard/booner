# onX Hunt — Competitive Research

Researched 2026-09-25. Sources: onxmaps.com pages, onX support docs, App Store listing, press releases, hunting forums, trade press. Anything marked **[unverified]** could not be confirmed from a primary source. Anything marked **[competitor claim]** comes from a rival's comparison page.

---

## 1. Overview

- **Company:** onXmaps, Inc. Private, based in Missoula MT, founded 2009, about 400 employees. It started out selling SD chips that added land ownership data to Garmin GPS units, then moved to mobile apps in 2013. The Garmin chips were discontinued on Dec 31 2025.
- **Funding:** $87.4M Series B from Summit Partners (2024), plus a "strategic investment" from TCV announced Nov 3 2025.
- **Product family:** onX Hunt (the flagship), onX Offroad, onX Backcountry, onX Fish (Midwest from Apr 2025, Montana from May 2026; built on the TroutRoutes acquisition). Also owns Mountain Project. FieldRegs is a free, separate regulations app.
- **Scale claims (App Store, Sep 2026):** 1.8B acres of public land, 161.5M private parcels, 15,880 hunting units, 420+ map layers, 400k+ miles of trails, 50k+ campgrounds. App Store rating is 4.9★ from about 274k ratings, #11 in Navigation. Latest version is 26.37.0 (a weekly release cadence, notes usually say "bug fixes").
- **Positioning:** "The" hunting GPS app, with a lot of public-land advocacy branding (corner-locked report, MAPLand easements, Public Land Comment Hub, Pheasants Forever P.A.T.H. access). Brand partnerships include MeatEater, Ford (a free year of Elite for eligible owners, Mar 2026), T-Mobile T-Satellite (Oct 2025), Moultrie, Bushnell, SIG, Leica, and Leupold.

---

## 2. Pricing & Platforms

| Tier | Price | Coverage | Notes |
|---|---|---|---|
| Free / "Basic" | $0 | Satellite view only | No longer marketed by name. Land ownership, offline maps and layers are "limited". |
| Premium | $34.99/yr | 1 state | Was $29.99; a stale $29.99 IAP still appears in the App Store. |
| Premium Two-State | $49.99/yr | 2 states | |
| Elite | $99.99/yr or $14.99/mo | All 50 states + Canada | Monthly works out to $179.88/yr. |
| Free trial | 7 days | Full Elite | |
| onX SOS add-on | $49.99/yr | — | Rescue coordination plus SAR/medevac coverage (Overwatch x Rescue). |
| Imagery on Demand | $59.95 per image | — | Elite. Custom high-res satellite capture, delivered in under a week on average. |

**What Premium includes:** land ownership, GMUs, basemaps (satellite/topo/hybrid/3D), all layers for the chosen state, waypoints, tracker, line distance, area shape, wind/weather, offline maps (including 3D offline), sharing, collaborative folders, location sharing, trail cam management and deer-only alerts, connected optics, and track trimming.

**What only Elite adds:** nationwide + Canada, Lidar (including offline), TerrainX (desktop), Recent Imagery (updated every two weeks, with historic look-back), Leaf-Off Imagery (21 states **including MO**), Imagery on Demand, Route Builder, Trail Camera Analysis (web), Hunt Research Tools (draw odds for 11 western states), Huntin' Fool and HuntReminder access, Pro Deals, and expert courses. The Elite page also lists "In-Dash navigation", but the 2023 launch said CarPlay/Android Auto was standard, so the CarPlay tier is **[unclear]**.

**Tier unclear:** Deer Movement Forecast, Whitetail Insights, and Rut Calendar. The pages only say "subscribers / 7-day trial", which suggests Premium+ **[unverified]**.

**Platforms:** iOS (needs iOS 18+, 660 MB), Android, a desktop Web Map (webmap.onxmaps.com; all markups sync), Apple CarPlay, Android Auto, and Apple Watch (drop a waypoint from the wrist). Garmin has **no native sync**: you export GPX/KML and import through Garmin Explore/BaseCamp. Commercial use needs an "onX for Business" license.

---

## 3. Feature-by-Feature Breakdown

### 3.1 Land ownership (the core moat)
- **What:** Nationwide public land, color-coded by agency (USFS, BLM, state, etc.), with private parcels outlined in red. Tapping a parcel opens an info card with owner name, tax/mailing address, acreage, and coordinates. The "Possible Access" layer shows private land that may allow hunting (timber companies, conservation groups; about 150k acres in MO). Walk-in / Block Management layers are state-specific. onX claims 3.5M+ acres of government land and 2.7M+ parcels in MO **[from onX's MO marketing page; not re-verified]**.
- **How:** Aggregated from county, state and federal records (3,100+ of 3,143 counties) plus private vendors for owner and attribute data. Parcel shapes always come from counties; owner names can come from vendors because vendors update faster. In-house GIS cleanup and a curation team review the data. Parcel coverage is **not complete** in every county (onX publishes a coverage map). Updates run every 1–2 years, weekly in "active" regions. onX claims 5–10 ft typical accuracy, 5–50 ft by county, and says it is not a survey.
- **Why hunters love it:** It answers "can I legally be here, and who do I ask?" in one tap. That single capability is why the market pays.

### 3.2 Hunting units / GMUs & regulations
- Unit boundaries per state and species (15,880 units). The unit card links to the agency regulations. In MO this includes the Deer Firearm and Deer Archery unit layers.
- Regulations are **not** parsed into the app. They are external links. onX spun off **FieldRegs** as a free app: turkey and bear regs so far, offline bookmarks, and an "onX Guide" Q&A that is probably AI **[unverified]**.
- **Hunt Research Tools (Elite):** draw odds, tag trends, harvest rates, hunter density, and % public land for 11 western states (AK, AZ, CA, CO, ID, MT, NV, NM, OR, UT, WY; not WA). Can be filtered by species, sex, weapon, dates, and youth/veteran eligibility, and jumps straight to the unit on the map. Built from the TopRut acquisition.

### 3.3 Basemaps & imagery
- Satellite, Topo, and Hybrid are proprietary basemaps.
- **Recent Imagery (Elite):** medium resolution, updated every ~2 weeks, with a scroll-back history for snow lines, crop harvest, timber cuts and water. It made TIME's Best Inventions of 2023. It is lower resolution and can be clouded over.
- **Leaf-Off (Elite):** 30–50 cm, in 21 eastern/midwest states including MO.
- **Imagery on Demand (Elite):** $59.95 per custom tasked image, stitched onto the map.
- Offline high-res is limited. Since 2018 the imagery vendor has not allowed the highest zoom to be saved offline.

### 3.4 3D maps
- Mobile (iOS, and Android since the "seven new features" fall release, circa 2024 **[date unverified]**) and desktop. Two-finger tilt. All layers and markups drape over the terrain, and elevation exaggeration helps in flat country (Midwest). 3D offline works with any paid tier (2026).

### 3.5 Lidar (Elite)
- Shaded-relief lidar showing benches, ditches, old logging roads and micro-drainages, with about 10 cm vertical accuracy claimed. Available offline for Elite. The source is not disclosed but is almost certainly USGS 3DEP **[unverified]**.

### 3.6 TerrainX (Elite, desktop only)
- Four sliders-driven filters: **Elevation Band** (highlight an elevation range), **Slope Angle** (degree range), **Slope Aspect** (compass-wheel selection), and **Viewshed** (everything visible from a point, shown as a bullseye with radius rings). Used to find benches, saddles, glassing knobs, and south-facing winter range. There is also a standalone Slope Angle gradient layer for everyone.

### 3.7 Offline maps
- Draw an area and pick High/Med/Low resolution; the app estimates size and shows free storage. Limited only by device storage. Layers, markups, tools and GPS all work offline, and edits sync on reconnect. The list of saved offline areas syncs across devices, but downloads are per device. onX recommends overlapping saves.

### 3.8 Waypoints, markups & organization
- About 100 icons (species plus sign: rub, scrape, roost, stand, trailhead, etc.) and 10 colors. Waypoints take photos and notes, plus Go-To navigation. **Markup Folders** (same fall release, circa 2024 **[date unverified]**) can be toggled on and off as a group. Import/export in GPX and KML. You can share up to 100 markups at once.
- There is **no dedicated harvest log or hunt journal**. Users log harvests with waypoint icons and notes. **"Hunt Planner" is not an onX term.** The closest equivalents are Folders + Route Builder + Web Map.

### 3.9 Tracker (breadcrumbs)
- "Go & Track": records in the background as a blue dashed line, with duration, distance, elevation gain/loss and average speed. Track trimming (Premium+). You can restyle color, weight and dash. Battery-saver settings hurt accuracy.

### 3.10 Measurement tools
- **Line Distance:** point-by-point line with distance and elevation. Since 2026 the endpoints are dynamic (drag to adjust live). Used for stalk planning and shot distance.
- **Area Shape:** polygon acreage for food plots and property.
- **Route Builder (Elite):** "Snap To" roads/trails, or free-draw "Point Draw". Pairs with **Navigate-To** turn-by-turn, including in-dash.

### 3.11 Wind, scent & weather
- Weather is point-and-tap anywhere on the map: 100k+ stations refreshed every 15 min, current conditions, hourly, a 2-week daily outlook, precipitation, barometric pressure trend, sunrise/sunset and moon phase.
- **Optimal Wind:** on any waypoint (stand), select up to 7 acceptable wind directions. The waypoint then shows a live green/yellow/red badge (scent carried away from, mostly away from, or toward the target area).
- **Wind Calendar:** a 7–8 day hourly grid, color-coded per stand. **Wind Comparison** puts several stands side by side, so you can pick which stand to sit, and when.
- There is **no scent-cone visualization** on the map (a Spartan Forge / HuntStand-style cone), and **no thermals modeling** **[not found in any onX material]**. "Hunt Wind" is not an onX feature name.
- **Solunar:** moon phase only in Hunt. Majors/minors are confirmed in onX Fish, not Hunt **[unverified for Hunt]**.

### 3.12 Whitetail intelligence (2025–2026, the Spartan Forge competitor)
- **Deer Movement Forecast:** hour-by-hour activity odds for a map point. It is an ML model trained on 100M+ anonymized trail-cam images plus 50+ environmental variables (temperature, wind, pressure, moon, and so on).
- **Rut Calendar** (new for 2026): rut phase at your coordinates, from photoperiod and historical fetal-aging data.
- **Whitetail Insights** (new Aug 2026): one location-based view combining Rut Calendar, Deer Movement Forecast, trail cams and wind/weather.
- Habitat layers include Acorn-Producing Oaks (white/red/mixed), deciduous vs coniferous, Thermal Deer Cover, US Crop Distribution (CDL), Timber Cuts, Historic Wildfire, Wetlands, Soil Capability, and Young Aspen. The CWD layer uses NDA county data.

### 3.13 Trail camera integration
- Cellular auto-sync from **Moultrie, Bushnell, Covert, and Browning (Strike Force Wireless)**. Tactacam/Spypoint are not supported as of this research. SD card uploads work from any brand.
- Premium: a central camera manager (locations, battery, status) and AI deer-only notifications.
- Elite: **Trail Camera Analysis** (web only) charts deer sightings by hour, weekday and season, and cross-references historical wind speed and direction at each detection. It feeds into Deer Movement Forecast.

### 3.14 Sharing, collaboration & group hunts
- **Share markups:** view-only for the recipient (needs an onX account). Your later edits sync to them, and you can revoke access.
- **Collaborative Folders (Premium+):** View-only, or "Contribute" (others can add but not edit or reshare).
- **Offline "Share Nearby":** pushes markups device to device with no cell service, same platform only (iOS↔iOS, Android↔Android), and edits after sharing don't sync.
- **Live Location Sharing (Premium+, 2026):** up to 10 people per session, updates every ~5 s, invite by link, shows last-known position and timestamp when someone drops signal, data deleted at session end, needs cellular, Wi-Fi or satellite data. (CoHunt's 2026 comparison says onX has "no real-time group tracking". That is outdated **[competitor claim]**.)
- **onX SOS (Jul 2026):** an in-app SOS button over cell or phone-satellite, run by Overwatch x Rescue (FocusPoint). $49.99/yr includes SAR/medevac cost coverage with no deductible.

### 3.15 Connected devices
- **Connected Optics:** ranging a target drops a waypoint at the ranged location. Works with SIG KILO series (the 8K and 10K have a compass), Leica (via the LeicaHunt2 app), and Leupold RX-5000 TBR/W (via Leupold Control).
- **Apple Watch:** drop waypoints.
- **CarPlay / Android Auto:** offline maps, land boundaries, markups, basemaps and Navigate-To. Android Auto only shows the Private, Government and Pheasants Forever layers.
- **Garmin:** file export only (see Platforms).

### 3.16 Web Map (desktop)
- Full-screen e-scouting with 3D and exaggeration, TerrainX, Viewshed, Trail Cam Analysis, import/export and bulk management. Printing goes through the browser print dialog (clunky; users on Rokslide complain about large-format printing).

### 3.17 Other layers of note
- Motorized Roads & Trails (MVUM: surface, vehicle class, open dates), Forest Visitor Maps, Roadless Areas, Dispersed Camping, Trails & Trail Slope, Wildfire perimeters, Game Distribution, Cell Coverage (Offroad), and the Public Land Comment Hub (2026).

---

## 4. Data Sources & Likely Tech

| Data | Source (confirmed / likely) |
|---|---|
| Parcel geometry | County assessor/GIS offices (confirmed), cleaned in-house. |
| Owner / attribute data | County records plus unnamed private vendors (confirmed). Vendors are not disclosed. Regrid, LightBox (ex-Digital Map Products) and ReportAll are the candidates; any specific vendor is **[unverified]**. |
| Public land | Federal (PAD-US, BLM SMA, USFS), state agencies, plus onX's own curation (likely). |
| Hunting units | State wildlife agency GIS (likely). |
| Easements | MAPLand Act federal easement records (onX publicizes these). |
| Lidar | USGS 3DEP (likely). |
| Crops | USDA NASS Cropland Data Layer (likely; the layer is called "US Crop Distribution"). |
| Tree species | USFS forest type / FIA-derived rasters (likely). |
| Satellite basemap | Licensed commercial imagery (vendor unnamed; it restricts offline max-res). Recent Imagery at medium res every 2 weeks looks like Planet/Sentinel-class **[unverified]**. Imagery on Demand = tasked commercial capture (Maxar/Airbus-class **[unverified]**). |
| Weather | 100k+ stations, 15-min refresh. Vendor unnamed. |
| Deer Movement Forecast | Proprietary ML on 100M+ trail-cam images (partner cameras) plus weather. |
| Tech stack | Not published. Vector tile rendering with a custom offline tile packaging system is very likely. No engineering blog found. |

---

## 5. What Makes the Experience BEST (UX patterns)

1. **One tap → answer.** Tap anywhere and get a card with owner, acreage, unit, and weather at that point. No mode switching, no search box needed.
2. **Color language hunters already know.** Public land by agency color (BLM yellow, USFS green, state blue, and so on), private in red. You can read the map at a glance at arm's length in the truck.
3. **The layer menu is scoped by state, then category** (Current Conditions / Land & Access / Roads-Trails-Rec / Trees-Crops-Soil / Wildlife), with sub-options behind "View Options". Hundreds of layers without drowning the user.
4. **Waypoint-centric decision tools.** Wind, forecasts and trail-cam data attach to the stand waypoint. A stand becomes a live object with a traffic-light badge (Optimal Wind), not just a pin.
5. **Offline is first-class.** Resolution picker, size estimate, free-storage display, everything works offline, sync on reconnect, and saved areas are listed on all devices.
6. **Seamless phone ↔ desktop ↔ truck.** Scout on the big screen at night, and it is on your phone and in-dash the next morning.
7. **Social glue.** Sharing folders and live location means everyone in camp needs onX, which creates a network effect. Forums keep saying people pick onX "because my buddies use it".
8. **Progressive disclosure through tiers.** The basics are dead simple. Power tools (TerrainX, Lidar, Research) live on desktop or Elite and don't clutter the phone.
9. **Content marketing ecosystem.** Huge SEO blog (state season guides, rut predictions), Elite courses, and ambassadors. It teaches users how to use the product for hunting, not just what the buttons do.
10. **Fast, frequent releases** (weekly versions) and a visibly responsive support team (praised in App Store reviews).

---

## 6. Weaknesses, Gaps & Complaints

- **Property line accuracy.** Users report lines 20–50 ft off, especially on N/S boundaries. There are fence-line disputes, and onX disclaims liability. Owner data can lag years behind sales. Some counties have no parcels. (Rokslide, GON, LongRangeHunting, TractorByNet threads.)
- **Imagery quality and age.** A common complaint is that it is "blurrier/older than Google Earth". HuntStand is widely considered to have better imagery. The highest res is not available offline (since 2018). Leaf-off only covers 21 states and is Elite-only. Recent Imagery is low-res and cloudy.
- **Price and paywall creep.** Per-state pricing punishes travelers. Lidar, leaf-off, TerrainX, route builder and trail cam analysis are all Elite ($99.99). The free tier is effectively gone and undocumented. Premium went up $29.99 → $34.99. The SOS add-on costs extra. Trail cam: "the feature is real; the paywall in front of it is too" (Trail Pro Intel, competitor).
- **Desktop-only power tools.** TerrainX and Trail Cam Analysis are web only.
- **No thermal or scent-cone modeling, and no real solunar in Hunt.** Wind is a direction badge, not a spatial scent model. This is a clear gap vs Spartan Forge / HuntStand.
- **No harvest log or journal, and no in-app regulations.** Regs are links out, or you use a separate app (FieldRegs).
- **Garmin interop is manual** (file export). The Garmin chips were discontinued in 2025.
- **Offline share is same-platform only.** Shared markups are view-only, and "Contribute" folders can't edit others' pins.
- **Trail cam brand lock-in.** No Tactacam/Spypoint/Reveal auto-sync.
- **Reliability reports:** black screens, lost tracks when the app is killed, offline maps not loading, slow on older Android, subscription not recognized, crashes after KML import (justuseapp aggregate, archerytalk/rokslide threads). Battery drain comes up during tracking.
- **Printing** is browser-print only, with poor large-format support.
- **Privacy and ethics.** Waypoints were subpoenaed in the Wyoming corner-crossing case ("Waypoint 6"). There are fears about data aggregation, "secret spot" erosion and crowding (Outdoor Life "The onX Effect"). onX denies selling markups. A competitor says the privacy policy allows targeted-ad data sharing **[competitor claim]**.
- **Midwest/whitetail depth is newer.** Hunt Research Tools only cover the West. There is no MO-specific draw/harvest analysis.

---

## 7. Ideas to Steal / Improve (Missouri-focused, free-data, self-hosted; Spartan Forge + onX)

**Match onX's table stakes (free data makes this feasible for MO):**
1. **Tap-anywhere info card:** parcel (owner, acres, parcel ID), public area name and agency, MO deer unit, and a weather/wind strip. Everything within one tap.
2. **Parcels:** MO has no statewide free parcel layer. Aggregate county GIS/assessor feeds (many MO counties publish ArcGIS REST services) and be honest about coverage with a county coverage map like onX's. Show "data as of" dates per county, which onX does not do and users would value.
3. **Public land:** MDC Conservation Areas (MDC GIS open data), Mark Twain NF (USFS), USACE lakes, National Wildlife Refuges, MRAP (MDC's walk-in private-land program, the MO equivalent of Possible Access), and PAD-US for gaps. Use onX's agency color language.
4. **MO deer and turkey units + parsed regs:** do what onX *doesn't*. Link each MDC Conservation Area to its area-specific regulations (MDC's "Area Deer Quick Regs"), season dates, and managed-hunt info inside the card. Add the MDC county harvest history (Deer Harvest Map data) as a choropleth layer: a free Midwest version of onX's western-only Research Tools.
5. **Offline done right:** a resolution picker, size estimate and storage meter. Because we self-host, we can allow **full-res offline** for free imagery (NAIP 60 cm, MO leaf-off orthos from MSDIS). That beats onX's offline res cap.
6. **Free imagery stack:** NAIP (multiple years for a time slider, beating onX's paid "historic look-back"), USGS 3DEP lidar hillshade and slope for everyone (onX charges $99 for this), Sentinel-2 every 5 days as a free "Recent Imagery", and MO leaf-off state orthos if available.
7. **Terrain analysis on mobile:** client-side slope angle, aspect and elevation-band filters from 3DEP DEM tiles, plus viewshed. onX locks these to desktop Elite.

**Beat onX where it is weak (the Spartan Forge half):**
8. **Scent cone plus thermals on the map:** draw a spatial scent cone from each stand using the forecast wind (direction and speed-dependent length) plus morning/evening thermal flow downslope/upslope from DEM aspect and sun position. onX only gives a green/yellow/red badge.
9. **Optimal Wind + Wind Calendar clone,** plus a "best stand right now" ranking across all stands (onX's comparison is manual).
10. **Deer movement score** from open inputs: solunar majors/minors (computed locally), pressure trend, temperature departure, wind speed, moon, and MO rut timing (MDC fetal data / photoperiod). Keep it transparent (show the factor breakdown) rather than a black box. Add real solunar tables, which onX Hunt lacks.
11. **Habitat layers from free data:** USDA CDL crops (yearly, with a rotation history slider), NLCD/forest type for oak cover, NWI wetlands, SSURGO soils, recent timber harvest (NLCD change / LCMS), CWD management zones (MDC).
12. **Bedding/funnel suggestions:** algorithmic benches (slope breaks on 3DEP), saddles and pinch points (inside corners where timber meets ag, derived from NLCD edge × terrain). This is the Spartan Forge-style "AI" layer, but deterministic.

**Fill onX's gaps:**
13. **Harvest log / hunt journal:** each sit is logged with auto-attached wind, temperature, pressure, moon and deer seen. Over time this becomes a personal pattern model (onX has only trail cam analysis).
14. **Trail cams:** manual SD import with EXIF time, then correlate with weather history per camera, for free. Optional local AI deer/buck detection (self-hosted model). Don't gate it.
15. **Group features without a paywall:** shared folders where contributors *can* edit, cross-platform offline share (QR code / GPX file / Web Bluetooth), and live location via self-hosted relay.
16. **Garmin-friendly:** one-click GPX/FIT export and Garmin Explore-compatible KML. Consider a Connect IQ companion later.
17. **Printing:** true PDF map export at a chosen scale/paper size with a grid, legend and landowner labels (a common onX complaint).
18. **Privacy as a feature:** self-hosted means waypoints never leave the user's server, which answers the "Waypoint 6" subpoena and data fears directly.
19. **Per-county data freshness and "report error" loop:** onX's error-report-to-next-release loop is good. We can show the source URL and date on every parcel.

**Don't bother copying:** Imagery on Demand ($ tasking), SOS/insurance, Pro Deals and courses, western draw-odds tools, CarPlay (v1).

---

## 8. Sources

- https://www.onxmaps.com/hunt
- https://www.onxmaps.com/hunt/app/features
- https://www.onxmaps.com/hunt/app/pricing
- https://www.onxmaps.com/hunt/app/premium
- https://www.onxmaps.com/hunt/elite
- https://www.onxmaps.com/hunt/elite/map-tools
- https://www.onxmaps.com/hunt/app/faq
- https://www.onxmaps.com/hunt/app/features/free-trial-basic-membership-details
- https://www.onxmaps.com/hunt/app/features/land-ownership-maps-parcel-viewer
- https://www.onxmaps.com/hunt/parcel-coverage
- https://www.onxmaps.com/hunt/blog/onx-private-property-ownership-how-and-when-is-it-updated
- https://www.onxmaps.com/insights/best-property-line-app-for-hunting
- https://www.onxmaps.com/hunt/app/features/lidar-maps
- https://www.onxmaps.com/hunt/blog/walk-through-terrainx
- https://www.onxmaps.com/hunt/app/features/desktop-web-map
- https://www.onxmaps.com/hunt/app/features/3d-maps
- https://www.onxmaps.com/hunt/app/features/offline-maps
- https://www.onxmaps.com/hunt/app/features/offline-sharing
- https://www.onxmaps.com/hunt/app/features/waypoints
- https://www.onxmaps.com/hunt/app/features/tracker
- https://www.onxmaps.com/hunt/app/features/weather-wind-barometric-pressure
- https://www.onxmaps.com/hunt/tutorials/optimal-wind
- https://support.onxmaps.com/hc/en-us/articles/4412328878861-Wind-Direction-on-Waypoints-and-Wind-Calendars
- https://www.onxmaps.com/hunt/blog/hunting-weather-forecast-feature-update
- https://www.onxmaps.com/hunt/app/features/deer-movement-forecast
- https://www.onxmaps.com/hunt/blog/2026-rut-predictions
- https://www.onxmaps.com/hunt/app/east/whitetail-intel
- https://www.onxmaps.com/hunt/app/features/trail-cameras
- https://support.onxmaps.com/hc/en-us/articles/37913494558221-Connecting-Cellular-Trail-Cameras-with-onX-Hunt
- https://www.onxmaps.com/hunt/app/features/location-sharing
- https://www.onxmaps.com/sos
- https://www.prnewswire.com/news-releases/onx-launches-in-app-emergency-assistance-for-safer-backcountry-adventures-302824719.html
- https://www.onxmaps.com/hunt/app/features/connected-hunting-optics
- https://www.onxmaps.com/hunt/app/features/carplay-android-auto-in-dash
- https://support.onxmaps.com/hc/en-us/articles/11580233245837-Using-onX-Hunt-with-Apple-CarPlay-or-Android-Auto
- https://support.onxmaps.com/hc/en-us/articles/12885385356429-Building-Routes-that-snap-to-Roads-and-Trails
- https://support.onxmaps.com/hc/en-us/articles/115003218311-Sharing-Markups-with-other-onX-Hunt-users
- https://www.onxmaps.com/hunt/app/features/collaborative-folders
- https://support.onxmaps.com/hc/en-us/articles/4990049964045-Using-Markup-options
- https://support.onxmaps.com/hc/en-us/articles/115006042848-Printing-maps
- https://support.onxmaps.com/hc/en-us/articles/115002921008-Garmin-GPS-units-compatible-with-the-onX-Hunt-Chip
- https://support.onxmaps.com/hc/en-us/articles/15487583070221-How-to-use-Recent-and-Leaf-Off-Imagery
- https://www.onxmaps.com/blog/onx-hunt-adds-game-changing-features-for-the-upcoming-season
- https://www.onxmaps.com/blog/onx-hunt-adds-seven-new-features
- https://www.onxmaps.com/news
- https://www.onxmaps.com/hunt/blog/understanding-organizing-layers-in-onx-hunt-app
- https://www.onxmaps.com/hunt/blog/onx-hunt-overlooked-and-underutilized-features
- https://www.onxmaps.com/hunt/elite/pro-deals/hunt-research-tools
- https://www.onxmaps.com/hunt/app/features/hunting-area-zone-unit-maps
- https://play.google.com/store/apps/details?id=onxmaps.regulations
- https://www.onxmaps.com/onx-access-initiatives/corner-crossing-report
- https://apps.apple.com/us/app/onx-hunt-gps-hunting-maps/id672902340
- https://blog.eastmans.com/one-button-could-save-your-hunt-or-your-life-2026-onx-hunt-features/
- https://deerassociation.com/5-onx-hunt-features-you-didnt-know-you-needed/
- https://www.bowhunter.com/editorial/live-location-sharing-onx-hunt/552553
- https://en.wikipedia.org/wiki/OnX_Maps
- https://www.outdoorlife.com/conservation/the-onx-effect/
- https://www.hunttalk.com/threads/no-more-offline-high-resolution-in-onx.285273/
- https://rokslide.com/forums/threads/onx-hunt-inaccurate-property-lines.148033/
- https://rokslide.com/forums/threads/onx-vs-huntstand.335923/
- https://rokslide.com/forums/threads/why-does-the-resolution-on-my-onx-suck.338131/
- https://forum.gon.com/threads/onx-hunt-app-question.1022933/
- https://www.longrangehunting.com/threads/how-accurate-is-onx.283563/
- https://justuseapp.com/en/app/672902340/onx-hunt-1-gps-hunting-map/problems
- https://hunttested.com/onx-hunt-elite-membership-for-the-traveling-hunter-is-it-worth-it/
- https://cohunt.app/compare/hunting-app-comparison.html (competitor)
- https://www.trailprointel.com/blog/trail-pro-intel-vs-onx-hunt (competitor)
- https://www.youtube.com/watch?v=I6mKTOjnhAs (6-app comparison, Part 1; not transcribed)
