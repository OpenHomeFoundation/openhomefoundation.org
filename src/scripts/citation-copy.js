document.querySelectorAll("[data-citation]").forEach((card) => {
  const toggle = card.querySelector(".citation-toggle");
  const buttons = toggle.querySelectorAll("button");
  const blocks = card.querySelectorAll("pre[data-format]");
  const labels = card.querySelectorAll("[data-label]");
  const copy = card.querySelector(".citation-copy");
  const status = card.querySelector("[data-copy-status]");
  let current = "apa";

  const show = (format) => {
    current = format;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.format === format)));
    blocks.forEach((pre) => (pre.hidden = pre.dataset.format !== format));
  };

  toggle.hidden = false;
  labels.forEach((label) => (label.hidden = true));
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.format)));
  show("apa");

  if (!navigator.clipboard?.writeText) return;
  copy.hidden = false;
  let resetTimer;
  copy.addEventListener("click", async () => {
    const text = card.querySelector(`pre[data-format="${current}"]`).textContent;
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = "Copied";
      status.textContent = "Citation copied to clipboard";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copy.textContent = "Copy citation";
        status.textContent = "";
      }, 2000);
    } catch {
      /* clipboard unavailable */
    }
  });
});
