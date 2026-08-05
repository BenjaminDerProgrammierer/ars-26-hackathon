import assert from "node:assert/strict";
import test from "node:test";
import { prepareDataset } from "../src/prepare-data.js";

const publicId = "a".repeat(32);
const privateId = "b".repeat(32);
const locationId = "c".repeat(32);

function fixture() {
  return {
    _meta: { generated_at: "2026-08-04T00:00:00Z", schema_version: "2.1" },
    locations: [
      {
        canonical_id: locationId,
        "Name EN": "Room EN",
        "Name DE": "Raum DE",
        "Breadcrumb EN": "Building / Room EN",
        "Breadcrumb DE": "Gebäude / Raum DE",
        public_for_hackathon: false,
      },
    ],
    projects: [
      {
        canonical_id: publicId,
        "Name EN": "Public project",
        "Name DE": "Öffentliches Projekt",
        Category: "Exhibition",
        Artists: "Example Artist",
        "Web Preview Text EN": "An English preview.",
        "Web Preview Text DE": "Eine deutsche Vorschau.",
        "Description EN": "An English description.",
        "Description DE": "Eine deutsche Beschreibung.",
        "Linked Location": [locationId],
        "Web Link": "https://example.test/public",
        public_for_hackathon: true,
        link_allowed: true,
      },
      {
        canonical_id: privateId,
        "Name EN": "Private project",
        "Web Preview Text EN": "Must never be indexed.",
        public_for_hackathon: false,
        link_allowed: true,
        "Web Link": "https://example.test/private",
      },
    ],
  };
}

test("prepares only public language documents and joins non-public location context by canonical ID", () => {
  const prepared = prepareDataset(fixture());
  assert.equal(prepared.documents.length, 2);
  assert.deepEqual(prepared.documents.map(({ language }) => language), ["en", "de"]);
  assert.ok(prepared.documents.every(({ projectId }) => projectId === publicId));
  assert.ok(prepared.documents.every(({ publicForHackathon }) => publicForHackathon));
  assert.equal(prepared.documents[0]?.location, "Building / Room EN");
  assert.equal(prepared.documents[1]?.location, "Gebäude / Raum DE");
  assert.equal(prepared.documents[0]?.chunkId, `${publicId}:en:0`);
  assert.equal(prepared.documents[0]?.url, "https://example.test/public");
});

test("removes URLs when links are not allowed", () => {
  const data = fixture();
  data.projects[0]!.link_allowed = false;
  const prepared = prepareDataset(data);
  assert.ok(prepared.documents.every(({ url, linkAllowed }) => url === null && !linkAllowed));
});

test("rejects a public project without a canonical ID", () => {
  const data = fixture();
  data.projects[0]!.canonical_id = "readable-id";
  assert.throws(() => prepareDataset(data), /valid canonical_id/);
});
