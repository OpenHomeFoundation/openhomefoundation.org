const dialog = document.getElementById("cite-dialog");

if (dialog) {
  document.querySelectorAll("[data-open-cite]").forEach((button) =>
    button.addEventListener("click", () => dialog.showModal()),
  );
  dialog.querySelector("[data-close-cite]")?.addEventListener("click", () => dialog.close());

  if (!("closedBy" in HTMLDialogElement.prototype)) {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) dialog.close();
    });
  }
}
