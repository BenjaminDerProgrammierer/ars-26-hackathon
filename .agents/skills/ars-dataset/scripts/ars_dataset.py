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

    load, build_indexes, key_of, links, parse_coord, fix_url,
    is_test_content, event_rows
"""

import json
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

DATASET_URL = "https://ars.electronica.art/negotiatinghumanity/hackathondata/"
DATABASES = ("projects", "contacts", "locations", "calendar")
DEFAULT_SCHEMA = Path(__file__).resolve().parent.parent / "references" / "schema.json"
_HASH_RE = re.compile(r"[0-9a-f]{32}$")


# ---------------------------------------------------------------- loading

def load(source=DATASET_URL):
    """Load the dataset from a URL or local file path."""
    if str(source).startswith(("http://", "https://")):
        req = urllib.request.Request(source, headers={"User-Agent": "ars-dataset-skill"})
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    with open(source, encoding="utf-8") as f:
        return json.load(f)


def key_of(record_id):
    """Join key for any id: the trailing 32-hex-char hash, or None.

    Works for prefixed ids ('Exhibitions-34238ddb…'), bare hashes, and null.
    Link-field values are already bare hashes and pass through unchanged.
    """
    if not record_id:
        return None
    m = _HASH_RE.search(record_id)
    return m.group(0) if m else None


def links(record, field):
    """The join keys in a link field, always as a list ([] for null)."""
    return record.get(field) or []


def build_indexes(data):
    """Return {db: {hash_key: record}} and stamp each record with '_key'.

    Records without a usable id get _key=None and are left out of the index.
    Duplicate keys (they exist — generic floors, recurring event slots) keep
    the first record.
    """
    indexes = {}
    for db in DATABASES:
        idx = {}
        for rec in data.get(db, []):
            rec["_key"] = key_of(rec.get("id"))
            if rec["_key"] is not None and rec["_key"] not in idx:
                idx[rec["_key"]] = rec
        indexes[db] = idx
    return indexes


# ------------------------------------------------------- cleansing helpers

def parse_coord(value):
    """Parse a European-format coordinate string ('48,309619') to float, or None."""
    if not value:
        return None
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def fix_url(value):
    """Ensure a URL has a protocol; expand bare @instagram handles. None-safe.

    Returns None for the 'offline' sentinel used in projects."Web Link".
    """
    if not value or value == "offline":
        return None
    if value.startswith(("http://", "https://")):
        return value
    if value.startswith("@"):
        return "https://www.instagram.com/" + value[1:]
    return "https://" + value


def is_test_content(project):
    """True for test/internal projects that should not appear in user-facing apps."""
    name = project.get("Name EN")
    if not name or name == "undefined":
        return True
    return name.startswith(("Test Event", "Test_")) or "NOT FOR WEB" in name


def event_rows(data, indexes=None):
    """One dict per calendar slot, joined with its project and locations.

    Uses the authoritative direction calendar → project. Venue comes from the
    calendar rollup when it resolves, else from the project. Slots whose
    project is missing or test content are skipped.
    """
    idx = indexes or build_indexes(data)
    rows = []
    for slot in data.get("calendar", []):
        project = None
        for k in links(slot, "Linked Projects"):
            project = idx["projects"].get(k)
            if project:
                break
        if project is None or is_test_content(project):
            continue
        loc_keys = links(slot, "Linked Location") or links(project, "Linked Location")
        rows.append({
            "project": project,
            "locations": [idx["locations"][k] for k in loc_keys if k in idx["locations"]],
            "weekday": slot.get("Weekday"),
            "start": slot.get("Start Time"),
            "end": slot.get("End Time"),
            "duration_min": slot.get("Duration"),
            "time_text": slot.get("Time"),
            "language": slot.get("Language") or project.get("Language"),
            "registration_url": fix_url(slot.get("Registration URL")),
            "highlight": slot.get("Highlight") == "Yes",
            "slot": slot,
        })
    return rows


# ------------------------------------------------------------ schema check

def _check_value(prop, value, defs):
    """True if value satisfies this schema fragment (subset used by schema.json)."""
    if "$ref" in prop:
        return _check_value(defs[prop["$ref"].rsplit("/", 1)[-1]], value, defs)
    if "oneOf" in prop:
        return any(_check_value(branch, value, defs) for branch in prop["oneOf"])
    if "enum" in prop:
        return value in prop["enum"]
    t = prop.get("type")
    if t == "null":
        return value is None
    if t == "string":
        return isinstance(value, str)
    if t == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if t == "array":
        return isinstance(value, list) and all(
            _check_value(prop.get("items", {}), v, defs) for v in value)
    if t == "object":
        return isinstance(value, dict)
    return True  # no constraint we understand -> accept


def verify(data, schema):
    """Validate all records against the schema; return Counter of violations.

    Keys are (database, field, kind) where kind is 'unknown field',
    'missing required field', or 'invalid value'.
    """
    defs = schema.get("$defs", {})
    violations = Counter()
    for db in DATABASES:
        items = schema["properties"][db]["items"]
        record_schema = defs[items["$ref"].rsplit("/", 1)[-1]] if "$ref" in items else items
        props = record_schema.get("properties", {})
        required = record_schema.get("required", [])
        strict = record_schema.get("additionalProperties") is False
        for rec in data.get(db, []):
            for field in rec:
                if field == "_key":
                    continue  # added by build_indexes, not part of the export
                if field not in props:
                    if strict:
                        violations[(db, field, "unknown field")] += 1
                elif not _check_value(props[field], rec[field], defs):
                    violations[(db, field, "invalid value")] += 1
            for field in required:
                if field not in rec:
                    violations[(db, field, "missing required field")] += 1
    for key in schema.get("required", []):
        if key not in data:
            violations[("<root>", key, "missing required field")] += 1
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
        o_keys = {key_of(r.get("id")) for r in o_rows} - {None}
        n_keys = {key_of(r.get("id")) for r in n_rows} - {None}
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
    lines.append(f"  projects.'Linked Calendar' -> calendar : "
                 f"{rate([(r, 'Linked Calendar') for r in data.get('projects', [])], 'calendar')}  (known broken)")
    lines.append(f"  projects.'Linked Contacts' -> contacts : "
                 f"{rate([(r, 'Linked Contacts') for r in data.get('projects', [])], 'contacts')}")
    lines.append(f"  projects.'Linked Location' -> locations: "
                 f"{rate([(r, 'Linked Location') for r in data.get('projects', [])], 'locations')}")
    lines.append(f"  contacts.'Linked Projects' -> projects : "
                 f"{rate([(r, 'Linked Projects') for r in data.get('contacts', [])], 'projects')}")
    test = sum(1 for p in data.get("projects", []) if is_test_content(p))
    lines.append(f"test/internal projects (filtered by is_test_content): {test}")
    lines.append(f"joined event rows (event_rows): {len(event_rows(data, idx))}")
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
