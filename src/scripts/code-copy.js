if (navigator.clipboard?.writeText) {
    document.querySelectorAll("#post .content pre").forEach((pre) => {
        const code = pre.querySelector("code") || pre;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy";
        button.setAttribute("aria-label", "Copy code to clipboard");

        const icon = document.createElement("span");
        icon.className = "code-copy__icon";
        icon.setAttribute("aria-hidden", "true");

        button.append(icon);
        pre.append(button);

        let resetTimer;

        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ""));
                button.classList.add("is-copied");
                button.setAttribute("aria-label", "Copied to clipboard");

                clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    button.classList.remove("is-copied");
                    button.setAttribute("aria-label", "Copy code to clipboard");
                }, 2000);
            } catch {
                /* clipboard unavailable */
            }
        });
    });
}
