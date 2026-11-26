import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyOf, degreeOf, isEnglish, mentions } from "./research-fulltext.mjs";

const paper = `Title Home Assistant study
Abstract We use Home Assistant.
1 Introduction
Platforms such as Home Assistant exist.
2 Related Work
Others compared openHAB.
3 Implementation
The controller runs Home Assistant on a Raspberry Pi. A home assistant device is generic.
4 Conclusion
Done.
References
[1] Home Assistant. https://home-assistant.io`;

test("bodyOf drops the abstract and references", () => {
  const body = bodyOf(paper);
  assert.ok(body.startsWith("1 Introduction"));
  assert.ok(!body.includes("[1]"));
});

test("mentions counts exact, case-sensitive names and their sections", () => {
  const m = mentions(paper);
  assert.equal(m.total, 2);
  assert.equal(m.in_methods, 1);
  assert.deepEqual(m.sections, ["Introduction", "Implementation"]);
});

test("mentions skips generic assistants, people called Piper and citations", () => {
  const text = `1 Introduction
Smart Home Assistants listen all the time. Training Home Assistants is hard. The Home Assistant Benchmark (HAB) is for robots.
Work by Anne Marie Piper studied accessibility. Andrew Piper wrote on narrative.
2 Implementation
Speech is synthesised with Piper TTS on a Raspberry Pi. Home Assistant runs the automations.
[17] Home Assistant. Available online: https://www.home-assistant.io (accessed 2025).
17. Home Assistant. Available online: https://example.org
Home Assistant. (n.d.). Home Assistant. Retrieved March 12, 2026.
Conclusion`;
  const m = mentions(text);
  assert.deepEqual(m.counts, { Piper: 1, "Home Assistant": 1 });
});

test("degreeOf reads the title pages", () => {
  assert.equal(degreeOf("A thesis submitted for the degree of Doctor of Philosophy"), "PhD");
  assert.equal(degreeOf("MASTER’S THESIS 2026 Beyond Motion"), "master's");
  assert.equal(degreeOf("BRNO UNIVERSITY OF TECHNOLOGY BACHELOR’S THESIS"), "bachelor's");
  assert.equal(degreeOf("UNIVERSITY OF THESSALY Diploma Thesis"), "bachelor's");
  assert.equal(degreeOf("FEUP Dissertação"), null);
  assert.equal(degreeOf("Mestrado em Engenharia Informática e Computação"), "master's");
  assert.equal(degreeOf("Master in Computer Science and Business Management"), "master's");
});

test("isEnglish separates English from other languages", () => {
  const en = "1 Introduction " + "the system is built on the platform and the data is stored in the database for the users ".repeat(30);
  const pt = "1 Introduction " + "o sistema foi construído sobre a plataforma e os dados são guardados na base de dados ".repeat(30);
  assert.equal(isEnglish(en), true);
  assert.equal(isEnglish(pt), false);
  assert.equal(isEnglish("too short"), null);
});
