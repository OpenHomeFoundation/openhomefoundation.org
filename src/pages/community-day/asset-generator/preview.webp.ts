// Build-time render of the asset generator's default state, served as a
// static file so the preview shows instantly without the live endpoint
// (image.png.ts) or a multi-megabyte data: URI in the page's HTML.
import type { APIRoute } from "astro";
import sharp from "sharp";
import { TEMPLATES } from "../../../lib/asset-templates.js";
import { parseParams, renderAsset } from "../../../lib/render-asset.js";

// The preview displays at up to 540 CSS px, so 1080 covers 2x screens.
const PREVIEW_WIDTH = 1080;

const tpl = TEMPLATES[0];

export const GET: APIRoute = async () => {
  const parsed = parseParams(tpl, new URLSearchParams());
  if (parsed.error) throw new Error(`Default asset-generator params invalid: ${parsed.error}`);

  const png = await renderAsset(tpl, parsed.render);
  const webp = await sharp(png).resize({ width: PREVIEW_WIDTH }).webp({ quality: 80 }).toBuffer();

  return new Response(new Uint8Array(webp), { headers: { "Content-Type": "image/webp" } });
};
