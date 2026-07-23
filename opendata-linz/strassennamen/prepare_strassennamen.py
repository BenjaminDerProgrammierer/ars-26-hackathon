#!/usr/bin/env python3
"""Convert both official Linz street-name exports into tidy UTF-8 CSV files."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
import os
from pathlib import Path
import tempfile


CURRENT_SOURCE_FIELDS = [
    "ID",
    "Name",
    "KG",
    "Beschreibung",
    "Link",
    "Wikidata ID",
    "Wikidata Link",
    "Benannt nach",
    "Wikidata Person ID",
    "Wikidata Person Link",
    "Wikidata Person Name",
    "Wikidata Person Geschlecht",
    "Wikidata Person Beruf",
    "Wikidata Person Geburtsdatum",
    "Wikidata Person Sterbedatum",
]
HISTORICAL_SOURCE_FIELDS = [
    "ID",
    "Name",
    "KG",
    "Beschreibung",
    "Link",
    "Benannt nach",
    "Wikidata",
    "Wikidata Link",
    "Wikidata Name",
    "Wikidata Geschlecht",
    "Wikidata Beruf",
    "Wikidata Geburtsdatum",
    "Wikidata Sterbedatum",
    "Aktuelle Straße",
    "m/w",
    "Jahr der Benennung",
    "Jahr der Löschung",
]
CURRENT_OUTPUT_FIELDS = [
    "id",
    "quell_id",
    "name",
    "katastralgemeinde",
    "beschreibung",
    "detail_url",
    "strasse_wikidata_id",
    "strasse_wikidata_url",
    "benannt_nach",
    "person_wikidata_id",
    "person_wikidata_url",
    "person_name",
    "person_geschlecht",
    "person_beruf",
    "person_geburtsdatum",
    "person_sterbedatum",
]
HISTORICAL_OUTPUT_FIELDS = [
    "id",
    "quell_id",
    "name",
    "katastralgemeinde",
    "beschreibung",
    "detail_url",
    "benannt_nach",
    "person_wikidata_id",
    "person_wikidata_url",
    "person_name",
    "person_geschlecht",
    "person_beruf",
    "person_geburtsdatum",
    "person_sterbedatum",
    "heutiger_strassenname",
    "benennung_code",
    "jahr_benennung",
    "jahr_loeschung",
]


def parse_args() -> argparse.Namespace:
    directory = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Convert both Linz street-name CSVs.")
    parser.add_argument(
        "--current-input",
        type=Path,
        default=directory / "Strassennamen-aktuell-source.csv",
    )
    parser.add_argument(
        "--historical-input",
        type=Path,
        default=directory / "Strassennamen-historisch-source.csv",
    )
    parser.add_argument(
        "--current-output",
        type=Path,
        default=directory / "Strassennamen-aktuell.csv",
    )
    parser.add_argument(
        "--historical-output",
        type=Path,
        default=directory / "Strassennamen-historisch.csv",
    )
    return parser.parse_args()


def clean(value: str | None) -> str:
    return " ".join((value or "").split())


def date_only(value: str | None, *, line_number: int, field: str) -> str:
    normalized = clean(value)
    if not normalized:
        return ""
    try:
        return datetime.strptime(normalized, "%Y-%m-%dT%H:%M:%SZ").date().isoformat()
    except ValueError as error:
        raise ValueError(
            f"Invalid date in {field!r} on line {line_number}: {value!r}"
        ) from error


def validate_row(
    row: dict[str | None, str | None],
    fields: list[str],
    *,
    line_number: int,
) -> None:
    if None in row:
        raise ValueError(f"Unexpected extra column on line {line_number}")
    if any(row[field] is None for field in fields):
        raise ValueError(f"Missing column value on line {line_number}")


def read_rows(
    path: Path, expected_fields: list[str]
) -> list[tuple[int, dict[str | None, str | None]]]:
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source, strict=True)
        if reader.fieldnames != expected_fields:
            raise ValueError(
                f"Unexpected columns in {path.name}.\n"
                f"Expected: {expected_fields}\nReceived: {reader.fieldnames}"
            )
        result = []
        for line_number, row in enumerate(reader, start=2):
            validate_row(row, expected_fields, line_number=line_number)
            result.append((line_number, row))
        return result


def write_rows(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        newline="",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as temporary:
        temporary_path = Path(temporary.name)
        try:
            writer = csv.DictWriter(
                temporary, fieldnames=fields, lineterminator="\n"
            )
            writer.writeheader()
            writer.writerows(rows)
            temporary.flush()
            os.fsync(temporary.fileno())
            os.replace(temporary_path, path)
            path.chmod(0o644)
        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise


def convert_current(path: Path) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    seen_ids: set[str] = set()
    for line_number, source in read_rows(path, CURRENT_SOURCE_FIELDS):
        source_id = clean(source["ID"])
        name = clean(source["Name"])
        if not source_id.isdecimal() or not name:
            raise ValueError(f"Invalid ID or name on line {line_number}")
        record_id = f"strasse_{source_id}"
        if record_id in seen_ids:
            raise ValueError(f"Duplicate ID on line {line_number}: {record_id}")
        seen_ids.add(record_id)
        output.append(
            {
                "id": record_id,
                "quell_id": source_id,
                "name": name,
                "katastralgemeinde": clean(source["KG"]),
                "beschreibung": clean(source["Beschreibung"]),
                "detail_url": clean(source["Link"]).replace("http://", "https://", 1),
                "strasse_wikidata_id": clean(source["Wikidata ID"]),
                "strasse_wikidata_url": clean(source["Wikidata Link"]),
                "benannt_nach": clean(source["Benannt nach"]),
                "person_wikidata_id": clean(source["Wikidata Person ID"]),
                "person_wikidata_url": clean(source["Wikidata Person Link"]),
                "person_name": clean(source["Wikidata Person Name"]),
                "person_geschlecht": clean(source["Wikidata Person Geschlecht"]),
                "person_beruf": clean(source["Wikidata Person Beruf"]),
                "person_geburtsdatum": date_only(
                    source["Wikidata Person Geburtsdatum"],
                    line_number=line_number,
                    field="Wikidata Person Geburtsdatum",
                ),
                "person_sterbedatum": date_only(
                    source["Wikidata Person Sterbedatum"],
                    line_number=line_number,
                    field="Wikidata Person Sterbedatum",
                ),
            }
        )
    return output


def convert_historical(path: Path) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    seen_ids: set[str] = set()
    for line_number, source in read_rows(path, HISTORICAL_SOURCE_FIELDS):
        source_id = clean(source["ID"])
        name = clean(source["Name"])
        code = clean(source["m/w"])
        if not source_id.isdecimal() or not name:
            raise ValueError(f"Invalid ID or name on line {line_number}")
        if code not in {"", "M", "W", "X"}:
            raise ValueError(f"Unexpected m/w code on line {line_number}: {code!r}")
        record_id = f"strasse_historisch_{source_id}"
        if record_id in seen_ids:
            raise ValueError(f"Duplicate ID on line {line_number}: {record_id}")
        seen_ids.add(record_id)
        output.append(
            {
                "id": record_id,
                "quell_id": source_id,
                "name": name,
                "katastralgemeinde": clean(source["KG"]),
                "beschreibung": clean(source["Beschreibung"]),
                "detail_url": clean(source["Link"]),
                "benannt_nach": clean(source["Benannt nach"]),
                "person_wikidata_id": clean(source["Wikidata"]),
                "person_wikidata_url": clean(source["Wikidata Link"]),
                "person_name": clean(source["Wikidata Name"]),
                "person_geschlecht": clean(source["Wikidata Geschlecht"]),
                "person_beruf": clean(source["Wikidata Beruf"]),
                "person_geburtsdatum": date_only(
                    source["Wikidata Geburtsdatum"],
                    line_number=line_number,
                    field="Wikidata Geburtsdatum",
                ),
                "person_sterbedatum": date_only(
                    source["Wikidata Sterbedatum"],
                    line_number=line_number,
                    field="Wikidata Sterbedatum",
                ),
                "heutiger_strassenname": clean(source["Aktuelle Straße"]),
                "benennung_code": code,
                "jahr_benennung": clean(source["Jahr der Benennung"]),
                "jahr_loeschung": clean(source["Jahr der Löschung"]),
            }
        )
    return output


def main() -> None:
    args = parse_args()
    current = convert_current(args.current_input)
    historical = convert_historical(args.historical_input)
    write_rows(args.current_output, CURRENT_OUTPUT_FIELDS, current)
    write_rows(args.historical_output, HISTORICAL_OUTPUT_FIELDS, historical)
    print(f"Wrote {len(current):,} current streets to {args.current_output}")
    print(f"Wrote {len(historical):,} historical streets to {args.historical_output}")


if __name__ == "__main__":
    main()
