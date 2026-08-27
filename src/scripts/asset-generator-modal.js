// Generic <dialog> open/close wiring for the asset generator modal. The
// generator itself (AssetGenerator.astro) is fully self-contained — its own
// <script> drives the form/preview — so this only needs to handle showing
// and hiding the dialog and locking background scroll while it's open.

const dialog = document.querySelector("[data-asset-generator-dialog]");
const openBtn = document.querySelector("[data-asset-generator-open]");
const closeBtn = document.querySelector("[data-asset-generator-close]");

if (dialog && openBtn) {
  openBtn.addEventListener("click", () => {
    dialog.showModal();
    document.documentElement.classList.add("has-open-dialog");
  });

  closeBtn?.addEventListener("click", () => dialog.close());

  // A click that lands on the <dialog> element itself (not one of its
  // children) is a click on the ::backdrop — the standard way to detect
  // "outside" clicks on a native <dialog>.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Fires however the dialog closes (button, backdrop click, Esc), so the
  // scroll lock always gets released.
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-open-dialog");
  });
}
