#!/usr/bin/env python3
"""Create the small public festival-project snapshot used by the example."""

from __future__ import annotations

import json
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "ars-dataset" / "notion_export.json"
OUTPUT = Path(__file__).resolve().parent / "src" / "festival-projects.json"


def clean_text(value: object, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    return " ".join(unescape(value).split())


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    locations = {
        location["canonical_id"]: location
        for location in data["locations"]
        if location.get("canonical_id")
    }
    projects = []

    for project in data["projects"]:
        if project.get("public_for_hackathon") is not True:
            continue

        location = next(
            (
                locations[location_id]
                for location_id in project.get("Linked Location") or []
                if location_id in locations
                and locations[location_id].get("coordinates_ok") is not False
                and locations[location_id].get("Latitude") is not None
                and locations[location_id].get("Longitude") is not None
            ),
            None,
        )
        title = project.get("Name EN") or project.get("Name DE")
        if not location or not title:
            continue

        projects.append(
            {
                "id": project["canonical_id"],
                "title": clean_text(title),
                "category": clean_text(
                    project.get("Category"),
                    fallback="Festival project",
                ),
                "venue": clean_text(
                    location.get("Breadcrumb EN")
                    or location.get("Name EN")
                    or location.get("Name DE")
                    or location.get("Address"),
                    fallback="Festival venue",
                ),
                "address": clean_text(
                    location.get("Address") or location.get("Place")
                ),
                "lat": float(location["Latitude"]),
                "lon": float(location["Longitude"]),
            }
        )

    projects.sort(key=lambda project: (project["title"].casefold(), project["id"]))
    OUTPUT.write_text(
        json.dumps(
            {
                "generated_from": data.get("_meta", {}).get("generated_at"),
                "projects": projects,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(projects)} public projects with usable venue coordinates to {OUTPUT}")


if __name__ == "__main__":
    main()
