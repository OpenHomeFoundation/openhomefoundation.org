// Generic <dialog> open/close wiring for the asset generator modal. The
// generator itself (AssetGenerator.astro) is fully self-contained — its own
// <script> drives the form/preview — so this only needs to handle showing
// and hiding the dialog and locking background scroll while it's open.

const dialog = document.querySelector("[data-asset-generator-dialog]");
const openBtn = document.querySelector("[data-asset-generator-open]");
const closeBtn = document.querySelector("[data-asset-generator-close]");

if (dialog && openBtn) {
  function openDialog() {
    dialog.showModal();
    document.documentElement.classList.add("has-open-dialog");
  }

  openBtn.addEventListener("click", openDialog);

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

  // Deep link: /community-day/#asset-generator opens it directly on load.
  // hashchange also covers an in-page link to the same hash without a full
  // page reload (location.hash doesn't change on a no-op click to the same
  // hash you're already on, but it does when navigating from elsewhere).
  function openIfLinked() {
    if (dialog.id && location.hash === `#${dialog.id}` && !dialog.open) {
      openDialog();
    }
  }

  openIfLinked();
  window.addEventListener("hashchange", openIfLinked);
}
