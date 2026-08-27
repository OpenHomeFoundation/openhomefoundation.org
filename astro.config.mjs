// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

const scssMixinsPath = fileURLToPath(
  new URL("./src/styles/scss/mixins.scss", import.meta.url),
);

export default defineConfig({
  site: "https://www.openhomefoundation.org",
  server: {
    // Astro's dev server only binds to localhost by default. In a
    // devcontainer/Codespace, forwarded ports can't reach a
    // localhost-only listener, so bind to all interfaces.
    host: true,
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        // Media room sub-pages are press resources and carry noindex, as does
        // the device database data use statement. Keep them out of the sitemap.
        if (path.startsWith("/media-room/") && path !== "/media-room/")
          return false;
        if (path === "/device-database-data-use-statement/") return false;
        // Test bed for the Community Day asset generator; noindex until it
        // moves onto /community-day/ itself.
        if (path === "/community-day/asset-generator/") return false;
        return true;
      },
    }),
  ],
  markdown: {
    // Blog posts are written with their typography (curly quotes, dashes)
    // already in place, and code blocks are styled by our own CSS.
    processor: satteri({ features: { smartPunctuation: false } }),
    syntaxHighlight: false,
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Available in every Astro component's <style lang="scss">
          // block without an explicit @use.
          additionalData: `@use "${scssMixinsPath}" as *;`,
        },
      },
    },
    plugins: [yaml()],
    build: {
      // Browser floor for CSS: keeps/adds vendor prefixes (e.g.
      // -webkit-backdrop-filter, -webkit-mask) for the Safari versions we
      // still support, instead of the esnext default that strips them.
      cssTarget: ["chrome111", "edge111", "firefox114", "safari15", "ios15"],
    },
  },
});
