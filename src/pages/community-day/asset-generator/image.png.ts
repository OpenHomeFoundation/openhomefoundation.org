// On-demand endpoint that renders a Community Day social asset as a PNG.
// The asset-generator form drives this URL directly (its preview <img> points
// here); `download=1` additionally serves it as a file download.
//
// Query params (all optional, validated against the template config):
//   size=square|portrait   logo=ha|esphome|ma   date=YYYY-MM-DD
//   city=…  organizer=…    byline=1|0           download=1
import type { APIRoute } from "astro";
import { TEMPLATES } from "../../../lib/asset-templates.js";
import { parseParams, renderAsset } from "../../../lib/render-asset.js";

// Rendered per-request on the server (requires the Netlify adapter); the rest
// of the site stays fully prerendered.
export const prerender = false;

const tpl = TEMPLATES[0];

export const GET: APIRoute = async ({ url }) => {
  const parsed = parseParams(tpl, url.searchParams);
  if (parsed.error) {
    return new Response(`Bad request: ${parsed.error}\n`, { status: 400 });
  }

  let png: Buffer;
  try {
    png = await renderAsset(tpl, parsed.render);
  } catch (err) {
    console.error("asset render failed:", err);
    return new Response("Rendering failed, please try again.\n", {
      status: 502,
    });
  }

  const headers = new Headers({
    "Content-Type": "image/png",
    // The URL fully determines the image, so shared caches may keep it a bit;
    // logos refresh within an hour of a branding change either way.
    "Cache-Control": "public, max-age=3600",
  });
  if (url.searchParams.get("download") === "1") {
    const slug =
      parsed.render.fields.city
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || tpl.id;
    headers.set(
      "Content-Disposition",
      `attachment; filename="${tpl.id}_${tpl.width}x${parsed.size.height}_${slug}.png"`,
    );
  }
  return new Response(png, { headers });
};
