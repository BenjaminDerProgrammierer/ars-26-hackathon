#!/usr/bin/env python3
"""Build the public festival project and trustworthy calendar snapshot."""

from __future__ import annotations

import json
import sys
from csv import DictReader
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "ars-dataset" / "notion_export.json"
OUTPUT = Path(__file__).resolve().parent / "src" / "festival-data.json"
WATER_SOURCE = ROOT / "opendata-linz" / "trinkbrunnen" / "Trinkbrunnen.csv"
TOILET_SOURCE = ROOT / "opendata-linz" / "wc-anlagen" / "WC-Anlagen.csv"
SKILL_MODULE = ROOT / ".agents" / "skills" / "ars-dataset" / "scripts"
sys.path.insert(0, str(SKILL_MODULE))

from ars_dataset import parse_event_datetime  # noqa: E402


def clean_text(value: object, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    return " ".join(unescape(value).split())


def usable_location(record: dict[str, object] | None) -> bool:
    return bool(
        record
        and record.get("coordinates_ok") is not False
        and record.get("Latitude") is not None
        and record.get("Longitude") is not None
    )


def coordinate(row: dict[str, str]) -> tuple[float, float] | None:
    try:
        return float(row["lat"]), float(row["lon"])
    except (KeyError, TypeError, ValueError):
        return None


def city_services() -> list[dict[str, object]]:
    services: list[dict[str, object]] = []
    with WATER_SOURCE.open(encoding="utf-8", newline="") as source:
        for row in DictReader(source):
            point = coordinate(row)
            if not point or row.get("trinkwasser") != "true":
                continue
            detail = " · ".join(
                value
                for value in (
                    "listed as operational"
                    if row.get("in_betrieb") == "true"
                    else "",
                    clean_text(row.get("betriebszeit")),
                )
                if value
            )
            services.append(
                {
                    "id": row["id"],
                    "kind": "water",
                    "name": clean_text(
                        row.get("aufstellungsort"), "Drinking fountain"
                    ),
                    "detail": detail,
                    "lat": point[0],
                    "lon": point[1],
                }
            )
    with TOILET_SOURCE.open(encoding="utf-8", newline="") as source:
        for row in DictReader(source):
            point = coordinate(row)
            if not point:
                continue
            detail = " · ".join(
                value
                for value in (
                    "accessible" if row.get("barrierefrei") == "true" else "",
                    clean_text(row.get("oeffnungszeiten")),
                )
                if value
            )
            services.append(
                {
                    "id": row["id"],
                    "kind": "toilet",
                    "name": clean_text(row.get("name"), "Public toilet"),
                    "detail": detail,
                    "lat": point[0],
                    "lon": point[1],
                }
            )
    return services


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    locations = {
        record["canonical_id"]: record
        for record in data["locations"]
        if record.get("canonical_id")
    }
    public_projects = {
        record["canonical_id"]: record
        for record in data["projects"]
        if record.get("canonical_id") and record.get("public_for_hackathon") is True
    }

    projects = []
    for project_id, project in public_projects.items():
        location = next(
            (
                locations.get(location_id)
                for location_id in project.get("Linked Location") or []
                if usable_location(locations.get(location_id))
            ),
            None,
        )
        title = project.get("Name EN") or project.get("Name DE")
        if not title or not location:
            continue
        projects.append(
            {
                "id": project_id,
                "title": clean_text(title),
                "category": clean_text(project.get("Category"), "Festival project"),
                "venue": clean_text(
                    location.get("Breadcrumb EN")
                    or location.get("Name EN")
                    or location.get("Name DE"),
                    "Festival venue",
                ),
                "address": clean_text(location.get("Address") or location.get("Place")),
                "lat": float(location["Latitude"]),
                "lon": float(location["Longitude"]),
                "link": (
                    project.get("Web Link")
                    if project.get("link_allowed") is True
                    else None
                ),
            }
        )

    schedulable_project_ids = {project["id"] for project in projects}
    events = []
    for slot in data["calendar"]:
        if (
            slot.get("public_for_hackathon") is not True
            or slot.get("slot_status") != "assigned"
        ):
            continue
        project_id = slot.get("project_ref")
        project = public_projects.get(project_id)
        if not project or project_id not in schedulable_project_ids:
            continue
        location = next(
            (
                locations.get(location_id)
                for location_id in slot.get("Linked Location") or []
                if usable_location(locations.get(location_id))
            ),
            None,
        )
        if not location:
            continue
        start, end = parse_event_datetime(slot)
        if not start or not end:
            continue
        events.append(
            {
                "id": slot["canonical_id"],
                "project_id": project_id,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "arrival_minutes": int(slot.get("Recommended Arrival") or 10),
            }
        )

    projects.sort(key=lambda item: (item["title"].casefold(), item["id"]))
    events.sort(key=lambda item: (item["start"], item["id"]))
    payload = {
        "generated_from": data.get("_meta", {}).get("generated_at"),
        "schema_version": data.get("_meta", {}).get("schema_version"),
        "projects": projects,
        "events": events,
        "services": city_services(),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(projects)} public projects, {len(events)} trustworthy "
        f"calendar events, and {len(payload['services'])} city services to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
