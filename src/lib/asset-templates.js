// Social-asset template definitions for the Community Day asset generator.
// Each entry fully describes one Figma frame as a stack of positioned layers.
// The server-side renderer (render-asset.js) turns a template plus the request
// parameters into a PNG; the AssetGenerator component builds its form from the
// same data. Adding a template is a data change here, not a code change.
//
// Ported from https://github.com/elcaptain/social-templates (Figma file
// 61SfzG7xiYlR5YUheV82F9), adapted to source the project logos live from the
// OHF branding API instead of baked-in Figma exports.
//
// Coordinate system: pixels, origin at the frame's top-left, matching Figma.
//
// Layer kinds:
//   'image'  — positioned image at {x,y,w,h}. `asset` names a bundled backdrop
//              asset; `logo: true` means the logo picked by the request.
//   'text'   — positioned text block. `text` is static copy.
//   'row'    — horizontal auto-layout row at {x,y} that hugs its content.
//              Children are text segments: static `text`, a `field` filled from
//              the request (city, organizer), or a `datePart` derived from the
//              event date (weekday / monthday).
//
// Sizing: layer coords are authored at `height`; taller outputs bottom-anchor
// the content layers, `backdrop` layers scale/cover instead (`scaleWithSize`
// scales proportionally about the frame's top-centre). Hiding the optional
// by-line slides the `shiftOnCollapse` layers down by its `collapseShift`.

// Shared text colours from the Figma design.
const INK = "#1D2126";
const BYLINE_INK = "#09202E";

export const TEMPLATES = [
  {
    id: "community-meetup",
    name: "Community Meetup",
    width: 1080,
    height: 1080,
    defaultSize: "square",
    sizes: [
      { value: "square", label: "Square — 1080 × 1080", height: 1080 },
      { value: "portrait", label: "Portrait — 1080 × 1350", height: 1350 },
    ],
    // Project logos come from the branding API: colour lockups on a light
    // background, matching the Figma "project-logo" component variants.
    logos: [
      { value: "ha", label: "Home Assistant", project: "home-assistant" },
      { value: "esphome", label: "ESPHome", project: "esphome" },
      { value: "ma", label: "Music Assistant", project: "music-assistant" },
    ],
    defaultLogo: "ha",
    // Weekday + date in the pill are both derived from this one date.
    datePicker: { label: "Event date", default: "2026-11-07" },
    fields: [
      { name: "city", label: "City", default: "Rome", maxLength: 60 },
      {
        name: "organizer",
        label: "Organizer",
        default: "Organizer",
        maxLength: 60,
      },
    ],
    byline: { label: 'Show "organized by" line', default: true },
    layers: [
      // Backdrop: gradient (cover) with the icon illustration on top, clipped
      // by the frame. The illustration sits at a negative offset, as in Figma.
      {
        kind: "image",
        asset: "gradient",
        x: 0,
        y: 0,
        w: 1080,
        h: 1080,
        cover: true,
        backdrop: true,
      },
      {
        kind: "image",
        asset: "illustration",
        x: -444,
        y: -179,
        w: 2361,
        h: 1272,
        backdrop: true,
        scaleWithSize: true,
      },

      // Project logo — left-anchored at x=69; height fixed, width follows the
      // logo's own aspect ratio.
      {
        kind: "image",
        logo: true,
        x: 69,
        y: 483,
        h: 73,
        shiftOnCollapse: true,
      },

      {
        kind: "text",
        text: "Community Meetup",
        x: 58,
        y: 587,
        w: 972,
        font: {
          weight: 700,
          size: 120,
          lineHeight: 105.6,
          letterSpacing: -1.2,
        },
        color: INK,
        titleCase: true,
        shiftOnCollapse: true,
      },

      // Date-time pill — auto-layout row that grows on one line.
      {
        kind: "row",
        shiftOnCollapse: true,
        x: 68,
        y: 842,
        gap: 10,
        padding: 16,
        radius: 8,
        background: "#16F3BE",
        font: {
          weight: 400,
          size: 38,
          lineHeight: 33.44,
          letterSpacing: -0.38,
        },
        color: INK,
        titleCase: true,
        children: [
          { datePart: "weekday" },
          { datePart: "monthday", font: { weight: 700 } },
          { text: "|" },
          { field: "city" },
        ],
      },

      // By-line: static text + bold organizer name. Optional — when hidden the
      // shiftOnCollapse layers slide down so the content stays bottom-anchored.
      {
        kind: "row",
        optional: "byline",
        collapseShift: 104,
        x: 68,
        y: 982,
        gap: 8,
        font: { weight: 400, size: 30, lineHeight: 28.8, letterSpacing: -0.3 },
        color: BYLINE_INK,
        children: [
          { text: "An event organized by " },
          { field: "organizer", font: { weight: 700 } },
        ],
      },
    ],
  },
];

// Parse a YYYY-MM-DD value as date components (avoids UTC-shift issues).
export function parseIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export const DATE_PARTS = {
  weekday: (dt) => dt.toLocaleDateString("en-US", { weekday: "long" }) + ",",
  monthday: (dt) =>
    dt.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
};
