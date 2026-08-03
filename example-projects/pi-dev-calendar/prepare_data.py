#!/usr/bin/env python3
"""Fetch the current public export and prepare trustworthy calendar rows."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
SKILL_CANDIDATES = (
    PROJECT_ROOT / ".pi/skills/ars-dataset/scripts",
    PROJECT_ROOT.parents[1] / ".agents/skills/ars-dataset/scripts",
)
SKILL_SCRIPTS = next((path for path in SKILL_CANDIDATES if path.exists()), None)

if SKILL_SCRIPTS is None:
    raise SystemExit(
        "ars-dataset skill not found. Install it first as described in the pi.dev tutorial."
    )

sys.path.insert(0, str(SKILL_SCRIPTS))

from ars_dataset import event_rows, load  # noqa: E402


def text(value: object, fallback: str) -> str:
    return value.strip() if isinstance(value, str) and value.strip() else fallback


def main() -> None:
    data = load()
    rows = event_rows(data, public_only=True)
    events = []

    for row in rows:
        start = row["start_dt"]
        end = row["end_dt"]
        if start is None or end is None:
            continue

        project = row["project"]
        locations = row["locations"]
        location = locations[0] if locations else {}
        events.append(
            {
                "id": row["slot"]["canonical_id"],
                "title": text(project.get("Name DE") or project.get("Name EN"), "Ohne Titel"),
                "category": text(project.get("Category"), "Festivaltermin"),
                "venue": text(
                    location.get("Breadcrumb DE")
                    or location.get("Name DE")
                    or location.get("Name EN"),
                    "Ort noch offen",
                ),
                "start": start.isoformat(),
                "end": end.isoformat(),
                "url": project.get("Web Link") if project.get("link_allowed") is True else None,
            }
        )

    events.sort(key=lambda event: (event["start"], event["title"]))
    payload = {
        "generatedAt": data.get("_meta", {}).get("generated_at"),
        "calendarRows": len(data.get("calendar", [])),
        "events": events,
    }
    output = PROJECT_ROOT / "public/events.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(events)} trustworthy public events in {output}")


if __name__ == "__main__":
    main()
