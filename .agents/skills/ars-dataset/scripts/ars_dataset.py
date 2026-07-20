#!/usr/bin/env python3
"""Handle the Ars Electronica Festival 2026 hackathon dataset. Stdlib only.

CLI:

    python3 ars_dataset.py download [-o FILE]      # fetch latest export (default: notion_export.json)
    python3 ars_dataset.py summary  [FILE_OR_URL]  # counts + data-health metrics
    python3 ars_dataset.py verify   [FILE_OR_URL] [--schema PATH]
                                                   # validate records against the JSON schema
    python3 ars_dataset.py diff OLD.json NEW.json  # what changed between two exports

With no FILE_OR_URL, summary/verify use the live download URL.
`verify` exits 1 if violations are found, `diff` exits 1 if the exports differ.

Importable helpers (they encode the dataset's join and cleansing rules —
see the skill's SKILL.md and references/data-quality.md):

    load, build_indexes, key_of, links, parse_coord, is_public,
    parse_event_datetime, event_rows
"""

import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATASET_URL = "https://ars.electronica.art/negotiatinghumanity/hackathondata/"
DATABASES = ("projects", "contacts", "locations", "calendar")
DEFAULT_SCHEMA = Path(__file__).resolve().parent.parent / "references" / "schema.json"
_CANONICAL_ID_RE = re.compile(r"^[0-9a-f]{32}$")


# ---------------------------------------------------------------- loading

def load(source=DATASET_URL):
    """Load the dataset from a URL or local file path."""
    if str(source).startswith(("http://", "https://")):
        req = urllib.request.Request(source, headers={"User-Agent": "ars-dataset-skill"})
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    with open(source, encoding="utf-8") as f:
        return json.load(f)


def key_of(canonical_id):
    """Return a valid schema-v2 canonical id, or None."""
    if not isinstance(canonical_id, str):
        return None
    return canonical_id if _CANONICAL_ID_RE.fullmatch(canonical_id) else None


def links(record, field):
    """The join keys in a link field, always as a list ([] for null)."""
    return record.get(field) or []


def build_indexes(data):
    """Return {db: {canonical_id: record}} and stamp records with ``_key``.
    """
    indexes = {}
    for db in DATABASES:
        idx = {}
        for rec in data.get(db, []):
            rec["_key"] = key_of(rec.get("canonical_id"))
            if rec["_key"] is not None and rec["_key"] not in idx:
                idx[rec["_key"]] = rec
        indexes[db] = idx
    return indexes


# ------------------------------------------------------- cleansing helpers

