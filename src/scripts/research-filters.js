import arrow from "../assets/svg/arrow.svg?raw";
import { pageItems } from "../lib/pagination.mjs";

const press = (chips, active) => chips.forEach((c) => c.setAttribute("aria-pressed", String(c === active)));

function initPublicationFilters() {
  const chipGroup = document.querySelector("[data-publication-filters]");
  const list = document.querySelector("[data-publication-list]");
  if (!chipGroup || !list) return;

  const chips = [...chipGroup.querySelectorAll("[data-filter]")];
  chipGroup.hidden = false;

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      press(chips, chip);
      const filter = chip.dataset.filter;
      list.querySelectorAll(".publication-year-group").forEach((group) => {
        let visible = 0;
        group.querySelectorAll(".publication-row").forEach((row) => {
          const show = filter === "all" || row.dataset.filter === filter;
          row.hidden = !show;
          if (show) visible++;
        });
        group.hidden = visible === 0;
      });
    }),
  );
}

function initOthersList() {
  const controls = document.querySelector("[data-list-controls]");
  const list = document.querySelector("[data-others-list]");
  if (!controls || !list) return;

  const rows = [...list.querySelectorAll(".publication-row")];
  const pageSize = Number(list.dataset.pageSize) || 10;
  const search = controls.querySelector("[data-search]");
  const openAccess = controls.querySelector("[data-open-access]");
  const sort = controls.querySelector("[data-sort]");
  const count = controls.querySelector("[data-count]");
  const selects = [...controls.querySelectorAll("select[data-group]")];
  const empty = document.querySelector("[data-empty]");
  const pagination = document.querySelector("[data-pagination]");
  const filters = document.querySelector(".list-filters");

  const selected = {};
  let page = 1;

  const comparators = {
    newest: (a, b) => b.dataset.year - a.dataset.year || a.dataset.title.localeCompare(b.dataset.title),
    oldest: (a, b) => a.dataset.year - b.dataset.year || a.dataset.title.localeCompare(b.dataset.title),
    title: (a, b) => a.dataset.title.localeCompare(b.dataset.title),
  };

  const matches = (row) => {
    const query = search.value.trim().toLowerCase();
    if (query && !row.dataset.search.includes(query)) return false;
    if (openAccess.checked && row.dataset.oa !== "true") return false;
    return Object.entries(selected).every(
      ([group, value]) => !value || (row.dataset[group] ?? "").split(" ").includes(value),
    );
  };

  const renderPagination = (pages) => {
    pagination.replaceChildren();
    pagination.hidden = pages <= 1;
    if (pages <= 1) return;

    const button = (parent, label, target, { current = false, disabled = false, aria } = {}) => {
      const b = document.createElement("button");
      b.type = "button";
      if (label === "prev" || label === "next") {
        b.innerHTML = arrow;
        b.classList.add("list-pagination-arrow", `list-pagination-${label}`);
      } else {
        b.textContent = label;
      }
      b.disabled = disabled;
      if (aria) b.setAttribute("aria-label", aria);
      if (current) b.setAttribute("aria-current", "page");
      b.addEventListener("click", () => {
        page = target;
        render();
        list.closest("section").scrollIntoView({ behavior: "smooth" });
      });
      parent.append(b);
    };

    button(pagination, "prev", page - 1, { disabled: page === 1, aria: "Previous page" });
    for (const [size, items] of Object.entries(pageItems(page, pages))) {
      const group = document.createElement("div");
      group.className = `list-pagination-pages list-pagination-${size}`;
      for (const item of items) {
        if (item.ellipsis) {
          const gap = document.createElement("span");
          gap.className = "list-pagination-ellipsis";
          gap.textContent = "…";
          group.append(gap);
        } else {
          button(group, String(item.page), item.page, { current: item.current, aria: `Page ${item.page}` });
        }
      }
      pagination.append(group);
    }
    button(pagination, "next", page + 1, { disabled: page === pages, aria: "Next page" });
  };

  const render = () => {
    const visible = rows.filter(matches).sort(comparators[sort.value]);
    const pages = Math.max(1, Math.ceil(visible.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const shown = new Set(visible.slice(start, start + pageSize));

    rows.forEach((row) => (row.hidden = !shown.has(row)));
    list.append(...visible, ...rows.filter((r) => !visible.includes(r)));

    count.textContent = visible.length
      ? `Showing ${start + 1}–${start + shown.size} of ${visible.length} publications`
      : "No publications match";
    empty.hidden = visible.length > 0;
    renderPagination(pages);
  };

  const update = () => {
    page = 1;
    render();
  };

  selects.forEach((select) =>
    select.addEventListener("change", () => {
      selected[select.dataset.group] = select.value;
      update();
    }),
  );
  search.addEventListener("input", update);
  openAccess.addEventListener("change", update);
  sort.addEventListener("change", update);

  document.querySelector("[data-clear]")?.addEventListener("click", () => {
    search.value = "";
    openAccess.checked = false;
    Object.keys(selected).forEach((k) => delete selected[k]);
    selects.forEach((s) => (s.value = ""));
    update();
  });

  if (window.matchMedia("(max-width: 767px)").matches) filters.open = false;
  controls.hidden = false;

  const target = location.hash.slice(1);
  const targetRow = target && rows.find((r) => r.id === target);
  if (targetRow) {
    const index = rows.filter(matches).sort(comparators.newest).indexOf(targetRow);
    page = Math.floor(index / pageSize) + 1;
  }
  render();
}

initPublicationFilters();
initOthersList();
