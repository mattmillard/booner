# Getting Cooper County parcel data

> **Resolved 2026-09-27:** Cooper parcels now load from the county's own viewer service (see
> `docs/research/08-county-parcel-sources.md`, `npm run ingest -- cooper_parcels`). Keep this page as the fallback if
> that access ever stops working.

Cooper County's parcel map runs on Integrity GIS behind a login token, and the county posts no download. The data
is a public record, so ask for it directly (option 1). Regrid is the fallback (option 2). When a file arrives, load it
with one command (bottom of this page).

## Option 1: Cooper County Assessor (best: official, current)

**Gayle Linneman, Cooper County Assessor**, 200 Main Street, Room 22, Boonville, MO 65233 · (660) 882-2646 ·
https://www.coopercountymo.gov/assessors.html · hours 9–5, closed 12–1

Call first (fastest), then send the written request:

> Subject: Request for Cooper County parcel GIS data
>
> Ms. Linneman,
>
> I'm requesting a copy of the county's digital parcel data under Missouri's Sunshine Law (RSMo Chapter 610) and
> RSMo 67.1850:
>
> 1. The parcel boundary layer (shapefile, file geodatabase, or GeoPackage) with its coordinate system (.prj).
> 2. The matching assessment attributes: parcel number, owner name(s), mailing address, deeded acres, legal
>    description, and situs address, either joined to the parcels or as a CSV keyed by parcel number.
>
> The data is for personal, non-commercial use in mapping for [my family's hunting / Veterans Outdoor Therapy, a
> nonprofit]. It won't be resold or redistributed. I'm happy to sign a data-use agreement and pay any cost-recovery fee
> the county sets; please let me know the amount before preparing it. Electronic delivery (email, download link, or
> USB) is fine.
>
> Thank you,
> [Name] · [Phone] · [Email]

Notes:
- RSMo 67.1850 lets counties charge cost-recovery fees and require a license for GIS data; expect a form and a fee.
- Ask for **"as of" dates** for both files (the app shows data dates on every layer).
- If they only offer PDFs or the online map, ask whether Integrity GIS can export the layer for them. Vendors usually can.

## Option 2: Regrid (fallback: nationwide, standardized)

- County page: https://app.regrid.com/us/mo/cooper · data store: https://regrid.com/missouri-parcel-data
- Nonprofit program ("Data with Purpose"): free or discounted data for nonprofits. Apply as Veterans Outdoor Therapy
  and describe the use: habitat and access planning for veteran outdoor programs, no resale.
- Ask for **Cooper County (FIPS 29053) as GeoPackage or shapefile** with the standard schema (owner, mailing address,
  acreage). Regrid's owner data can lag the county by several months.
- Paid alternative: ReportAll USA (30-day trial with limited parcel lookups).

## Loading the file (one command)

Save the download anywhere (a zip is fine), then:

```bash
pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper "C:/path/to/cooper_parcels.zip" --dry-run
```

The dry run shows which fields it mapped (owner, mailing address, acres, legal, parcel number). If a field is wrong,
add e.g. `--field owner=OWN_NAME`. Then run it without `--dry-run`, adding `--source-date` with the date the county
produced the data:

```bash
pipeline/.venv/Scripts/python pipeline/import_parcels.py Cooper "C:/path/to/cooper_parcels.zip" --source-date 2026-10-01
```

Parcels, owner labels and the tap card show up immediately; no rebuild is needed.
