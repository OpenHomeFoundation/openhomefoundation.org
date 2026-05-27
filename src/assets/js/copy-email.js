if (navigator.clipboard?.writeText) {
  document.querySelectorAll(".copy-email").forEach((el) => {
    const email = el.dataset.email;
    if (!email) return;

    const tooltip = document.createElement("span");
    tooltip.className = "copy-email__tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.textContent = "Email copied";

    const status = document.createElement("span");
    status.className = "copy-email__sr-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    el.append(tooltip, status);

    let resetTimer;

    el.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        await navigator.clipboard.writeText(email);
        el.classList.add("is-copied");
        status.textContent = `Copied ${email} to clipboard`;

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          el.classList.remove("is-copied");
          status.textContent = "";
        }, 2000);
      } catch {
        window.prompt("Copy this email address:", email);
      }
    });
  });
}
