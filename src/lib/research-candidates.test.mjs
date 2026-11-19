import { test } from "node:test";
import assert from "node:assert/strict";
import { existingKeys, isAlreadyListed, normaliseDoi, prescreen, workKey } from "./research-candidates.mjs";

const work = (overrides = {}) => ({
  id: "https://openalex.org/W1",
  doi: "https://doi.org/10.1000/ABC",
  title: "A Study",
  type: "article",
  is_retracted: false,
  authorships: [{ author: { display_name: "Ada Lovelace" }, institutions: [], raw_affiliation_strings: [] }],
  primary_location: { source: { display_name: "Energy and Buildings", type: "journal" } },
  ...overrides,
});

test("normaliseDoi strips the resolver and lowercases", () => {
  assert.equal(normaliseDoi("https://doi.org/10.1000/ABC"), "10.1000/abc");
  assert.equal(normaliseDoi(null), null);
});

test("workKey falls back to title and first author surname", () => {
  assert.equal(workKey(work()), "doi:10.1000/abc");
  assert.equal(workKey(work({ doi: null, title: "A Study!" })), "title:a study|lovelace");
});

test("already-listed works match by DOI or title", () => {
  const existing = existingKeys(`- title: "Other"\n  links:\n    - { label: "Paper", url: "https://doi.org/10.1000/abc" }\n- title: "A Study"\n`);
  assert.ok(isAlreadyListed(work(), existing));
  assert.ok(isAlreadyListed(work({ doi: null }), existing));
  assert.ok(!isAlreadyListed(work({ doi: null, title: "New" }), existing));
});

test("prescreen applies the mechanical exclusions", () => {
  assert.deepEqual(prescreen(work()).reason_codes, []);
  assert.equal(prescreen(work()).quality_basis, "Pre-approved");
  assert.deepEqual(prescreen(work({ is_retracted: true })).reason_codes, ["X-RETRACTED"]);
  assert.deepEqual(prescreen(work({ type: "preprint" })).reason_codes, ["X-PREPRINT"]);
  assert.deepEqual(prescreen(work({ type: "dataset" })).reason_codes, ["X-NOTPEER"]);
  const ohf = work({
    authorships: [{ author: { display_name: "X" }, institutions: [{ display_name: "Open Home Foundation" }] }],
  });
  assert.deepEqual(prescreen(ohf).reason_codes, ["X-OHF"]);
  const mdpi = work({ primary_location: { source: { display_name: "Sensors (MDPI)", type: "journal" } } });
  assert.equal(prescreen(mdpi).quality_basis, null);
  assert.equal(prescreen(mdpi).decision, "PENDING");
});
