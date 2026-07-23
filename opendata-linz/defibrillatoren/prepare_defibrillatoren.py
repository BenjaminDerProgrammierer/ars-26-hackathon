#!/usr/bin/env python3
"""Convert the official Linz defibrillator export into a web-friendly CSV."""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, InvalidOperation
import hashlib
import os
from pathlib import Path
import tempfile


SOURCE_FIELDS = [
    "FIRMA",
    "Adresse",
    "PLZ",
    "Stadt",
    "Marke/Hersteller",
    "Standort",
    "Koordinaten N",
    "Koordinaten O",
]
OUTPUT_FIELDS = [
    "id",
    "FIRMA",
    "Adresse",
    "PLZ",
    "Stadt",
    "Marke/Hersteller",
    "Standort",
    "lat",
    "lon",
]
ID_FIELDS = tuple(OUTPUT_FIELDS[1:])
EMPTY_MARKERS = {"", "-"}
COORDINATE_DECIMAL_PLACES = 14


def parse_args() -> argparse.Namespace:
    directory = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description=(
            "Convert the official defibrillator CSV to normalized, "
            "comma-delimited UTF-8 CSV."
        )
    )
    parser.add_argument(
        "input",
        nargs="?",
        type=Path,
        default=directory / "Defibrillatoren-source.csv",
        help="official source CSV (default: %(default)s)",
    )
    parser.add_argument(
        "output",
        nargs="?",
        type=Path,
        default=directory / "Defibrillatoren.csv",
        help="prepared output CSV (default: %(default)s)",
    )
    return parser.parse_args()


def normalize(value: str | None) -> tuple[str, bool]:
    """Trim a source value and replace an empty marker with an empty string."""
    original = value or ""
    stripped = original.strip()
    normalized = "" if stripped in EMPTY_MARKERS else stripped
    return normalized, normalized != original


def format_coordinate(
    value: str, *, minimum: Decimal, maximum: Decimal, line_number: int
) -> str:
    """Convert a decimal-comma coordinate with an optional degree sign."""
    if value == "":
        return ""

    normalized = value.removesuffix("°").strip().replace(",", ".")
    try:
        coordinate = Decimal(normalized)
    except InvalidOperation as error:
        raise ValueError(
            f"Invalid WGS84 coordinate on line {line_number}: {value!r}"
        ) from error
    if (
        not coordinate.is_finite()
        or not minimum <= coordinate <= maximum
    ):
        raise ValueError(
            f"WGS84 coordinate out of range on line {line_number}: {value!r}"
        )
    return f"{coordinate:.{COORDINATE_DECIMAL_PLACES}f}"


def make_id(row: dict[str, str], occurrence: int) -> str:
    """Create a deterministic snapshot ID, including duplicate occurrence."""
    key = "\x1f".join(row[field] for field in ID_FIELDS)
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]
    suffix = "" if occurrence == 1 else f"_{occurrence}"
    return f"defi_{digest}{suffix}"


def validate_header(fieldnames: list[str] | None) -> None:
    if fieldnames != SOURCE_FIELDS:
        raise ValueError(
            "Unexpected source columns.\n"
            f"Expected: {SOURCE_FIELDS}\n"
            f"Received: {fieldnames}"
        )


def convert(input_path: Path, output_path: Path) -> None:
    if input_path.resolve() == output_path.resolve():
        raise ValueError("Input and output paths must be different")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    occurrences: dict[tuple[str, ...], int] = {}
    seen_ids: set[str] = set()
    row_count = 0
    normalized_value_count = 0
    missing_coordinate_count = 0

    with (
        input_path.open("r", encoding="utf-8-sig", newline="") as source,
        tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            newline="",
            dir=output_path.parent,
            prefix=f".{output_path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary,
    ):
        temporary_path = Path(temporary.name)
        try:
            reader = csv.DictReader(source, delimiter=",", strict=True)
            validate_header(reader.fieldnames)
            writer = csv.DictWriter(
                temporary,
                fieldnames=OUTPUT_FIELDS,
                delimiter=",",
                lineterminator="\n",
                quoting=csv.QUOTE_MINIMAL,
            )
            writer.writeheader()

            for line_number, source_row in enumerate(reader, start=2):
                if None in source_row:
                    raise ValueError(f"Unexpected extra column on line {line_number}")
                if any(source_row[field] is None for field in SOURCE_FIELDS):
                    raise ValueError(f"Missing column value on line {line_number}")

                row: dict[str, str] = {}
                for field in SOURCE_FIELDS[:-2]:
                    value, changed = normalize(source_row[field])
                    row[field] = value
                    normalized_value_count += int(changed)

                raw_lat, lat_changed = normalize(source_row["Koordinaten N"])
                raw_lon, lon_changed = normalize(source_row["Koordinaten O"])
                normalized_value_count += int(lat_changed) + int(lon_changed)
                if (raw_lat == "") != (raw_lon == ""):
                    raise ValueError(
                        f"Incomplete coordinate pair on line {line_number}"
                    )

                row["lat"] = format_coordinate(
                    raw_lat,
                    minimum=Decimal("-90"),
                    maximum=Decimal("90"),
                    line_number=line_number,
                )
                row["lon"] = format_coordinate(
                    raw_lon,
                    minimum=Decimal("-180"),
                    maximum=Decimal("180"),
                    line_number=line_number,
                )
                missing_coordinate_count += int(row["lat"] == "")

                key = tuple(row[field] for field in ID_FIELDS)
                occurrence = occurrences.get(key, 0) + 1
                occurrences[key] = occurrence
                record_id = make_id(row, occurrence)
                if record_id in seen_ids:
                    raise ValueError(
                        f"Generated ID collision on line {line_number}: {record_id}"
                    )
                seen_ids.add(record_id)

                writer.writerow({"id": record_id, **row})
                row_count += 1

            temporary.flush()
            os.fsync(temporary.fileno())
            os.replace(temporary_path, output_path)
            output_path.chmod(0o644)
        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise

    duplicate_count = sum(count - 1 for count in occurrences.values())
    print(f"Wrote {row_count:,} rows to {output_path}")
    print(f"Generated {len(seen_ids):,} unique snapshot IDs")
    print(f"Preserved {duplicate_count:,} duplicate source rows")
    print(f"Normalized {normalized_value_count:,} source values")
    print(f"Preserved {missing_coordinate_count:,} empty coordinate pairs")


def main() -> None:
    args = parse_args()
    convert(args.input, args.output)


if __name__ == "__main__":
    main()
