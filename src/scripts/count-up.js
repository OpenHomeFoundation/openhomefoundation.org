// Animates each stat card's number counting up from 0 once it scrolls into
// view. Skipped entirely under prefers-reduced-motion — the numbers already
// show their final value in the static markup, so there's nothing to do.

const numberEls = document.querySelectorAll(".card-grid__compact .number");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (numberEls.length > 0 && !prefersReducedMotion) {
  const DURATION = 2200; // ms

  function animateCount(el) {
    // e.g. "1,600+" -> target 1600, suffix "+" — kept so the animated value
    // matches the original formatting (thousands separator, "+") exactly
    // once it finishes.
    const match = el.textContent.trim().match(/^([\d,]+)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1].replace(/,/g, ""), 10);
    const suffix = match[2];
    if (Number.isNaN(target)) return;

    // Lock in the final rendered width before animating — counting up from
    // "0" to the full value changes the character count, which would
    // otherwise reflow surrounding content (e.g. the avatar stack next to
    // the horizontal card's number).
    el.style.width = `${el.getBoundingClientRect().width}px`;

    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / DURATION, 1);
      const value = Math.round(progress * target);
      el.textContent = value.toLocaleString("en-US") + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.65 },
  );

  numberEls.forEach((el) => observer.observe(el));
}
