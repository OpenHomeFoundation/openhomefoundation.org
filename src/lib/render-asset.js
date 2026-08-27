// Server-side renderer for the Community Day social assets: turns a template
// from asset-templates.js plus the request parameters into a PNG, entirely on
// the server (satori lays the frame out into SVG, resvg rasterizes it at 2x).
// Runs as a Netlify function via the Astro endpoint
// src/pages/community-day/asset-generator/image.png.ts.
//
// The backdrop art and the Figtree fonts are bundled into the function as
// data URIs (Vite `?inline`), so a render only ever fetches the project logo
// from the branding API — and those responses are cached in memory.

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { DATE_PARTS, parseIsoDate } from "./asset-templates.js";

import gradientUri from "../assets/asset-generator/gradient.png?inline";
import illustrationUri from "../assets/asset-generator/illustration.svg?inline";
import figtree400Uri from "../assets/asset-generator/fonts/figtree-400.ttf?inline";
import figtree700Uri from "../assets/asset-generator/fonts/figtree-700.ttf?inline";

const PIXEL_RATIO = 2; // export at 2x → e.g. 2160×2160 for a 1080 frame

const ASSETS = { gradient: gradientUri, illustration: illustrationUri };

const dataUriToBuffer = (uri) =>
  Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64");
const FONTS = [
  {
    name: "Figtree",
    weight: 400,
    style: "normal",
    data: dataUriToBuffer(figtree400Uri),
  },
  {
    name: "Figtree",
    weight: 700,
    style: "normal",
    data: dataUriToBuffer(figtree700Uri),
  },
];

// --- project logos, from the branding API ---

const logoUrl = (project) =>
  `https://brands.openhomefoundation.org/api/${project}/logo/screen/lockup/main/color/light/svg`;

// project → {uri, aspect}; refreshed after TTL so brand updates propagate
// without a redeploy.
const logoCache = new Map();
const LOGO_TTL_MS = 60 * 60 * 1000;

async function fetchLogo(project) {
  const cached = logoCache.get(project);
  if (cached && Date.now() - cached.at < LOGO_TTL_MS) return cached;

  const res = await fetch(logoUrl(project));
  if (!res.ok) {
    // A stale logo beats a failed render.
    if (cached) return cached;
    throw new Error(`Branding API returned ${res.status} for ${project}`);
  }
  const svg = await res.text();
  const width = Number(/<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1]);
  const height = Number(/<svg[^>]*\sheight="([\d.]+)"/.exec(svg)?.[1]);
  if (!width || !height)
    throw new Error(`Could not read dimensions of the ${project} logo`);

  const entry = {
    uri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    aspect: width / height,
    at: Date.now(),
  };
  logoCache.set(project, entry);
  return entry;
}

// --- satori element tree ---

// Satori throws on style keys whose value is undefined, so drop them from
// every style object before handing the tree over.
const compact = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const el = (type, { style, ...props }, children) => ({
  type,
  props: { ...props, ...(style ? { style: compact(style) } : {}), children },
});

// Figma's TITLE case styling (CSS text-transform: capitalize).
const capitalize = (s) =>
  s.replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());

function textStyle(font, color) {
  return {
    fontWeight: font.weight,
    fontSize: font.size,
    lineHeight: font.lineHeight != null ? `${font.lineHeight}px` : undefined,
    letterSpacing:
      font.letterSpacing != null ? `${font.letterSpacing}px` : undefined,
    color,
  };
}

/**
 * Render one template to a PNG.
 *
 * @param {object} tpl     entry from TEMPLATES
 * @param {object} opts    validated request values
 * @param {number} opts.height     output height (from tpl.sizes)
 * @param {string} opts.project    branding-API project slug for the logo
 * @param {Date}   opts.date       event date
 * @param {object} opts.fields     {city, organizer}
 * @param {boolean} opts.byline    show the "organized by" line
 * @returns {Promise<Buffer>} PNG bytes, tpl.width*2 wide
 */
