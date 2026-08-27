// Social-asset template definitions for the Community Day asset generator.
// Each entry fully describes one Figma frame as a stack of positioned layers.
// The renderer (asset-generator.js) is generic — adding a new template is a
// data change here, not a code change.
//
// Ported from https://github.com/elcaptain/social-templates (Figma file
// 61SfzG7xiYlR5YUheV82F9), adapted to source the project logos live from the
// OHF branding API instead of baked-in Figma exports.
//
// Coordinate system: pixels, origin at the frame's top-left, matching Figma.
//
// Layer kinds:
//   'image'       — absolutely positioned <img> at {x,y,w,h}. h omitted = auto.
//   'text'        — absolutely positioned static text block.
//   'row'         — horizontal flex row (Figma auto-layout) at {x,y} that hugs its
//                   content; used for the by-line and the editable date-time pill.
//                   Children are 'text' (with optional `editable`+`field`+`default`)
//                   or 'image' segments.
// Editable fields are collected by the renderer to build the control panel.

// Project logos come from the branding API (CORS is open, so html-to-image can
// inline them at export time). Colour lockups on a light background, matching
// the Figma "project-logo" component variants.
const brandLogo = (project) =>
  `https://brands.openhomefoundation.org/api/${project}/logo/screen/lockup/main/color/light/svg`;

// Fixed backdrop art (gradient + white icon illustration) are Figma exports
// with no branding-API equivalent, served from this site.
const ASSET_BASE = "/assets/images/community-day/asset-generator";

// Shared text colours from the Figma design.
const INK = "#1D2126";
const BYLINE_INK = "#09202E";

export const TEMPLATES = [
  {
    id: "community-meetup",
    name: "Community Meetup",
    width: 1080,
    height: 1080, // base/authoring height; layer y-coords are relative to this
    // Selectable output sizes. Width is fixed; only the height changes. Content layers
    // are bottom-anchored, the backdrop (gradient + illustration) scales to fill.
    defaultSize: "square",
    sizes: [
      { value: "square", label: "Square — 1080 × 1080", height: 1080 },
      { value: "portrait", label: "Portrait — 1080 × 1350", height: 1350 },
    ],
    // Backdrop is the gradient (cover) with the icon illustration on top, clipped by
    // the stage. The illustration sits at a negative offset, exactly as in Figma.
    // `backdrop` layers are NOT bottom-anchored; `scaleWithSize` scales proportionally.
    layers: [
      {
        kind: "image",
        src: `${ASSET_BASE}/gradient.png`,
        x: 0,
        y: 0,
        w: 1080,
        h: 1080,
        cover: true,
        backdrop: true,
      },
      {
        kind: "image",
        src: `${ASSET_BASE}/illustration.svg`,
        x: -444,
        y: -179,
        w: 2361,
        h: 1272,
        backdrop: true,
        scaleWithSize: true,
      },

      // Project logo — a dropdown picks one of the branding-API lockups.
      // Left-anchored at x=69; height fixed, width follows each logo's aspect ratio.
      {
        kind: "image",
        x: 69,
        y: 483,
        h: 73,
        shiftOnCollapse: true,
        select: {
          field: "logo",
          label: "Project logo",
          default: "ha",
          options: [
            {
              value: "ha",
              label: "Home Assistant",
              src: brandLogo("home-assistant"),
            },
            { value: "esphome", label: "ESPHome", src: brandLogo("esphome") },
            {
              value: "ma",
              label: "Music Assistant",
              src: brandLogo("music-assistant"),
            },
          ],
        },
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

      // Editable date-time pill — horizontal auto-layout that grows on one line.
      {
        kind: "row",
        shiftOnCollapse: true,
        x: 68,
        y: 842,
        gap: 10,
        padding: 16,
        radius: 8,
        background: "#16F3BE",
        align: "center",
        font: {
          weight: 400,
          size: 38,
          lineHeight: 33.44,
          letterSpacing: -0.38,
        },
        color: INK,
        titleCase: true,
        // Weekday + Date are driven by one date picker (see datePart below).
        // Default is Community Day 2026.
        datePicker: { label: "Event date", default: "2026-11-07" },
        children: [
          {
            kind: "text",
            editable: true,
            field: "weekday",
            label: "Weekday",
            default: "Saturday,",
            datePart: "weekday",
          },
          {
            kind: "text",
            editable: true,
            field: "date",
            label: "Date",
            default: "November 7",
            font: { weight: 700 },
            datePart: "monthday",
          },
          { kind: "text", text: "|" },
          {
            kind: "text",
            editable: true,
            field: "city",
            label: "City",
            default: "Rome",
          },
        ],
      },

      // By-line: static text + editable bold organizer name. Optional — toggled by a checkbox.
      {
        kind: "row",
        optional: true,
        optionLabel: 'Show "organized by" line',
        defaultOn: true,
        // When hidden, slide the layers flagged shiftOnCollapse down by this many px so
        // the content stays bottom-anchored (date-time bottom lands where the by-line was).
        collapseShift: 104,
        x: 68,
        y: 982,
        gap: 8,
        align: "center",
        font: { weight: 400, size: 30, lineHeight: 28.8, letterSpacing: -0.3 },
        color: BYLINE_INK,
        children: [
          { kind: "text", text: "An event organized by " },
          {
            kind: "text",
            editable: true,
            field: "organizer",
            label: "Organizer",
            default: "Organizer",
            font: { weight: 700 },
          },
        ],
      },
    ],
  },
];
