// Social-asset template definitions for the Community Day asset generator.
// Each entry fully describes one Figma frame as a stack of positioned layers.
// The server-side renderer (render-asset.js) turns a template plus the
// request parameters into a PNG; the AssetGenerator component builds its
// form from the same data. Adding a template is a data change here, not a
// code change.
//
// Ported from community-day-2026-template/js/templates.js (Figma file
// tbgI56SGDnakPeMVtmuIaY, frame "event-detail-social", 101:3018), rebuilt for
// this repo's satori/resvg renderer instead of that prototype's DOM+html-to-
// image one. Every coordinate below is that frame's value doubled, so the
// template renders at 1080x1350.
//
// Coordinate system: pixels, origin at the frame's top-left, matching Figma.
//
// Layer kinds:
//   'image' — positioned image at {x,y,w,h}. `asset` names a bundled image;
//             h omitted on a `cover` layer fills the requested output height.
//   'text'  — positioned static text block.
//   'row'   — horizontal auto-layout. Hugs its content unless `wrap` is set,
//             in which case it's a fixed-`width` block that wraps like a
//             paragraph. Children are `{ text }`, `{ field }` (filled from
//             the request) or `{ kind: 'image', asset }`.
//   'stack' — vertical auto-layout. `bottom` (instead of `y`) pins its
//             bottom edge and lets it grow upward as children wrap. A `fit`
//             ({maxLines, minScale}) shrinks all of a stack's row children
//             together — font size, line height and letter spacing in step —
//             until their combined wrapped line count fits the budget.
//
// Per-format overrides: a `sizes` entry may override any id'd top-level
// layer (see the `square` entry below), not just the frame height.
//
// NOTE ON TYPE: the Figma design is set in Biotif, a commercial face that
// isn't on Google Fonts, so this substitutes Figtree — sizes and positions
// match the design but the letterforms don't, and text runs a little wider.

const INK = "#09202E";
const PILL = "#F7F6F2";

