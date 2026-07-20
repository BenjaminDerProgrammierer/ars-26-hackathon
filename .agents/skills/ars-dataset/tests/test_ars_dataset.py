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
            "generated_at": "2026-07-20T07:59:49.183Z",
            "databases": {
                "projects": {"description": "Projects", "count": 1},
            },
        },
        "projects": [{
            "id": "Project-0123456789abcdef0123456789abcdef",
            "canonical_id": "0123456789abcdef0123456789abcdef",
            "id_source": "notion",
            "Name EN": "Example",
            "Curatorial Highlight": "No",
            "Timetable": "No",
            "Status Web": "pending",
            "status_web": "pending",
            "visibility_rule": "hidden",
            "public_for_hackathon": False,
            "link_allowed": False,
            "calendar_ids": [],
            "Web Link": None,
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


class SchemaV2HelperTests(unittest.TestCase):
    def test_build_indexes_uses_canonical_id(self):
        data = valid_export()
        data["projects"][0]["id"] = "readable-without-a-hash"

        indexes = ars_dataset.build_indexes(data)

        self.assertIn(
            "0123456789abcdef0123456789abcdef", indexes["projects"])

    def test_build_indexes_does_not_fall_back_to_readable_id(self):
        data = valid_export()
        data["projects"][0].pop("canonical_id")

        indexes = ars_dataset.build_indexes(data)

        self.assertFalse(indexes["projects"])

    def test_key_of_accepts_only_bare_canonical_ids(self):
        canonical_id = "0123456789abcdef0123456789abcdef"
        self.assertEqual(ars_dataset.key_of(canonical_id), canonical_id)
        self.assertIsNone(ars_dataset.key_of("Project-" + canonical_id))

    def test_parse_coord_accepts_only_schema_v2_numbers(self):
        self.assertEqual(ars_dataset.parse_coord(48.309619), 48.309619)
        self.assertIsNone(ars_dataset.parse_coord("48,309619"))
        self.assertIsNone(ars_dataset.parse_coord(True))

    def test_is_public_requires_explicit_true(self):
        self.assertTrue(ars_dataset.is_public({"public_for_hackathon": True}))
        self.assertFalse(ars_dataset.is_public({"public_for_hackathon": False}))
        self.assertFalse(ars_dataset.is_public({}))

    def test_public_event_rows_trust_flags_and_hide_private_locations(self):
        project_id = "0123456789abcdef0123456789abcdef"
        public_location_id = "1123456789abcdef0123456789abcdef"
        hidden_location_id = "2123456789abcdef0123456789abcdef"
        data = {
            "projects": [{
                "canonical_id": project_id,
                "Name EN": None,
                "public_for_hackathon": True,
                "Linked Location": [hidden_location_id, public_location_id],
            }],
            "contacts": [],
            "locations": [{
                "canonical_id": hidden_location_id,
                "public_for_hackathon": False,
                "Latitude": 48.1,
                "Longitude": 14.1,
            }, {
                "canonical_id": public_location_id,
                "public_for_hackathon": True,
                "Latitude": 48.2,
                "Longitude": 14.2,
            }],
            "calendar": [{
                "canonical_id": "3123456789abcdef0123456789abcdef",
                "project_ref": project_id,
                "public_for_hackathon": True,
            }],
        }

        rows = ars_dataset.event_rows(data, public_only=True)

        self.assertEqual(len(rows), 1)
        self.assertEqual(
            [location["canonical_id"] for location in rows[0]["locations"]],
            [public_location_id],
        )
        self.assertEqual((rows[0]["lat"], rows[0]["lon"]), (48.2, 14.2))


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

    def test_visibility_flag_must_be_boolean(self):
        violations = self.verify(
            lambda data: data["projects"][0].update(
                {"public_for_hackathon": "false"}))
        self.assertEqual(
            violations[("projects", "public_for_hackathon", "invalid value")],
            1,
        )

    def test_canonical_id_must_be_bare_lowercase_hex(self):
        for canonical_id in (
                "not-a-canonical-id",
                "0123456789ABCDEF0123456789ABCDEF",
                "Project-0123456789abcdef0123456789abcdef"):
            with self.subTest(canonical_id=canonical_id):
                violations = self.verify(
                    lambda data: data["projects"][0].update(
                        {"canonical_id": canonical_id}))
                self.assertEqual(
                    violations[("projects", "canonical_id", "invalid value")],
                    1,
                )

    def test_linked_ids_must_be_canonical_ids(self):
        violations = self.verify(
            lambda data: data["projects"][0].update(
                {"Linked Contacts": ["not-a-canonical-id"]}))
        self.assertEqual(
            violations[("projects", "Linked Contacts", "invalid value")],
            1,
        )

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
