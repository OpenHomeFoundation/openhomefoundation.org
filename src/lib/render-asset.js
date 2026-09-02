// Server-side renderer for the Community Day social assets: turns a template
// from asset-templates.js plus the request parameters into a PNG, entirely on
// the server (satori lays the frame out into SVG, resvg rasterizes it at 2x).
// Runs as a Netlify function via the Astro endpoint
// src/pages/community-day/asset-generator/image.png.ts.
//
// Every asset (backdrop, logomarks, OHF lockup, Figtree) is bundled into the
// function as a data URI (Vite `?inline`), so a render makes no network
// requests at all.

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { create as createFont } from "fontkitten";

import backdropUri from "../assets/asset-generator/backdrop.jpg?inline";
import backdropSquareUri from "../assets/asset-generator/backdrop-square.jpg?inline";
import logoHaUri from "../assets/asset-generator/logo-ha.svg?inline";
import logoEsphomeUri from "../assets/asset-generator/logo-esphome.svg?inline";
import logoMaUri from "../assets/asset-generator/logo-ma.svg?inline";
import ohfLockupUri from "../assets/asset-generator/ohf-lockup.svg?inline";
import figtree400Uri from "../assets/asset-generator/fonts/figtree-400.ttf?inline";
import figtree700Uri from "../assets/asset-generator/fonts/figtree-700.ttf?inline";

const PIXEL_RATIO = 2; // export at 2x → e.g. 2160×2160 for a 1080-wide frame

const ASSETS = {
  backdrop: backdropUri,
  backdropSquare: backdropSquareUri,
  logoHa: logoHaUri,
  logoEsphome: logoEsphomeUri,
  logoMa: logoMaUri,
  ohfLockup: ohfLockupUri,
};

const dataUriToBuffer = (uri) => Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64");

const figtree400Buf = dataUriToBuffer(figtree400Uri);
const figtree700Buf = dataUriToBuffer(figtree700Uri);

const FONTS = [
  { name: "Figtree", weight: 400, style: "normal", data: figtree400Buf },
  { name: "Figtree", weight: 700, style: "normal", data: figtree700Buf },
];

// Parsed once for text-wrapping estimates (see computeFitScale below) — a
// separate, much lighter concern from the FONTS array above, which hands the
// raw bytes to satori for actual glyph rendering.
const FONT_METRICS = {
  400: createFont(figtree400Buf),
  700: createFont(figtree700Buf),
};

// --- satori element tree ---

// Satori throws on style keys whose value is undefined, so drop them from
// every style object before handing the tree over.
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const el = (type, { style, ...props }, children) => ({
  type,
  props: { ...props, ...(style ? { style: compact(style) } : {}), children },
});

// Figma's TITLE case styling (CSS text-transform: capitalize).
const capitalize = (s) => s.replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());

function textStyle(font, color) {
  return {
    fontWeight: font.weight,
    fontSize: font.size,
    lineHeight: font.lineHeight != null ? `${font.lineHeight}px` : undefined,
    letterSpacing: font.letterSpacing != null ? `${font.letterSpacing}px` : undefined,
    color,
  };
}

// --- text-wrap estimation, for the location/city "fit" shrink budget ---
//
// Satori does its own real wrapping at render time; this only has to predict
// it accurately enough to pick a font-size scale, so a plain greedy wrap over
// per-glyph advance widths (no kerning/shaping) is close enough — the design
// itself isn't pixel-precise to the Figma source either (see the Figtree/
// Biotif substitution note in asset-templates.js).
function measureText(weight, text, fontSize, letterSpacing) {
  const font = FONT_METRICS[weight] ?? FONT_METRICS[400];
  const glyphs = font.glyphsForString(text);
  const scale = fontSize / font.unitsPerEm;
  const advance = glyphs.reduce((sum, g) => sum + g.advanceWidth * scale, 0);
  const spacing = letterSpacing ? letterSpacing * Math.max(0, glyphs.length - 1) : 0;
  return advance + spacing;
}

function countWrappedLines(weight, text, fontSize, letterSpacing, maxWidth) {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return 1;
  const spaceWidth = measureText(weight, " ", fontSize, letterSpacing);
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = measureText(weight, word, fontSize, letterSpacing);
    const next = lineWidth === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
    if (next > maxWidth && lineWidth > 0) {
      lines += 1;
      lineWidth = wordWidth;
    } else {
      lineWidth = next;
    }
  }
  return lines;
}

// Shrink a `fit` stack's row children together — font size, line height and
// letter spacing in step — until their combined wrapped line count lands
// inside the budget, mirroring the reference template's applyFits().
function computeFitScale(fit, rows) {
  let scale = 1;
  const totalLines = () =>
    rows.reduce(
      (sum, r) => sum + countWrappedLines(r.weight, r.text, r.font.size * scale, r.font.letterSpacing * scale, r.width),
      0,
    );
  while (totalLines() > fit.maxLines && scale > fit.minScale) {
    scale = Math.max(fit.minScale, scale - 0.02);
  }
  return scale;
}

// --- per-size layer overrides ---

// Deep-ish merge of a layer with a size override: `font` merges key-by-key
// and `children` merge element-wise, everything else is replaced.
function mergeLayer(layer, patch) {
  if (!patch) return layer;
  const out = { ...layer, ...patch };
  if (layer.font || patch.font) out.font = { ...layer.font, ...patch.font };
  if (layer.children) {
    out.children = layer.children.map((c, i) => mergeLayer(c, patch.children && patch.children[i]));
  }
  return out;
}

function mergeLayers(layers, overrides = {}) {
  return layers.map((l) => mergeLayer(l, l.id && overrides[l.id]));
}

