import importlib.util
import unittest
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