export async function renderAsset(
  tpl,
  { height, project, date, fields, byline },
) {
  const logo = await fetchLogo(project);
  const delta = height - tpl.height;

  const resolveText = (seg) =>
    seg.text ??
    (seg.datePart ? DATE_PARTS[seg.datePart](date) : (fields[seg.field] ?? ""));

  const children = [];
  for (const layer of tpl.layers) {
    if (layer.optional && !byline) continue;
    // Content layers are bottom-anchored; when the optional by-line is off,
    // the layers above it slide down to stay anchored.
    let shift = layer.backdrop ? 0 : delta;
    if (layer.shiftOnCollapse && !byline) shift += collapseShiftOf(tpl);

    if (layer.kind === "image") {
      let { x, y, w, h } = layer;
      if (layer.logo) w = h * logo.aspect;
      if (layer.scaleWithSize) {
        // Scale proportionally about the frame's top-centre, like the Figma
        // frame does when it grows (transform-origin at 540,0 frame-relative).
        const s = height / tpl.height;
        const ox = tpl.width / 2 - x;
        const oy = 0 - y;
        x += ox * (1 - s);
        y += oy * (1 - s);
        w *= s;
        h *= s;
      } else if (layer.cover) {
        h = height; // gradient fills the frame; object-fit keeps proportions
      }
      children.push(
        el("img", {
          src: layer.logo ? logo.uri : ASSETS[layer.asset],
          width: w,
          height: h,
          style: {
            position: "absolute",
            left: x,
            top: y + shift,
            ...(layer.cover ? { objectFit: "cover" } : {}),
          },
        }),
      );
      continue;
    }

    if (layer.kind === "text") {
      const text = layer.titleCase ? capitalize(layer.text) : layer.text;
      children.push(
        el(
          "div",
          {
            style: {
              position: "absolute",
              left: layer.x,
              top: layer.y + shift,
              width: layer.w,
              ...textStyle(layer.font, layer.color),
            },
          },
          text,
        ),
      );
      continue;
    }

    if (layer.kind === "row") {
      const segs = layer.children.map((seg) => {
        const raw = resolveText(seg);
        const text = layer.titleCase ? capitalize(raw) : raw;
        return el(
          "span",
          {
            style: {
              whiteSpace: "pre", // keep single-line, preserve deliberate spaces
              ...textStyle({ ...layer.font, ...seg.font }, layer.color),
            },
          },
          text,
        );
      });
      children.push(
        el(
          "div",
          {
            style: {
              position: "absolute",
              left: layer.x,
              top: layer.y + shift,
              display: "flex",
              alignItems: "center",
              gap: layer.gap ?? 0,
              padding: layer.padding,
              borderRadius: layer.radius,
              backgroundColor: layer.background,
            },
          },
          segs,
        ),
      );
    }
  }

  const svg = await satori(
    el(
      "div",
      {
        style: {
          width: tpl.width,
          height,
          display: "flex",
          position: "relative",
          fontFamily: "Figtree",
        },
      },
      children,
    ),
    { width: tpl.width, height, fonts: FONTS },
  );

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: tpl.width * PIXEL_RATIO },
  })
    .render()
    .asPng();
  return Buffer.from(png);
}

function collapseShiftOf(tpl) {
  return tpl.layers.find((l) => l.optional)?.collapseShift ?? 0;
}

/**
 * Validate/normalize the endpoint's query params against a template.
 * Returns {error} for values that don't name a real option, otherwise the
 * options object for renderAsset plus the pieces the endpoint needs.
 */
export function parseParams(tpl, params) {
  const size = tpl.sizes.find(
    (s) => s.value === (params.get("size") ?? tpl.defaultSize),
  );
  if (!size) return { error: "unknown size" };

  const logo = tpl.logos.find(
    (l) => l.value === (params.get("logo") ?? tpl.defaultLogo),
  );
  if (!logo) return { error: "unknown logo" };

  const date = parseIsoDate(params.get("date") ?? tpl.datePicker.default);
  if (!date) return { error: "date must be YYYY-MM-DD" };

  const fields = {};
  for (const f of tpl.fields) {
    // Free-text goes straight into satori as text nodes (never markup), so
    // length is the only constraint that matters.
    fields[f.name] = (params.get(f.name) ?? f.default).slice(0, f.maxLength);
  }

  const byline =
    (params.get("byline") ?? (tpl.byline.default ? "1" : "0")) !== "0";

  return {
    size,
    render: {
      height: size.height,
      project: logo.project,
      date,
      fields,
      byline,
    },
  };
}
