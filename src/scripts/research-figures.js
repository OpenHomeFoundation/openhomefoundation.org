const COUNTERS = ".glance-value, .figure-number-value, .figure-stats-value, .figure-bar-value";
const NUMBER = /^([~≈<>]?)(\d[\d,]*(?:\.\d+)?)([%+]?)$/;
const DURATION = 1000;

const parse = (el) => {
  const match = el.textContent.trim().match(NUMBER);
  if (!match) return undefined;
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    suffix,
    target: Number(digits.replaceAll(",", "")),
    decimals: digits.split(".")[1]?.length ?? 0,
    grouped: digits.includes(","),
    final: el.textContent,
  };
};

const format = (n, { prefix, suffix, decimals, grouped }) =>
  prefix +
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  }) +
  suffix;

const countUp = (el, spec) => {
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / DURATION);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = t < 1 ? format(spec.target * eased, spec) : spec.final;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const figures = document.querySelectorAll(".glance, .figure, .figure-stats");

if (!reduced && "IntersectionObserver" in window && figures.length) {
  const counters = new Map();
  figures.forEach((figure) => {
    figure.classList.add("will-animate");
    figure.querySelectorAll(COUNTERS).forEach((el) => {
      const spec = parse(el);
      if (!spec) return;
      counters.set(el, spec);
      el.textContent = format(0, spec);
    });
  });

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        target.classList.add("animated");
        target.querySelectorAll(COUNTERS).forEach((el) => counters.has(el) && countUp(el, counters.get(el)));
      }),
    { threshold: 0.35 },
  );
  figures.forEach((figure) => observer.observe(figure));
}