def parse_coord(value):
    """Convert a schema-v2 numeric coordinate to float, or return None."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def is_public(record):
    """Whether a schema-v2 record is suitable for a public hackathon app."""
    return record.get("public_for_hackathon") is True


_MONTHS_DE = {
    "Januar": 1, "Februar": 2, "März": 3, "April": 4, "Mai": 5, "Juni": 6,
    "Juli": 7, "August": 8, "September": 9, "Oktober": 10, "November": 11,
    "Dezember": 12,
}
_DT_RE = re.compile(r"(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß]+)\s*(\d{4})\s+(\d{1,2}):(\d{2})")
_TIME_ONLY_RE = re.compile(r"(\d{1,2}):(\d{2})")
# The export labels all times "(MESZ)" = CEST; a fixed offset matches that.
CEST = timezone(timedelta(hours=2), "CEST")


def parse_event_datetime(time_text):
    """(start, end) datetimes from a calendar 'Time' display string.

    The 'Time' string is the ONLY place the export carries a full event date
    ('Start Time'/'End Time' are bare HH:MM, 'Weekday' is a label). Formats:

        '9. September 2026 15:15 (MESZ) → 16:15'                       same day
        '8. September 2026 16:00 (MESZ) → 12. September 2026 18:00 (MESZ)'

    Returns (None, None) if unparseable, (start, None) if the end is missing.
    Datetimes are timezone-aware with a fixed +02:00 (CEST/MESZ) offset.
    """
    if not time_text:
        return None, None

    def to_dt(match):
        day, month_name, year, hh, mm = match.groups()
        month = _MONTHS_DE.get(month_name)
        if not month:
            return None
        try:
            return datetime(int(year), month, int(day), int(hh), int(mm), tzinfo=CEST)
        except ValueError:
            return None

    left, _, right = time_text.partition("→")
    m = _DT_RE.search(left)
    start = to_dt(m) if m else None
    if start is None:
        return None, None

    end = None
    m = _DT_RE.search(right)
    if m:
        end = to_dt(m)
    else:
        m = _TIME_ONLY_RE.search(right)
        if m:
            try:
                end = start.replace(hour=int(m.group(1)), minute=int(m.group(2)))
            except ValueError:
                end = None
            if end is not None and end < start:  # crosses midnight
                end += timedelta(days=1)
    return start, end


def event_rows(data, indexes=None, public_only=False):
    """One dict per calendar slot, joined with its project and locations.

    Uses the authoritative direction calendar → project. Venue comes from the
    calendar rollup when it resolves, else from the project. Slots whose
    project is missing are skipped. With ``public_only=True``, the slot and
    project must have ``public_for_hackathon: true``. Joined locations are
    retained regardless of their visibility flag so venue hierarchies remain
    complete, as required by ``_meta.usage.locations_note``.

    'start_dt'/'end_dt' are the parsed full datetimes (see
    parse_event_datetime; None when the 'Time' string is missing).
    'lat'/'lon' are parsed floats from the first location with a complete
    coordinate pair (both None otherwise).
    """
    idx = indexes or build_indexes(data)
    rows = []
    calendar = data.get("calendar")
    for slot in calendar if isinstance(calendar, list) else []:
        project = None
        project_keys = ([slot["project_ref"]] if slot.get("project_ref")
                        else links(slot, "Linked Projects"))
        for k in project_keys:
            project = idx["projects"].get(k)
            if project:
                break
        if project is None:
            continue
        if public_only and not (is_public(slot) and is_public(project)):
            continue
        loc_keys = links(slot, "Linked Location") or links(project, "Linked Location")
        locations = [
            idx["locations"][k]
            for k in loc_keys
            if k in idx["locations"]
        ]
        start_dt, end_dt = parse_event_datetime(slot.get("Time"))
        lat = lon = None
        for loc in locations:
            if loc.get("coordinates_ok") is False:
                continue
            lat = parse_coord(loc.get("Latitude"))
            lon = parse_coord(loc.get("Longitude"))
            if lat is not None and lon is not None:
                break
            lat = lon = None
        rows.append({
            "project": project,
            "locations": locations,
            "start_dt": start_dt,
            "end_dt": end_dt,
            "lat": lat,
            "lon": lon,
            "weekday": slot.get("Weekday"),
            "start": slot.get("Start Time"),
            "end": slot.get("End Time"),
            "duration_min": slot.get("Duration"),
            "time_text": slot.get("Time"),
            "language": slot.get("Language") or project.get("Language"),
            "registration_url": slot.get("Registration URL"),
            "highlight": slot.get("Highlight") == "Yes",
            "slot": slot,
        })
    return rows


# ------------------------------------------------------------ schema check

def _is_datetime(value):
    """True for an RFC 3339-style timestamp accepted by JSON Schema."""
    if not isinstance(value, str):
        return False
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return "T" in value and parsed.tzinfo is not None


def _schema_violations(prop, value, defs, path=()):
    """Yield (path, kind) violations for the schema subset used here."""
    if "$ref" in prop:
        target = defs[prop["$ref"].rsplit("/", 1)[-1]]
        yield from _schema_violations(target, value, defs, path)
        return

    if "oneOf" in prop:
        matching = [
            branch for branch in prop["oneOf"]
            if not list(_schema_violations(branch, value, defs, path))
        ]
        if len(matching) != 1:
            yield path, "invalid value"
        return

    if "enum" in prop and value not in prop["enum"]:
        yield path, "invalid value"
        return

    expected = prop.get("type")
    valid_type = {
        "null": value is None,
        "string": isinstance(value, str),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "number": isinstance(value, (int, float)) and not isinstance(value, bool),
        "boolean": isinstance(value, bool),
        "array": isinstance(value, list),
        "object": isinstance(value, dict),
    }.get(expected, True)
    if not valid_type:
        yield path, "invalid value"
        return

    if expected == "string" and prop.get("format") == "date-time":
        if not _is_datetime(value):
            yield path, "invalid value"
        return

    if expected == "string" and "pattern" in prop:
        if re.search(prop["pattern"], value) is None:
            yield path, "invalid value"
        return

    if expected == "array":
        item_schema = prop.get("items", {})
        for index, item in enumerate(value):
            yield from _schema_violations(item_schema, item, defs, path + (index,))
        return

    if expected == "object":
        properties = prop.get("properties", {})
        for field in prop.get("required", []):
            if field not in value:
                yield path + (field,), "missing required field"
        additional = prop.get("additionalProperties", {})
        for field, item in value.items():
            if field in properties:
                yield from _schema_violations(
                    properties[field], item, defs, path + (field,))
            elif additional is False:
                yield path + (field,), "unknown field"
            elif isinstance(additional, dict):
                yield from _schema_violations(
                    additional, item, defs, path + (field,))


def _violation_key(path, kind):
    """Map a schema path to the public aggregated violation key."""
    if not path:
        return "<root>", "<root>", kind
    if path[0] in DATABASES:
        if len(path) == 1:
            return "<root>", path[0], kind
        field = path[2] if len(path) > 2 else "<record>"
        return path[0], str(field), kind
    if path[0] == "_meta":
        if len(path) == 1:
            return "<root>", "_meta", kind
        return "_meta", ".".join(map(str, path[1:])), kind
    return "<root>", str(path[0]), kind


def verify(data, schema):
    """Validate an export against the schema; return Counter of violations.

    Keys are (database, field, kind) where kind is 'unknown field',
    'missing required field', or 'invalid value'.
    """
    defs = schema.get("$defs", {})
    violations = Counter()
    for path, kind in _schema_violations(schema, data, defs):
        # build_indexes adds this internal field; it is not export drift.
        if len(path) > 2 and path[0] in DATABASES and path[2] == "_key":
            continue
        violations[_violation_key(path, kind)] += 1

    # JSON Schema can constrain the individual relation fields, but cannot
    # express that project_ref must equal the sole Linked Projects value.
    # Enforce the schema-v2 calendar relation invariant explicitly.
    calendar = data.get("calendar") if isinstance(data, dict) else None
    for slot in calendar if isinstance(calendar, list) else []:
        if not isinstance(slot, dict):
            continue
        status = slot.get("slot_status")
        project_ref = slot.get("project_ref")
        linked_projects = slot.get("Linked Projects")
        if status == "assigned":
            if project_ref is None:
                violations[("calendar", "project_ref", "invalid value")] += 1
            if project_ref is None or linked_projects != [project_ref]:
                violations[("calendar", "Linked Projects", "invalid value")] += 1
        elif status == "unassigned":
            if project_ref is not None:
                violations[("calendar", "project_ref", "invalid value")] += 1
            if linked_projects is not None:
                violations[("calendar", "Linked Projects", "invalid value")] += 1
    return violations


# ------------------------------------------------------------------- diff

def diff(old, new):
    """Compare two exports; return list of human-readable difference lines."""
    out = []
    og = (old.get("_meta") or {}).get("generated_at")
    ng = (new.get("_meta") or {}).get("generated_at")
    if og != ng:
        out.append(f"generated_at: {og} -> {ng}")
    for db in DATABASES:
        o_rows, n_rows = old.get(db, []), new.get(db, [])
        if len(o_rows) != len(n_rows):
            out.append(f"{db}: {len(o_rows)} -> {len(n_rows)} records")
        o_fields = {f for r in o_rows for f in r if f != "_key"}
        n_fields = {f for r in n_rows for f in r if f != "_key"}
        for f in sorted(n_fields - o_fields):
            out.append(f"{db}: field added: {f!r}")
        for f in sorted(o_fields - n_fields):
            out.append(f"{db}: field removed: {f!r}")
        o_keys = {key_of(r.get("canonical_id")) for r in o_rows} - {None}
        n_keys = {key_of(r.get("canonical_id")) for r in n_rows} - {None}
        added, removed = n_keys - o_keys, o_keys - n_keys
        if added:
            out.append(f"{db}: {len(added)} record id(s) added")
        if removed:
            out.append(f"{db}: {len(removed)} record id(s) removed")
    return out


# -------------------------------------------------------------- summaries

def summary(data):
    """Counts and data-health metrics as human-readable lines."""
    idx = build_indexes(data)
    lines = [f"generated_at: {(data.get('_meta') or {}).get('generated_at')}"]
    for db in DATABASES:
        rows = data.get(db, [])
        keyless = sum(1 for r in rows if r.get("_key") is None)
        keyed = len(rows) - keyless
        lines.append(f"{db:9} {len(rows):4} records | {len(idx[db]):4} unique ids"
                     f" | {keyless:3} without id | {keyed - len(idx[db]):3} sharing an id")

    def rate(pairs, target_db):
        vals = [k for rec, field in pairs for k in links(rec, field)]
        ok = sum(1 for k in vals if k in idx[target_db])
        return f"{ok}/{len(vals)}"

    lines.append("link resolution (resolved/total):")
    lines.append(f"  calendar.'Linked Projects' -> projects : "
                 f"{rate([(r, 'Linked Projects') for r in data.get('calendar', [])], 'projects')}  (authoritative)")
    lines.append(f"  projects.calendar_ids -> calendar      : "
                 f"{rate([(r, 'calendar_ids') for r in data.get('projects', [])], 'calendar')}  (recommended reverse)")
    lines.append(f"  projects.'Linked Contacts' -> contacts : "
                 f"{rate([(r, 'Linked Contacts') for r in data.get('projects', [])], 'contacts')}")
    lines.append(f"  projects.'Linked Location' -> locations: "
                 f"{rate([(r, 'Linked Location') for r in data.get('projects', [])], 'locations')}")
    lines.append(f"  contacts.'Linked Projects' -> projects : "
                 f"{rate([(r, 'Linked Projects') for r in data.get('contacts', [])], 'projects')}")
    assigned = sum(1 for s in data.get("calendar", [])
                   if s.get("slot_status") == "assigned")
    unassigned = sum(1 for s in data.get("calendar", [])
                     if s.get("slot_status") == "unassigned")
    lines.append(f"calendar slots: {assigned} assigned | {unassigned} unassigned")
    for db in DATABASES:
        public = sum(1 for r in data.get(db, []) if is_public(r))
        lines.append(f"public_for_hackathon ({db}): {public}/{len(data.get(db, []))}")
    rows = event_rows(data, idx)
    timed = sum(1 for r in rows if r["start_dt"] is not None)
    geo = sum(1 for r in rows if r["lat"] is not None)
    lines.append(f"joined event rows (event_rows): {len(rows)}")
    lines.append(f"  with parsed datetime (start_dt): {timed}/{len(rows)}")
    lines.append(f"  with coordinates (lat/lon): {geo}/{len(rows)}")
    return "\n".join(lines)


# --------------------------------------------------------------------- CLI

def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]

    if cmd == "download":
        out = "notion_export.json"
        if "-o" in args:
            out = args[args.index("-o") + 1]
        data = load(DATASET_URL)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print(f"downloaded latest export to {out}")
        print(summary(data))
        return 0

    if cmd == "summary":
        data = load(args[0] if args else DATASET_URL)
        print(summary(data))
        return 0

    if cmd == "verify":
        schema_path = DEFAULT_SCHEMA
        if "--schema" in args:
            i = args.index("--schema")
            schema_path = args[i + 1]
            args = args[:i] + args[i + 2:]
        data = load(args[0] if args else DATASET_URL)
        with open(schema_path, encoding="utf-8") as f:
            schema = json.load(f)
        violations = verify(data, schema)
        if not violations:
            print("OK: export conforms to the schema")
            return 0
        print(f"{sum(violations.values())} violation(s) in {len(violations)} field(s):")
        for (db, field, kind), n in violations.most_common():
            print(f"  {db}.{field!r}: {kind} x{n}")
        return 1

    if cmd == "diff":
        changes = diff(load(args[0]), load(args[1]))
        if not changes:
            print("no structural differences")
            return 0
        print("\n".join(changes))
        return 1

    print(f"unknown command: {cmd}", file=sys.stderr)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
