#!/usr/bin/env python3
"""Build the public country-comparison snapshot used by the example."""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from html import unescape
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FESTIVAL_SOURCE = ROOT / "ars-dataset" / "notion_export.json"
TOURISM_SOURCE = (
    ROOT / "opendata-linz" / "herkunftslaender-gaeste" / "Herkunftslaender.csv"
)
OUTPUT = Path(__file__).resolve().parent / "src" / "country-data.json"
COUNTRY_PATTERN = re.compile(r"(?:^|,\s*)([A-Z]{2})\s+([^,]+)")


def clean_text(value: object, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    return " ".join(unescape(value).split())


def parse_contact_countries(value: object) -> list[tuple[str, str]]:
    if not isinstance(value, str):
        return []
    countries = [
        (match.group(1), clean_text(match.group(2)))
        for match in COUNTRY_PATTERN.finditer(value)
    ]
    if not countries:
        raise ValueError(f"Unrecognized contact country value: {value!r}")
    return countries


def load_tourism() -> dict[str, dict[str, Any]]:
    required = {
        "id",
        "jahr",
        "quartal",
        "herkunft",
        "herkunft_typ",
        "iso2",
        "ankuenfte",
        "uebernachtungen",
    }
    countries: dict[str, dict[str, Any]] = {}
    with TOURISM_SOURCE.open(encoding="utf-8", newline="") as source:
        reader = csv.DictReader(source)
        if set(reader.fieldnames or []) != required:
            raise ValueError("Tourism CSV header changed")
        for row in reader:
            if row["herkunft_typ"] != "land":
                continue
            code = row["iso2"]
            quarter = int(row["quartal"])
            if not re.fullmatch(r"[A-Z]{2}", code) or quarter not in range(1, 5):
                raise ValueError(f"Invalid tourism country or quarter in {row['id']}")
            country = countries.setdefault(
                code,
                {
                    "code": code,
                    "name": clean_text(row["herkunft"]),
                    "tourism": [],
                    "contacts": [],
                    "projects": [],
                },
            )
            if country["name"] != clean_text(row["herkunft"]):
                raise ValueError(f"Inconsistent country name for {code}")
            country["tourism"].append(
                {
                    "quarter": quarter,
                    "arrivals": int(row["ankuenfte"]),
                    "nights": int(row["uebernachtungen"]),
                }
            )

    for country in countries.values():
        country["tourism"].sort(key=lambda row: row["quarter"])
        if [row["quarter"] for row in country["tourism"]] != [1, 2, 3, 4]:
            raise ValueError(f"Incomplete quarterly data for {country['code']}")
    return countries


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "festival_source",
        nargs="?",
        type=Path,
        default=DEFAULT_FESTIVAL_SOURCE,
        help="verified Ars festival JSON export (default: repo snapshot)",
    )
    args = parser.parse_args()

    festival = json.loads(args.festival_source.read_text(encoding="utf-8"))
    countries = load_tourism()
    projects = {
        project["canonical_id"]: project
        for project in festival["projects"]
        if project.get("public_for_hackathon") is True
        and project.get("canonical_id")
    }
    country_contacts: dict[str, dict[str, dict[str, str]]] = defaultdict(dict)
    country_projects: dict[str, dict[str, str]] = defaultdict(dict)

    public_contacts = [
        contact
        for contact in festival["contacts"]
        if contact.get("public_for_hackathon") is True
    ]
    represented_project_ids: set[str] = set()
    for contact in public_contacts:
        contact_id = contact.get("canonical_id")
        if not contact_id:
            raise ValueError("Public contact without canonical_id")
        contact_name = clean_text(
            contact.get("Name EN") or contact.get("Name DE"),
            fallback="Unnamed festival contact",
        )
        resolved_projects = [
            projects[project_id]
            for project_id in contact.get("Linked Projects") or []
            if project_id in projects
        ]
        for code, festival_country_name in parse_contact_countries(
            contact.get("Country")
        ):
            country = countries.setdefault(
                code,
                {
                    "code": code,
                    "name": festival_country_name,
                    "tourism": [],
                    "contacts": [],
                    "projects": [],
                },
            )
            country_contacts[code][contact_id] = {
                "name": contact_name,
                "category": clean_text(contact.get("Category"), "Contact"),
                "url": (
                    clean_text(contact.get("Website"))
                    if contact.get("link_allowed") is True
                    else ""
                ),
            }
            for project in resolved_projects:
                represented_project_ids.add(project["canonical_id"])
                country_projects[code][project["canonical_id"]] = clean_text(
                    project.get("Name EN") or project.get("Name DE"),
                    fallback="Untitled festival project",
                )

    for code, country in countries.items():
        country["contacts"] = sorted(
            country_contacts[code].values(),
            key=lambda item: (item["name"].casefold(), item["category"]),
        )
        country["projects"] = sorted(
            country_projects[code].values(),
            key=str.casefold,
        )

    records = sorted(
        countries.values(),
        key=lambda country: (country["name"].casefold(), country["code"]),
    )
    payload = {
        "festival_generated_at": festival.get("_meta", {}).get("generated_at"),
        "festival_export_filter": festival.get("_meta", {}).get("export_filter"),
        "tourism_year": 2024,
        "public_contact_count": len(public_contacts),
        "represented_project_count": len(represented_project_ids),
        "countries": records,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    represented = sum(bool(country["contacts"]) for country in records)
    overlaps = sum(bool(country["contacts"] and country["tourism"]) for country in records)
    print(
        f"Wrote {len(records)} countries: {represented} festival-represented, "
        f"{overlaps} overlapping tourism countries, {len(public_contacts)} public contacts"
    )


if __name__ == "__main__":
    main()
