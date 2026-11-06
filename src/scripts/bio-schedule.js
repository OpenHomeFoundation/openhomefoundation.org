import { isShowing, readEntry, readServerTime, select } from "../lib/bio-schedule.mjs";

const lists = [...document.querySelectorAll("[data-schedule]")].map((list) => {
  const items = [...list.children];
  return {
    list,
    items,
    limit: Number(list.dataset.limit) || Infinity,
    entries: items.map((item) => readEntry(item.dataset)),
  };
});

function update(now) {
  for (const { list, items, limit, entries } of lists) {
    const keys = select({ entries, limit }, now);
    items.forEach((item, index) => {
      item.hidden = !isShowing(entries[index], keys);
      const { airs, noteAfter } = item.dataset;
      const note = item.querySelector("small");
      if (airs && noteAfter && note && Date.parse(airs) <= now) note.textContent = noteAfter;
    });
    list.closest("section").hidden = keys.length === 0;
  }
}

if (document.querySelector("[data-starts], [data-ends]")) {
  readServerTime(location.pathname).then((server) => {
    if (!server) return;
    const now = () => server.time + (performance.now() - server.at);
    update(now());
    setInterval(() => update(now()), 60 * 1000);
  });
}
