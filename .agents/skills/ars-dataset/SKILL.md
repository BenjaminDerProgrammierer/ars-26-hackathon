---
name: ars-dataset
description: Handle the Ars Electronica Festival 2026 hackathon dataset - download the latest export, update the repo snapshot, verify an export against the JSON schema, detect schema/field drift between versions, look up what fields and databases mean, and build analyses on the data via an importable module (joined event rows with parsed datetimes and coordinates). Use this skill whenever the user mentions the ars dataset, ars-dataset, notion_export.json, the hackathon dataset/export, or asks to download/refresh/validate festival data, check whether the dataset changed, understand a field in it, or analyze/visualize festival events, times, or locations. Read this BEFORE touching the dataset; it has non-obvious ID semantics and known data-quality issues.
---

# Ars Electronica Festival 2026 – Hackathon Dataset Handling

The dataset is one JSON file (~2 MB) exported from the festival CMS for the
*Negotiating Humanity* festival. It holds four interlinked databases. In the
2026-07-20 export these contain `projects` (706), `contacts` (360), `locations`
(138), and `calendar` (278), plus a `_meta` block with usage rules, quality
reports, `generated_at`, and record counts.

Key places:

- **Download URL** (always the latest export; redirects to the JSON file):
  `https://ars.electronica.art/negotiatinghumanity/hackathondata/`
- **Repo snapshot**: `ars-dataset/notion_export.json` — a local working copy;
  it is **gitignored**, so a fresh clone doesn't have it (download it first).
  Feedback sent to the data provider lives in `ars-dataset/discussions/`.
- **This skill's tooling**: `scripts/ars_dataset.py` (stdlib-only CLI + importable
  module). Run it for all routine handling instead of writing ad-hoc code:

```bash
python3 scripts/ars_dataset.py download -o notion_export.json  # fetch latest
python3 scripts/ars_dataset.py summary [FILE_OR_URL]           # counts + health metrics
python3 scripts/ars_dataset.py verify  [FILE_OR_URL]           # validate against references/schema.json
python3 scripts/ars_dataset.py diff OLD.json NEW.json          # what changed between exports
```

## Task: update the repo snapshot to the latest export

1. Download to a temp file (`download -o /tmp/new_export.json`).
2. `verify` the new file — schema violations mean the source changed; don't
   silently overwrite the snapshot.
3. `diff` the current snapshot against the new file and report to the user
   what changed: `generated_at`, record counts, added/removed fields,
   added/removed records.
4. Replace `ars-dataset/notion_export.json` only after reporting; if fields
   were added/removed or enums changed, also update this skill's
   `references/data-model.md` and `references/schema.json` so documentation
   stays truthful.

## Task: verify an export / check for schema drift

`verify` checks every record against `references/schema.json` (unknown
fields, missing required fields, wrong types, unknown enum values) and prints
aggregated violations. The current export is expected to be clean; new
violations after a fresh download indicate the source format changed —
summarize them for the user and propose documentation updates rather than
"fixing" the data locally.

`summary` additionally reports known data-health metrics (records without
ids, duplicate ids, link-resolution rates). Compare against the baselines in
`references/data-quality.md` to see whether known issues were fixed at the
source or new ones appeared.

## Task: understand the data

- Field-by-field reference for all four databases, enum values, and the
  relations diagram: `references/data-model.md`.
- Known data-quality issues with measured numbers and workarounds (also the
  basis for feedback to the data provider): `references/data-quality.md`.
- Authoritative JSON Schema: `references/schema.json`.

The essentials, because naive code gets them wrong:

- **Join on `canonical_id`.** Every record has this bare 32-character hash,
  and every `Linked *` field contains these exact values. The readable `id`
  remains for display/debugging; do not join on it. `id_source` says whether
  the id came from Notion or was derived deterministically.
- **The calendar is the authoritative source of time slots** via
  `calendar."Linked Projects"` or the scalar `calendar.project_ref`.
  `projects.calendar_ids` is the complete, calendar-derived reverse relation.
  `projects."Linked Calendar"` remains unreliable and `projects.Times` is
  display-only.
- **No field carries a machine-readable event date.** `Start Time`/`End Time`
  are bare `HH:MM`; the full date exists only inside the calendar `Time`
  display string (`"9. September 2026 15:15 (MESZ) → 16:15"`). Use
  `parse_event_datetime()` or the `start_dt`/`end_dt` fields on `event_rows()`
  output instead of parsing it yourself.
- **Use the explicit visibility fields.** `public_for_hackathon` is the filter
  for demo apps, while `link_allowed` controls whether URLs may be rendered.
  `status_web` is normalized and `visibility_rule` explains the decision.
  `offline` means display is allowed but linking is not. The July export still
  includes hidden placeholders for testing; the August export is expected to
  contain only the actual data.
- Location and calendar ids are present and unique. Six location coordinates
  are still flagged as suspicious; consult `coordinates_ok` and
  `_meta.quality`. URLs are normalized to include a protocol.
- Editorial length limits are recommendations. Values are not truncated;
  overruns are reported in `_meta.quality.length_warnings`.

## Task: data cleansing or building on the data

This skill's module is importable for downstream work
(`from ars_dataset import load, build_indexes, event_rows, parse_event_datetime, parse_coord, is_public`) —
these functions already encode the join and cleansing rules above. For
time/place analyses, `event_rows()` rows come with ready-to-use `start_dt`/
`end_dt` (tz-aware datetimes) and `lat`/`lon` (parsed floats from the first
location with a complete coordinate pair). Read
`references/data-quality.md` first; it lists every known pitfall with the
recommended workaround.
