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
  assert.deepEqual(prescreen(work({ language: "de" })).reason_codes, ["X-LANGUAGE"]);
  const ohf = work({
    authorships: [{ author: { display_name: "X" }, institutions: [{ display_name: "Open Home Foundation" }] }],
  });
  assert.deepEqual(prescreen(ohf).reason_codes, ["X-OHF"]);
});

test("venues pass only from the pre-approved lists, by source ID, ISSN or name", () => {
  const at = (source) => prescreen(work({ primary_location: { source } }));
  assert.equal(at({ id: "https://openalex.org/S101949793", display_name: "Sensors", type: "journal" }).quality_basis, "Pre-approved");
  assert.equal(at({ id: "S1", display_name: "Renamed", issn: ["2076-3417"], type: "journal" }).quality_basis, "Pre-approved");
  assert.equal(at({ id: "S1", display_name: "IET Conference Proceedings", type: "conference" }).quality_basis, "Pre-approved");
  assert.equal(at({ id: "S7407087804", display_name: "TEI", type: "conference" }).quality_basis, "Pre-approved");
  assert.equal(at({ id: "S9", display_name: "Proceedings XoveTIC 2026", type: "conference" }).quality_basis, "Pre-approved");
  assert.deepEqual(at({ id: "S8", display_name: "Iterative International Publishers eBooks", type: "ebook platform" }).reason_codes, ["X-PREDATORY", "X-VENUE"]);
  const other = at({ id: "S2", display_name: "Some Journal", type: "journal" });
  assert.deepEqual(other.reason_codes, ["X-VENUE"]);
  assert.ok(other.needsMetrics);
  assert.ok(!at({ id: "S3", display_name: "Some Conference", type: "conference" }).needsMetrics);
});

test("theses and workshop papers skip the venue check", () => {
  const thesis = prescreen(work({ type: "dissertation", primary_location: { source: { display_name: "Repo", type: "repository" } } }));
  assert.equal(thesis.decision, "PENDING");
  assert.equal(thesis.quality_basis, "Thesis");
  const workshop = prescreen(work({ primary_location: { source: { display_name: "Workshop on Smart Homes", type: "conference" } } }));
  assert.equal(workshop.decision, "PENDING");
  assert.equal(workshop.quality_basis, "Workshop paper");
});

test("a preprint with a published location is screened as the published version", () => {
  const screen = prescreen(
    work({
      type: "preprint",
      primary_location: { source: { display_name: "arXiv", type: "repository" }, landing_page_url: "https://arxiv.org/abs/1" },
      locations: [
        { source: { display_name: "arXiv", type: "repository" } },
        { source: { id: "S189694085", display_name: "IEEE Sensors Journal", type: "journal" } },
      ],
    }),
  );
  assert.deepEqual(screen.reason_codes, []);
  assert.equal(screen.venue, "IEEE Sensors Journal");
  assert.equal(screen.preprintUrl, "https://arxiv.org/abs/1");
});
