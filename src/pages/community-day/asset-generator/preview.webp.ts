// Build-time render of the asset generator's default state, served as a
// static file so the preview shows instantly without the live endpoint
// (image.png.ts) or a multi-megabyte data: URI in the page's HTML.
import type { APIRoute } from "astro";
import sharpService from "astro/assets/services/sharp";
import { TEMPLATES } from "../../../lib/asset-templates.js";
import { parseParams, renderAsset } from "../../../lib/render-asset.js";

// The preview displays at up to 540 CSS px, so 1080 covers 2x screens.
const PREVIEW_WIDTH = 1080;

const tpl = TEMPLATES[0];

export const GET: APIRoute = async () => {
  const parsed = parseParams(tpl, new URLSearchParams());
  if (parsed.error) throw new Error(`Default asset-generator params invalid: ${parsed.error}`);

  const png = await renderAsset(tpl, parsed.render);
  // Astro's own sharp image service, so we don't depend on sharp directly.
  // Called as-is because the Netlify adapter swaps the configured service
  // (astro:assets) for its image CDN, which can't transform at build time.
  const { data, format } = await sharpService.transform(
    png,
    { src: "preview.webp", width: PREVIEW_WIDTH, format: "webp", quality: 80 },
    { service: { entrypoint: "astro/assets/services/sharp", config: {} } } as Parameters<
      typeof sharpService.transform
    >[2],
  );
  if (format !== "webp") throw new Error(`Asset-generator preview came out as ${format}, not webp`);

  return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/webp" } });
};
