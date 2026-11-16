const header = document.querySelector(".navbar-container");
const subnav = document.querySelector(".research-subnav");
const toc = document.querySelector("[data-toc]");
const bar = document.querySelector("[data-toc-bar]");

const links = [subnav, toc, bar].filter(Boolean).flatMap((el) => [...el.querySelectorAll('a[href^="#"]')]);
const targets = [...new Set(links.map((a) => a.getAttribute("href")))]
  .map((href) => ({ href, el: document.getElementById(href.slice(1)) }))
  .filter((t) => t.el);

const headerBottom = () => header?.getBoundingClientRect().bottom ?? 0;

const toggle = bar?.querySelector(".toc-bar-toggle");
const barList = bar?.querySelector(".toc-bar-list");
const barCurrent = bar?.querySelector("[data-toc-current]");
const mobile = window.matchMedia("(max-width: 991px)");

const setOpen = (open) => {
  if (!toggle) return;
  toggle.setAttribute("aria-expanded", String(open));
  barList.hidden = !open;
};

const update = () => {
  const stuckBar = bar?.classList.contains("visible") ? bar.offsetHeight : 0;
  const line = headerBottom() + (subnav?.offsetHeight ?? 0) + stuckBar + 96;

  let current;
  let currentTop = -Infinity;
  for (const t of targets) {
    const top = t.el.getBoundingClientRect().top;
    if (top <= line && top > currentTop) {
      current = t;
      currentTop = top;
    }
  }

  links.forEach((a) => {
    const active = current && a.getAttribute("href") === current.href;
    if (active && !a.hasAttribute("aria-current") && subnav?.contains(a)) {
      const list = a.closest("ul");
      list.scrollTo({ left: a.offsetLeft - list.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
    }
    if (active) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });

  if (bar) {
    const show = mobile.matches && toc.getBoundingClientRect().bottom < headerBottom();
    bar.classList.toggle("visible", show);
    if (!show) setOpen(false);
    const label = [...barList.querySelectorAll("a")].find(
      (a) => a.getAttribute("href") === (current ?? targets[0])?.href,
    );
    if (label) barCurrent.textContent = label.textContent;
  }
};

if (bar) {
  bar.hidden = false;
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  barList.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
}

let frame;
const schedule = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(update);
};
window.addEventListener("scroll", schedule, { passive: true });
window.addEventListener("resize", schedule);
update();
