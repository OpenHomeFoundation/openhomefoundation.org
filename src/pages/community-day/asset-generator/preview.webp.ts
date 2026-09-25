// Build-time render of the asset generator's default preview. The live
// image.png endpoint stays untouched for edits and downloads; this exists so
// the initial preview on /community-day/ is a small static file instead of a
// per-visitor function render (or, worse, an image inlined into the HTML).
//
// The default asset never varies between visitors, so it's rendered once here
// during `astro build`, downscaled to 1080px wide (the preview displays at
// max 540 CSS px — see AssetGenerator.astro — so 1080 is exactly 2x retina)
// and compressed to webp: ~70KB versus the 8.4MB full-resolution PNG.
import type { APIRoute } from "astro";
import sharp from "sharp";
import { TEMPLATES } from "../../../lib/asset-templates.js";
import { parseParams, renderAsset } from "../../../lib/render-asset.js";

export const prerender = true;

const PREVIEW_WIDTH = 1080;
const WEBP_QUALITY = 82;

export const GET: APIRoute = async () => {
  const tpl = TEMPLATES[0];
  const parsed = parseParams(tpl, new URLSearchParams());
  if (parsed.error) {
    // Only reachable if the template's own defaults are invalid.
    throw new Error(`default asset params invalid: ${parsed.error}`);
  }

  const png = await renderAsset(tpl, parsed.render);
  const webp = await sharp(png)
    .resize(PREVIEW_WIDTH)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return new Response(new Uint8Array(webp), {
    headers: { "Content-Type": "image/webp" },
  });
};
