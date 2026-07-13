#!/usr/bin/env python3
"""Parse Stadt Linz Atom feed pages and produce a reviewable dataset inventory."""

from __future__ import annotations

import argparse
import csv
import glob
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path


ATOM = {"atom": "http://www.w3.org/2005/Atom"}

# Manual review after reading all feed records. The URL disambiguates duplicate
# CSV/PDF catalog records with the same title.
INTERESTING = {
    "f660cf3f-afa9-4816-aafb-0098a36ca57d": ("A", "Urban nature", "Tree explorer, shade map, biodiversity or maintenance planning"),
    "d0500244-6b9e-4d3c-9def-70703c013b3f": ("A", "3D city", "Browser-based city model, accessibility or climate simulation"),
    "76c1f7fe-a82a-4ea3-87bb-23e83f9e3e0a": ("A", "Climate", "Roof-level solar and greening opportunity finder"),
    "linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025": ("A", "Mobility", "Transit network explorer and first/last-mile analysis"),
    "dfa2ff35-d2c4-4196-9989-a1bdbeabbfed": ("A", "Culture", "Live event recommender, calendar or cultural discovery map"),
    "fb11bd08-3c83-44fe-aeb0-7f1bffaedf65": ("A", "Neighborhoods", "Boundary layer for joining district-level indicators"),
    "ebb9e5f3-33ea-41ab-a2a6-c277c40d35df": ("A", "Neighborhoods", "Longitudinal age structure by district"),
    "46f16b2d-cd9a-4adb-b55d-cea8de01780f": ("A", "Neighborhoods", "Population trends and service-demand estimates"),
    "807645f0-2e80-4e24-b142-3673b108dde6": ("A", "City knowledge", "Street-history explorer or Wikidata-linked knowledge graph"),
    "27a1b464-a2b8-4c2f-9cc0-f7c3ba776885": ("A", "Housing", "Housing pipeline and development trend dashboard"),
    "461b3bd7-346d-4401-91d6-8009538c54a1": ("A", "Accessibility", "Accessible public-facilities route planner"),
    "ee7668cf-46bc-4246-a6fa-4adfdb52a513": ("A", "Public space", "Heat-day hydration and public-space map"),
    "b5c88eba-dcd7-4e1f-85cb-640d3eeec359": ("A", "Families", "Playground finder and neighborhood coverage analysis"),
    "866e3d0b-531b-42a0-a82a-3f36dd02b368": ("A", "Health", "Emergency AED finder and coverage gaps"),
    "fa02a3b3-deaf-49c2-8276-ed0393e61574": ("A", "Families", "Childcare accessibility and service coverage"),
    "f35b2a10-4d8b-40f3-9eb7-15d84c2f7f58": ("A", "Families", "Childcare accessibility and service coverage"),
    "1ac8b693-987f-47bd-ac7b-f432b01a04a3": ("A", "Families", "Childcare accessibility and service coverage"),
    "gemeinderatsprotokolle-2026": ("A", "Civic tech", "Search, summarize and connect council debates across years"),
    "vorfallstatistik-ordnungsdienst-2026": ("B", "Civic tech", "Monthly service and public-order trend dashboard"),
    "fe536a32-76b8-491e-9686-50e431a3309e": ("B", "Mobility", "Long-run road-safety trends; data is aggregated, not mapped crashes"),
    "04381e75-01ad-414f-964a-163cc4e000c2": ("B", "Resilience", "Emergency-response history and category trends"),
    "09660c57-9e8c-4ac5-bd2f-32f3c6961f72": ("B", "Democracy", "Election map when joined with machine-readable results"),
    "5f125543-f032-46e1-901d-05cd7b5678e6": ("B", "Democracy", "Longitudinal election results and turnout explorer"),
    "b2068d46-de7f-4a22-a563-4dea59b1e6f2": ("B", "Digital inclusion", "Public Wi-Fi coverage and demand map"),
    "d849807f-d313-45fb-a7b6-af3f726a1673": ("B", "Digital inclusion", "Public Wi-Fi usage, but only a 2022 half-year is listed"),
    "cbd03782-d8cd-49de-a038-9ce7bd1591ce": ("B", "City change", "Visual change detection when combined with older orthophotos"),
    "162398d4-b2ea-4674-83d4-2c1d851a521a": ("B", "Circular city", "Nearest correctly typed recycling point"),
    "5776d96d-b693-4df6-a8ee-ecff1e04a2fc": ("B", "Transparency", "Explore subsidy recipients and funding networks"),
    "928150db-c4e7-4d2a-9dd6-42374a4f1dd7": ("B", "Energy", "Long-run municipal electricity generation story"),
    "35538aec-3486-4ef1-9b15-840b359c5a5e": ("B", "Public space", "Dog-zone finder and coverage analysis"),
    "d587eab4-6c96-4d48-978d-2d5d12c57f15": ("B", "Urban nature", "Edible-city map; coordinates are not precise"),
    "c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6": ("A", "Climate", "Live air and weather dashboard; five of nine station URLs worked on review"),
}


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def parse_entries(pattern: str) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    for filename in sorted(glob.glob(pattern)):
        root = ET.parse(filename).getroot()
        for entry in root.findall("atom:entry", ATOM):
            resources = []
            alternate = ""
            for link in entry.findall("atom:link", ATOM):
                rel = link.get("rel", "")
                if rel == "enclosure":
                    resources.append(
                        {"url": link.get("href", ""), "format": link.get("type", "")}
                    )
                elif rel == "alternate":
                    alternate = link.get("href", "")
            entries.append(
                {
                    "id": clean(entry.findtext("atom:id", namespaces=ATOM)),
                    "title": clean(entry.findtext("atom:title", namespaces=ATOM)),
                    "summary": clean(entry.findtext("atom:summary", namespaces=ATOM)),
                    "published": clean(entry.findtext("atom:published", namespaces=ATOM)),
                    "updated": clean(entry.findtext("atom:updated", namespaces=ATOM)),
                    "url": alternate,
                    "resources": resources,
                }
            )
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pattern", help="Glob for downloaded Atom pages")
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--json", type=Path, required=True)
    args = parser.parse_args()

    entries = parse_entries(args.pattern)
    formats = Counter(
        resource["format"].upper()
        for entry in entries
        for resource in entry["resources"]
        if resource["format"]
    )

    with args.csv.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "interest", "theme", "hackathon_use", "title", "summary",
                "published", "updated", "formats", "resource_count",
                "dataset_url", "resource_urls",
            ],
        )
        writer.writeheader()
        for entry in entries:
            resources = entry["resources"]
            key = str(entry["url"]).rstrip("/").rsplit("/", 1)[-1]
            interest, theme, hackathon_use = INTERESTING.get(key, ("", "", ""))
            writer.writerow(
                {
                    "interest": interest,
                    "theme": theme,
                    "hackathon_use": hackathon_use,
                    "title": entry["title"],
                    "summary": entry["summary"],
                    "published": entry["published"],
                    "updated": entry["updated"],
                    "formats": ";".join(sorted({r["format"].upper() for r in resources})),
                    "resource_count": len(resources),
                    "dataset_url": entry["url"],
                    "resource_urls": ";".join(r["url"] for r in resources),
                }
            )

    args.json.write_text(
        json.dumps(
            {"entry_count": len(entries), "resource_formats": formats, "entries": entries},
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print(f"Parsed {len(entries)} entries; formats: {formats.most_common()}")


if __name__ == "__main__":
    main()