export const TEMPLATES = [
  {
    id: "community-day-2026",
    name: "Community Day 2026",
    width: 1080,
    height: 1350, // base/authoring height; layer y-coords are relative to this
    defaultSize: "portrait",
    sizes: [
      { value: "portrait", label: "Portrait — 1080 × 1350", height: 1350 },
      // The square format comes from its own Figma frame ("event-detail-
      // square", 101:3938): a backdrop whose illustration sits top-right
      // instead of through the middle, so it doesn't collide with the copy,
      // plus a smaller logo row and headline to suit the shorter frame. The
      // detail block is deliberately left alone so both formats wrap and
      // shrink identically.
      {
        value: "square",
        label: "Square — 1080 × 1080",
        height: 1080,
        overrides: {
          backdrop: { asset: "backdropSquare" },
          logos: {
            x: 62.4,
            y: 56,
            gap: 30.9,
            children: [{ w: 48.5, h: 48.5 }, { w: 48.5, h: 48.5 }, { w: 48.5, h: 48.5 }],
          },
          title: { y: 126.5, font: { size: 70.5, lineHeight: 84.7, letterSpacing: -0.71 } },
          year: { y: 211.2, font: { size: 70.5, lineHeight: 84.7, letterSpacing: -0.71 } },
        },
      },
    ],
    fields: [
      { name: "location", label: "Location name", default: "Location name", maxLength: 80 },
      { name: "city", label: "City name", default: "City name", maxLength: 60 },
      { name: "organizer", label: "Organizer name", default: "Organizer name", maxLength: 60 },
    ],
    layers: [
      // Flattened gradient + pattern + illustration + highlights. Covers the frame.
      { kind: "image", id: "backdrop", asset: "backdrop", x: 0, y: 0, w: 1080, h: 1350, cover: true, backdrop: true },

      // Logo row (Figma "Frame 8") — all three project marks, 33px @1x, 21px gap.
      {
        kind: "row",
        id: "logos",
        x: 64,
        y: 56,
        gap: 42,
        align: "center",
        children: [
          { kind: "image", asset: "logoHa", w: 66, h: 66 },
          { kind: "image", asset: "logoEsphome", w: 66, h: 66 },
          { kind: "image", asset: "logoMa", w: 66, h: 66 },
        ],
      },

      // Headline. The two lines carry different weights in Figma ("Community
      // Day" Bold, "2026" Regular), so they're two layers one line-height apart.
      {
        kind: "text",
        id: "title",
        text: "Community Day",
        x: 58,
        y: 152,
        w: 964,
        font: { weight: 700, size: 96, lineHeight: 115.2, letterSpacing: -0.96 },
        color: INK,
      },
      {
        kind: "text",
        id: "year",
        text: "2026",
        x: 58,
        y: 267.2,
        w: 964,
        font: { weight: 400, size: 96, lineHeight: 115.2, letterSpacing: -0.96 },
        color: INK,
      },

      // The whole detail block (Figma "Frame 13"): a vertical auto-layout,
      // 469px wide @1x, whose bottom is pinned 62.2px from the frame's bottom
      // edge. It hugs its content and grows upward, so when the location or
      // city wraps onto extra lines everything above it shifts up instead of
      // running off the graphic.
      {
        kind: "stack",
        x: 63.2,
        bottom: 62.2,
        width: 938,
        gap: 40,
        children: [
          // Date pill (Figma "Frame 1"). The Community Day date is fixed for
          // the whole event, so it's static copy, not an editable field.
          {
            kind: "row",
            gap: 0,
            // Optical centring, not Figma's raw padding — see the equivalent
            // comment in the reference template for why. Re-measure if the
            // font changes.
            padding: [24.7, 29.1, 24.8, 29.1], // top, right, bottom, left
            radius: 19.4,
            background: PILL,
            align: "center",
            font: { weight: 400, size: 45.5, lineHeight: 41.9, letterSpacing: -0.46 },
            color: INK,
            titleCase: true,
            children: [
              { text: "Saturday," },
              { text: " " }, // NBSP: a plain space would collapse
              { text: "November 7", font: { weight: 700 } },
            ],
          },

          // Location + city (Figma "Frame 12"). Both fill the stack's width
          // and wrap, sharing a 3-line budget: if the copy wraps past it,
          // both shrink together until it fits, so the block never grows
          // into the headline.
          {
            kind: "stack",
            gap: 0,
            fit: { maxLines: 3, minScale: 0.45 },
            children: [
              // The comma is part of the design, so it's a static segment
              // that stays attached to the end of the editable name as it wraps.
              {
                kind: "row",
                wrap: true,
                width: 938,
                font: { weight: 400, size: 96, lineHeight: 115.2, letterSpacing: -0.96 },
                color: INK,
                titleCase: true,
                children: [
                  { field: "location", label: "Location name", default: "Location name" },
                  { text: "," },
                ],
              },
              {
                kind: "row",
                wrap: true,
                width: 938,
                font: { weight: 700, size: 96, lineHeight: 115.2, letterSpacing: -0.96 },
                color: INK,
                titleCase: true,
                children: [{ field: "city", label: "City name", default: "City name" }],
              },
            ],
          },

          // Credits (Figma "Group 12"): the organizer line above the OHF lockup line.
          {
            kind: "stack",
            gap: 14.6,
            children: [
              // "Organized by <organizer>" (Figma "Frame 14").
              {
                kind: "row",
                gap: 6,
                align: "center",
                font: { weight: 400, size: 29.1, lineHeight: 26.8, letterSpacing: -0.29 },
                color: INK,
                children: [
                  { text: "Organized by" },
                  { field: "organizer", label: "Organizer name", default: "Organizer name", font: { weight: 700 } },
                ],
              },
              // "and the [Open Home Foundation]" (Figma "Group 11") — static.
              {
                kind: "row",
                gap: 16,
                align: "center",
                font: { weight: 400, size: 29.1, lineHeight: 26.8, letterSpacing: -0.29 },
                color: INK,
                children: [{ text: "and the" }, { kind: "image", asset: "ohfLockup", w: 419.4, h: 41 }],
              },
            ],
          },
        ],
      },
    ],
  },
];
