// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

const scssMixinsPath = fileURLToPath(
  new URL("./src/styles/scss/mixins.scss", import.meta.url),
);

// Blog frontmatter for the sitemap: post dates become <lastmod>, and
// crossposts (which canonicalise to another site) are left out.
const blogDir = new URL("./src/content/blog/", import.meta.url);
const blogPosts = readdirSync(blogDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const frontmatter = readFileSync(new URL(file, blogDir), "utf8").split(/^---$/m)[1] ?? "";
    return {
      path: `/blog/${file.replace(/\.md$/, "")}/`,
      date: frontmatter.match(/^date:\s*(\S+)/m)?.[1],
      crosspost: /^external_url:/m.test(frontmatter),
    };
  });
const crosspostPaths = new Set(blogPosts.filter((p) => p.crosspost).map((p) => p.path));
const postDates = new Map(blogPosts.filter((p) => !p.crosspost && p.date).map((p) => [p.path, p.date]));
const latestPostDate = [...postDates.values()].sort().at(-1);

export default defineConfig({
  site: "https://www.openhomefoundation.org",
  // The site is fully prerendered except the routes that opt out with
  // `export const prerender = false` (the asset-generator image endpoint),
  // which the adapter runs as a Netlify function.
  adapter: netlify({
    // satori shapes text with harfbuzzjs, which reads its wasm from disk at
    // runtime; the function bundler's trace only picks up the .js, so ship
    // the wasm explicitly or every render crashes with ENOENT hb.wasm.
    includeFiles: ["node_modules/harfbuzzjs/hb.wasm"],
  }),
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
        if (crosspostPaths.has(path)) return false;
        return true;
      },
      serialize: (item) => {
        const path = new URL(item.url).pathname;
        const lastmod = path === "/blog/" ? latestPostDate : postDates.get(path);
        return lastmod ? { ...item, lastmod: new Date(lastmod).toISOString() } : item;
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
