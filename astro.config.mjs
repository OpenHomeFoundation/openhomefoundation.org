// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  site: "https://www.openhomefoundation.org",
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        // Media room sub-pages are press resources and carry noindex, as does
        // the device database data use statement. Keep them out of the sitemap.
        if (path.startsWith("/media-room/") && path !== "/media-room/") return false;
        if (path === "/device-database-data-use-statement/") return false;
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
    plugins: [yaml()],
    build: {
      // Browser floor for CSS: keeps/adds vendor prefixes (e.g.
      // -webkit-backdrop-filter, -webkit-mask) for the Safari versions we
      // still support, instead of the esnext default that strips them.
      cssTarget: ["chrome111", "edge111", "firefox114", "safari15", "ios15"],
    },
  },
});
