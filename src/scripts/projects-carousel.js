// Pagination dots for the collabs carousel. The carousel itself is plain CSS
// (an overflow-x scroll container with scroll snapping); this only builds the
// dots, keeps the active one in sync, and scrolls on click.
const track = document.querySelector(".collab-track");
const pagination = document.querySelector(".collab-pagination");

if (track && pagination) {
  const slides = Array.from(track.children);

  const dots = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => {
      track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    });
    pagination.append(dot);
    return dot;
  });

  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    // All slides fit: nothing to paginate.
    pagination.hidden = maxScroll < 1;
    if (pagination.hidden) return;

    let active = slides.length - 1;
    if (track.scrollLeft < maxScroll - 1) {
      const distances = slides.map((slide) => Math.abs(slide.offsetLeft - track.scrollLeft));
      active = distances.indexOf(Math.min(...distances));
    }
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === active);
      if (index === active) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  };

  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}
