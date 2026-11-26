import { test } from "node:test";
import assert from "node:assert/strict";
import { pageItems } from "./pagination.mjs";

const show = (items) => items.map((i) => (i.ellipsis ? "…" : i.current ? `[${i.page}]` : String(i.page))).join(" ");

test("wide shows the first two, the last two and the pages around the current one", () => {
  assert.equal(show(pageItems(1, 9).wide), "[1] 2 … 8 9");
  assert.equal(show(pageItems(5, 9).wide), "1 2 … 4 [5] 6 … 8 9");
  assert.equal(show(pageItems(3, 9).wide), "1 2 [3] 4 … 8 9");
  assert.equal(show(pageItems(2, 4).wide), "1 [2] 3 4");
});

test("narrow shows the first, the current and the last page", () => {
  assert.equal(show(pageItems(1, 9).narrow), "[1] … 9");
  assert.equal(show(pageItems(5, 9).narrow), "1 … [5] … 9");
  assert.equal(show(pageItems(2, 9).narrow), "1 [2] … 9");
  assert.equal(show(pageItems(2, 3).narrow), "1 [2] 3");
});
