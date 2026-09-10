// Fades/slides elements in as they scroll into view. Add the class
// "animate--fade-up-in" to anything that should get this treatment — no
// other markup or setup needed.
//
// No-JS fallback: the CSS only hides an element once this script adds
// "will-animate" to it, so without JS (or under prefers-reduced-motion,
// which skips that step below) elements just render normally, visible from
// the start.
const targets = document.querySelectorAll(".animate--fade-up-in");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (targets.length > 0 && !prefersReducedMotion) {
  targets.forEach((el) => el.classList.add("will-animate"));

  const options = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    },
    options,
  );

  targets.forEach((el) => observer.observe(el));
}