/**
 * Render one template to a PNG.
 *
 * @param {object} tpl    entry from TEMPLATES
 * @param {object} opts   validated request values
 * @param {object} opts.size    entry from tpl.sizes (carries height + any layer overrides)
 * @param {object} opts.fields  {location, city, organizer}
 * @returns {Promise<Buffer>} PNG bytes, tpl.width*2 wide
 */
export async function renderAsset(tpl, { size, fields }) {
  const height = size.height;
  const resolveText = (seg) => seg.text ?? fields[seg.field] ?? "";
  const rowText = (row) => row.children.map((child) => resolveText(child)).join("");

  const positionStyle = (layer, flow) => {
    if (flow) return {};
    const style = { position: "absolute", left: layer.x };
    if (layer.bottom != null) style.bottom = layer.bottom;
    else style.top = layer.y;
    return style;
  };

  function buildImage(layer, flow) {
    let { w, h } = layer;
    if (layer.backdrop && layer.cover) h = height; // cover backdrop fills the requested height
    return el("img", {
      src: ASSETS[layer.asset],
      width: w,
      height: h,
      style: { ...positionStyle(layer, flow), ...(layer.cover ? { objectFit: "cover" } : {}) },
    });
  }

  function buildText(layer, flow) {
    const text = layer.titleCase ? capitalize(layer.text) : layer.text;
    return el(
      "div",
      { style: { ...positionStyle(layer, flow), width: layer.w, ...textStyle(layer.font, layer.color) } },
      text,
    );
  }

  function buildRow(layer, flow) {
    if (layer.wrap) {
      // A wrapping row is really one run of copy assembled from static +
      // editable segments (e.g. "<location>," or "<city>"), rendered as a
      // single text block so satori's own line-breaking keeps trailing
      // punctuation attached to the last word — the way a real paragraph
      // would. A flex row with flex-wrap instead treats each segment as an
      // atomic item and can break between them (e.g. stranding the comma on
      // its own line).
      const raw = rowText(layer);
      const text = layer.titleCase ? capitalize(raw) : raw;
      return el(
        "div",
        { style: { ...positionStyle(layer, flow), width: layer.width, ...textStyle(layer.font, layer.color) } },
        text,
      );
    }
    const segs = layer.children.map((child) => {
      if (child.kind === "image") return buildImage(child, true);
      const raw = resolveText(child);
      const text = layer.titleCase ? capitalize(raw) : raw;
      return el(
        "span",
        {
          style: {
            whiteSpace: layer.wrap ? undefined : "pre", // preserve deliberate single-line spacing
            ...textStyle({ ...layer.font, ...child.font }, layer.color),
          },
        },
        text,
      );
    });
    return el(
      "div",
      {
        style: {
          ...positionStyle(layer, flow),
          display: "flex",
          flexWrap: layer.wrap ? "wrap" : undefined,
          width: layer.wrap ? layer.width : undefined,
          alignItems: layer.align || "flex-start",
          gap: layer.gap ?? 0,
          padding: Array.isArray(layer.padding) ? layer.padding.map((v) => `${v}px`).join(" ") : layer.padding,
          borderRadius: layer.radius,
          backgroundColor: layer.background,
        },
      },
      segs,
    );
  }

  function buildStack(layer, flow) {
    let children = layer.children;
    if (layer.fit) {
      const rows = layer.children.map((c) => ({
        weight: c.font.weight,
        font: c.font,
        width: c.width,
        text: c.titleCase ? capitalize(rowText(c)) : rowText(c),
      }));
      const scale = computeFitScale(layer.fit, rows);
      if (scale < 1) {
        children = layer.children.map((c) => ({
          ...c,
          font: {
            ...c.font,
            size: c.font.size * scale,
            lineHeight: c.font.lineHeight * scale,
            letterSpacing: c.font.letterSpacing * scale,
          },
        }));
      }
    }
    return el(
      "div",
      {
        style: {
          ...positionStyle(layer, flow),
          display: "flex",
          flexDirection: "column",
          width: layer.width,
          // Flexbox's default align-items is stretch, which would force
          // every child (e.g. the pill, which should hug its own text) to
          // the stack's full width.
          alignItems: layer.align || "flex-start",
          gap: layer.gap ?? 0,
        },
      },
      children.map((c) => buildLayer(c, true)),
    );
  }

  function buildLayer(layer, flow) {
    if (layer.kind === "image") return buildImage(layer, flow);
    if (layer.kind === "text") return buildText(layer, flow);
    if (layer.kind === "row") return buildRow(layer, flow);
    if (layer.kind === "stack") return buildStack(layer, flow);
    return el("div", {}, undefined);
  }

  const layers = mergeLayers(tpl.layers, size.overrides);
  const children = layers.map((layer) => buildLayer(layer, false));

  const svg = await satori(
    el(
      "div",
      { style: { width: tpl.width, height, display: "flex", position: "relative", fontFamily: "Figtree" } },
      children,
    ),
    { width: tpl.width, height, fonts: FONTS },
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: tpl.width * PIXEL_RATIO } }).render().asPng();
  return Buffer.from(png);
}

/**
 * Validate/normalize the endpoint's query params against a template.
 * Returns {error} for values that don't name a real option, otherwise the
 * options object for renderAsset plus the pieces the endpoint needs.
 */
export function parseParams(tpl, params) {
  const size = tpl.sizes.find((s) => s.value === (params.get("size") ?? tpl.defaultSize));
  if (!size) return { error: "unknown size" };

  const fields = {};
  for (const f of tpl.fields) {
    // Free-text goes straight into satori as text nodes (never markup), so
    // length is the only constraint that matters.
    fields[f.name] = (params.get(f.name) ?? f.default).slice(0, f.maxLength);
  }

  return { size, render: { size, fields } };
}
