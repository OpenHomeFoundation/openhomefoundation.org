// Projects marquee: a plain scroll container that auto-scrolls while idle.
// Touch and wheel scrolling are native; mouse users can drag. Any interaction
// pauses the auto-scroll, which resumes shortly after the user lets go.
const marquee = document.querySelector("#work .projects");
const group = marquee?.querySelector(".marquee-group");

if (marquee && group) {
  const SPEED = 15; // px per second, matching the previous pace
  const RESUME_DELAY = 2000; // ms after the last interaction

  // Clone the group until the content can wrap seamlessly on any screen:
  // one full copy must fit beyond the visible area on both sides.
  while (marquee.scrollWidth < group.offsetWidth + 2 * marquee.clientWidth) {
    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    for (const link of clone.querySelectorAll("a")) link.tabIndex = -1;
    group.parentElement.append(clone);
  }

  // Keep the scroll position inside the second copy; the copies are
  // identical, so the jump is invisible. This leaves room to drag or scroll
  // in both directions without ever hitting the container's edges.
  const wrap = () => {
    const copy = group.offsetWidth;
    if (marquee.scrollLeft < copy) marquee.scrollLeft += copy;
    else if (marquee.scrollLeft >= 2 * copy) marquee.scrollLeft -= copy;
  };
  marquee.addEventListener("scroll", wrap, { passive: true });
  wrap();

  let resumeAt = 0;
  let hovering = false;
  let dragging = false;
  const touch = () => {
    resumeAt = performance.now() + RESUME_DELAY;
  };
  marquee.addEventListener("wheel", touch, { passive: true });
  marquee.addEventListener("touchmove", touch, { passive: true });
  marquee.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") hovering = true;
  });
  marquee.addEventListener("pointerleave", () => (hovering = false));

  // Mouse drag. Touch devices scroll natively, so only handle mice.
  // Links would otherwise start a native drag-and-drop, cancelling ours.
  marquee.addEventListener("dragstart", (e) => e.preventDefault());
  let dragStartX = 0;
  let dragged = 0;
  marquee.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    dragging = true;
    dragStartX = e.clientX;
    dragged = 0;
    marquee.setPointerCapture(e.pointerId);
    marquee.classList.add("is-dragging");
  });
  marquee.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    marquee.scrollLeft -= e.clientX - dragStartX;
    dragged += Math.abs(e.clientX - dragStartX);
    dragStartX = e.clientX;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove("is-dragging");
    touch();
  };
  marquee.addEventListener("pointerup", endDrag);
  marquee.addEventListener("pointercancel", endDrag);
  // A drag that moved should not count as a click on a project link.
  marquee.addEventListener(
    "click",
    (e) => {
      if (dragged > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true },
  );

  // scrollLeft rounds to whole pixels in some browsers, so accumulate
  // fractional movement in a carry.
  let carry = 0;
  let lastTime;
  const step = (time) => {
    if (lastTime !== undefined && !dragging && !hovering && time > resumeAt) {
      carry += (SPEED * (time - lastTime)) / 1000;
      const whole = Math.floor(carry);
      if (whole > 0) {
        marquee.scrollLeft += whole;
        carry -= whole;
      }
    }
    lastTime = time;
    requestAnimationFrame(step);
  };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    requestAnimationFrame(step);
  }
}
