import importlib.util
import unittest
from datetime import datetime
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location(
    "ars_dataset", SKILL_DIR / "scripts" / "ars_dataset.py")
ars_dataset = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ars_dataset)


def valid_export():
    return {
        "_meta": {
            "generated_at": "2026-07-06T06:06:28.459Z",
            "databases": {
                "projects": {"description": "Projects", "count": 1},
            },
        },
        "projects": [{
            "id": "Project-0123456789abcdef0123456789abcdef",
            "Name EN": "Example",
            "Curatorial Highlight": "No",
            "Timetable": "No",
            "Status Web": "pending",
            "Web Link": "offline",
        }],
        "contacts": [],
        "locations": [],
        "calendar": [],
    }


class ParseEventDatetimeTests(unittest.TestCase):
    def test_same_day_range(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → 16:15")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 9, 16, 15, tzinfo=ars_dataset.CEST))

    def test_full_date_range(self):
        start, end = ars_dataset.parse_event_datetime(
            "8. September 2026 16:00 (MESZ) → "
            "12. September 2026 18:00 (MESZ)")

        self.assertEqual(
            start, datetime(2026, 9, 8, 16, 0, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 12, 18, 0, tzinfo=ars_dataset.CEST))

    def test_time_only_end_crosses_midnight(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 23:30 (MESZ) → 01:15")

        self.assertEqual(
            start, datetime(2026, 9, 9, 23, 30, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 10, 1, 15, tzinfo=ars_dataset.CEST))

    def test_missing_or_garbage_input_is_unparseable(self):
        for value in (None, "", "not a festival time"):
            with self.subTest(value=value):
                self.assertEqual(
                    ars_dataset.parse_event_datetime(value), (None, None))

    def test_invalid_start_time_is_unparseable(self):
        self.assertEqual(
            ars_dataset.parse_event_datetime(
                "9. September 2026 99:99 (MESZ) → 16:15"),
            (None, None),
        )

    def test_invalid_full_date_end_returns_start_only(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → "
            "10. September 2026 99:99 (MESZ)")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertIsNone(end)

    def test_invalid_time_only_end_returns_start_only(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → 99:99")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertIsNone(end)


class VerifyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = ars_dataset.load(SKILL_DIR / "references" / "schema.json")

    def verify(self, mutate=None):
        data = valid_export()
        if mutate:
            mutate(data)
        return ars_dataset.verify(data, self.schema)

    def test_valid_export_passes(self):
        self.assertFalse(self.verify())

    def test_unknown_record_field_is_rejected(self):
        violations = self.verify(
            lambda data: data["projects"][0].update({"Unexpected": True}))
        self.assertEqual(
            violations[("projects", "Unexpected", "unknown field")], 1)

    def test_missing_required_record_field_is_rejected(self):
        violations = self.verify(
            lambda data: data["projects"][0].pop("Status Web"))
        self.assertEqual(
            violations[("projects", "Status Web", "missing required field")], 1)

    def test_database_must_be_an_array(self):
        violations = self.verify(lambda data: data.update({"projects": {}}))
        self.assertEqual(
            violations[("<root>", "projects", "invalid value")], 1)

    def test_metadata_field_type_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"].update({"generated_at": 42}))
        self.assertEqual(
            violations[("_meta", "generated_at", "invalid value")], 1)

    def test_nested_metadata_type_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"]["databases"]["projects"].update(
                {"count": True}))
        self.assertEqual(
            violations[("_meta", "databases.projects.count", "invalid value")], 1)

    def test_metadata_timestamp_format_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"].update({"generated_at": "not-a-date"}))
        self.assertEqual(
            violations[("_meta", "generated_at", "invalid value")], 1)

    def test_missing_root_field_is_rejected(self):
        violations = self.verify(lambda data: data.pop("calendar"))
        self.assertEqual(
            violations[("<root>", "calendar", "missing required field")], 1)

    def test_internal_index_key_is_allowed(self):
        data = valid_export()
        ars_dataset.build_indexes(data)
        self.assertFalse(ars_dataset.verify(data, self.schema))


if __name__ == "__main__":
    unittest.main()
