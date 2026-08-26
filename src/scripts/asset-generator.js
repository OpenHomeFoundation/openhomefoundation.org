// Generic renderer + editor for the templates defined in asset-generator-templates.js.
// Builds the stage from a template config, wires up editable fields, and exports a PNG
// entirely client-side (html-to-image), so it works on our static Netlify hosting with
// no server rendering.
//
// Ported from https://github.com/elcaptain/social-templates.

import { toPng } from "html-to-image";
import { TEMPLATES } from "./asset-generator-templates.js";

const PIXEL_RATIO = 2; // export at 2x → e.g. 2160×2160 for a 1080 frame

// The @font-face CSS handed to html-to-image for the export, with the woff2
// files inlined as data URIs. Passing this explicitly (fontEmbedCSS) stops
// html-to-image from crawling every stylesheet on the page — the site-wide
// Google Fonts stylesheet is cross-origin and would throw a SecurityError /
// drag unrelated fonts into the render. Mirrors the @font-face rules in
// AssetGenerator.astro; only Figtree is used inside the stage.
const FIGTREE_FACES = [
  {
    url: "/assets/fonts/figtree-variable-latin.woff2",
    unicodeRange:
      "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    url: "/assets/fonts/figtree-variable-latin-ext.woff2",
    unicodeRange:
      "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  },
];

let fontEmbedCssPromise = null;
function getFontEmbedCss() {
  fontEmbedCssPromise ??= Promise.all(
    FIGTREE_FACES.map(async (face) => {
      const res = await fetch(face.url);
      if (!res.ok)
        throw new Error(`Failed to fetch ${face.url}: ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return (
        `@font-face { font-family: Figtree; font-style: normal; font-weight: 400 700; ` +
        `src: url(${dataUrl}) format('woff2'); unicode-range: ${face.unicodeRange}; }`
      );
    }),
  ).then((faces) => faces.join("\n"));
  return fontEmbedCssPromise;
}

export function initAssetGenerator(root = document) {
  const stageEl = root.querySelector("[data-ag-stage]");
  if (!stageEl) return; // component not on this page

  const scalerEl = root.querySelector("[data-ag-scaler]");
  const controlsEl = root.querySelector("[data-ag-controls]");
  const downloadBtn = root.querySelector("[data-ag-download]");
  const statusEl = root.querySelector("[data-ag-status]");

  let tpl = null; // the active template
  let baseHeight = 0; // height the layer coords are authored in
  let currentHeight = 0; // current selected output height
  const layerRecords = []; // {el, layer} for every built layer

  function applyFont(el, font, color, titleCase) {
    if (font) {
      if (font.weight) el.style.fontWeight = font.weight;
      if (font.size) el.style.fontSize = font.size + "px";
      if (font.lineHeight) el.style.lineHeight = font.lineHeight + "px";
      if (font.letterSpacing != null)
        el.style.letterSpacing = font.letterSpacing + "px";
    }
    if (color) el.style.color = color;
    // Figma's TITLE case styling.
    if (titleCase) el.style.textTransform = "capitalize";
  }

  // Collects editable field nodes so inputs can update them live.
  const fields = []; // {field, label, default, el, datePart}

  // Per-element transform components, combined into one transform:
  //   shiftY    — bottom-anchor offset when the output size grows
  //   collapseY — extra shift when an optional layer above is hidden
  //   scale/ox/oy — backdrop scale (illustration) about a frame-relative origin
  const txState = new Map();
  function getTx(el) {
    let t = txState.get(el);
    if (!t) {
      t = { shiftY: 0, collapseY: 0, scale: 1, ox: 0, oy: 0 };
      txState.set(el, t);
    }
    return t;
  }
  function applyTx(el) {
    const t = getTx(el);
    const parts = [];
    const ty = t.shiftY + t.collapseY;
    if (ty) parts.push(`translateY(${ty}px)`);
    if (t.scale !== 1) {
      parts.push(`scale(${t.scale})`);
      el.style.transformOrigin = `${t.ox}px ${t.oy}px`;
    }
    el.style.transform = parts.join(" ");
  }

  // Optional layers that can be shown/hidden via a checkbox.
  const optionalLayers = []; // {label, el, on, fields:Set, inputs:[], collapseShift}
  // Layers (flagged shiftOnCollapse) that slide down when an optional layer is hidden.
  const shiftEls = [];

  function applyOptional(opt) {
    opt.el.style.display = opt.on ? "" : "none";
    for (const input of opt.inputs) input.disabled = !opt.on;
    if (opt.collapseShift) {
      for (const el of shiftEls) {
        getTx(el).collapseY = opt.on ? 0 : opt.collapseShift;
        applyTx(el);
      }
    }
  }
  const optionalLayerForField = (field) =>
    optionalLayers.find((o) => o.fields.has(field));

  // Image layers driven by a dropdown (e.g. the project logo).
  const selectLayers = []; // {field, label, options, el}

  // One date picker can drive multiple text fields (see datePart in the template).
  let datePicker = null; // {label, default}

  // Parse a YYYY-MM-DD value as a LOCAL date (avoids UTC-shift to the previous day).
  function parseLocalDate(value) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const DATE_PARTS = {
    weekday: (dt) => dt.toLocaleDateString("en-US", { weekday: "long" }) + ",",
    monthday: (dt) =>
      dt.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  };
  function formatDatePart(value, part) {
    const fn = DATE_PARTS[part];
    return fn ? fn(parseLocalDate(value)) : value;
  }

  function makeImage(layer) {
    const img = document.createElement("img");
    img.className = "layer-image";
    // The branding-API logos are cross-origin; load them in CORS mode so
    // html-to-image can fetch and inline them at export without a cache
    // mismatch (the API sends Access-Control-Allow-Origin: *).
    img.crossOrigin = "anonymous";
    if (layer.select) {
      const sel = layer.select;
      const opt =
        sel.options.find((o) => o.value === sel.default) || sel.options[0];
      img.src = opt.src;
      selectLayers.push({
        field: sel.field,
        label: sel.label,
        options: sel.options,
        el: img,
      });
    } else {
      img.src = layer.src;
    }
    if (layer.w) img.style.width = layer.w + "px";
    if (layer.h) img.style.height = layer.h + "px";
    if (layer.cover) img.style.objectFit = "cover";
    return img;
  }

  function makeTextSpan(child, parentFont, parentColor, parentTitleCase) {
    const span = document.createElement("span");
    span.className = "seg";
    span.textContent = child.editable ? child.default : child.text;
    // child.font overrides individual properties (e.g. bold Date) on top of the row font.
    applyFont(
      span,
      Object.assign({}, parentFont, child.font),
      parentColor,
      parentTitleCase,
    );
    if (child.editable) {
      span.dataset.field = child.field;
      fields.push({
        field: child.field,
        label: child.label,
        default: child.default,
        el: span,
        datePart: child.datePart,
      });
    }
    return span;
  }

  function buildLayer(layer) {
    if (layer.kind === "image") {
      const img = makeImage(layer);
      img.style.left = layer.x + "px";
      img.style.top = layer.y + "px";
      return img;
    }

    if (layer.kind === "text") {
      const el = document.createElement("div");
      el.className = "layer-text";
      el.style.left = layer.x + "px";
      el.style.top = layer.y + "px";
      if (layer.w) el.style.width = layer.w + "px";
      el.textContent = layer.text;
      applyFont(el, layer.font, layer.color, layer.titleCase);
      return el;
    }

    if (layer.kind === "row") {
      const row = document.createElement("div");
      row.className = "layer-row";
      row.style.left = layer.x + "px";
      row.style.top = layer.y + "px";
      row.style.gap = (layer.gap || 0) + "px";
      if (layer.align) row.style.alignItems = layer.align;
      if (layer.padding != null) row.style.padding = layer.padding + "px";
      if (layer.radius != null) row.style.borderRadius = layer.radius + "px";
      if (layer.background) row.style.background = layer.background;

      for (const child of layer.children) {
        if (child.kind === "image") {
          row.appendChild(makeImage(child));
        } else {
          row.appendChild(
            makeTextSpan(child, layer.font, layer.color, layer.titleCase),
          );
        }
      }
      return row;
    }

    return document.createDocumentFragment();
  }

  function buildStage() {
    stageEl.style.width = tpl.width + "px";
    baseHeight = tpl.height;
    stageEl.innerHTML = "";
    fields.length = 0;
    optionalLayers.length = 0;
    shiftEls.length = 0;
    selectLayers.length = 0;
    layerRecords.length = 0;
    txState.clear();
    datePicker = null;
    for (const layer of tpl.layers) {
      if (layer.datePicker) datePicker = layer.datePicker;
      const el = buildLayer(layer);
      layerRecords.push({ el, layer });
      if (layer.shiftOnCollapse) shiftEls.push(el);
      if (layer.optional) {
        const opt = {
          label: layer.optionLabel || "Show layer",
          el,
          on: layer.defaultOn !== false,
          fields: new Set(
            (layer.children || [])
              .filter((c) => c.editable)
              .map((c) => c.field),
          ),
          inputs: [],
          collapseShift: layer.collapseShift || 0,
        };
        optionalLayers.push(opt);
        el.style.display = opt.on ? "" : "none";
      }
      stageEl.appendChild(el);
    }
    // Apply the default output size, then the initial collapse state.
    const sizes = tpl.sizes || [{ value: "base", height: tpl.height }];
    const def = sizes.find((s) => s.value === tpl.defaultSize) || sizes[0];
    applySize(def.height);
    for (const opt of optionalLayers) applyOptional(opt);
  }

  // Switch output height: bottom-anchor content, cover/scale the backdrop.
  function applySize(height) {
    currentHeight = height;
    stageEl.style.height = height + "px";
    const delta = height - baseHeight;
    for (const { el, layer } of layerRecords) {
      if (layer.scaleWithSize) {
        // Scale proportionally about the frame's top-centre (kept fixed as it grows).
        const t = getTx(el);
        t.scale = height / baseHeight;
        t.ox = tpl.width / 2 - (layer.x || 0);
        t.oy = 0 - (layer.y || 0);
        applyTx(el);
      } else if (layer.backdrop) {
        // Cover backdrop (gradient): fill the new height, proportions preserved by object-fit.
        if (layer.cover) el.style.height = height + "px";
      } else {
        // Everything else is anchored to the bottom.
        getTx(el).shiftY = delta;
        applyTx(el);
      }
    }
    fitPreview();
  }

  function makeCheckbox(checked, labelText, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "toggle";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    const span = document.createElement("span");
    span.textContent = labelText;
    wrap.appendChild(box);
    wrap.appendChild(span);
    return wrap;
  }

  function makeSelect(sel) {
    const wrap = document.createElement("label");
    wrap.className = "field";
    const span = document.createElement("span");
    span.className = "field-label";
    span.textContent = sel.label;
    const select = document.createElement("select");
    for (const o of sel.options) {
      const optEl = document.createElement("option");
      optEl.value = o.value;
      optEl.textContent = o.label;
      select.appendChild(optEl);
    }
    select.addEventListener("change", () => {
      const o = sel.options.find((x) => x.value === select.value);
      if (o) sel.el.src = o.src;
    });
    wrap.appendChild(span);
    wrap.appendChild(select);
    return wrap;
  }

  function makeDatePicker(spec, dateFields) {
    const wrap = document.createElement("label");
    wrap.className = "field";
    const span = document.createElement("span");
    span.className = "field-label";
    span.textContent = spec.label;
    const input = document.createElement("input");
    input.type = "date";
    input.value = spec.default || "";
    const apply = () => {
      if (!input.value) return;
      for (const f of dateFields)
        f.el.textContent = formatDatePart(input.value, f.datePart);
    };
    input.addEventListener("input", apply);
    apply(); // sync spans to the initial date
    wrap.appendChild(span);
    wrap.appendChild(input);
    return wrap;
  }

  function makeSizePicker() {
    const wrap = document.createElement("label");
    wrap.className = "field";
    const span = document.createElement("span");
    span.className = "field-label";
    span.textContent = "Size";
    const select = document.createElement("select");
    for (const s of tpl.sizes) {
      const o = document.createElement("option");
      o.value = s.value;
      o.textContent = s.label;
      if (s.value === tpl.defaultSize) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener("change", () => {
      const s = tpl.sizes.find((x) => x.value === select.value);
      if (s) applySize(s.height);
    });
    wrap.appendChild(span);
    wrap.appendChild(select);
    return wrap;
  }

  function buildControls() {
    controlsEl.innerHTML = "";
    // Size picker first, then dropdowns (e.g. project logo).
    if (tpl.sizes && tpl.sizes.length > 1)
      controlsEl.appendChild(makeSizePicker());
    for (const sel of selectLayers) controlsEl.appendChild(makeSelect(sel));

    // One date picker drives all date-derived fields (Weekday + Date).
    const dateFields = fields.filter((f) => f.datePart);
    if (datePicker && dateFields.length) {
      controlsEl.appendChild(makeDatePicker(datePicker, dateFields));
    }

    const emittedToggles = new Set();
    for (const f of fields) {
      if (f.datePart) continue; // handled by the date picker
      const opt = optionalLayerForField(f.field);
      if (opt && !emittedToggles.has(opt)) {
        emittedToggles.add(opt);
        controlsEl.appendChild(
          makeCheckbox(opt.on, opt.label, (on) => {
            opt.on = on;
            applyOptional(opt);
          }),
        );
      }
      const wrap = document.createElement("label");
      wrap.className = "field";
      const span = document.createElement("span");
      span.className = "field-label";
      span.textContent = f.label;
      const input = document.createElement("input");
      input.type = "text";
      input.value = f.default;
      input.addEventListener("input", () => {
        // Keep a space so an empty field doesn't collapse the line height.
        f.el.textContent = input.value || " ";
      });
      wrap.appendChild(span);
      wrap.appendChild(input);
      controlsEl.appendChild(wrap);

      // Register the input so its optional layer's checkbox can disable it.
      if (opt) {
        opt.inputs.push(input);
        input.disabled = !opt.on;
      }
    }
  }

  // Fit the (full-size) stage into its preview column via CSS transform.
  const PREVIEW_SCALE = 0.5; // show the preview at half the column-fit size
  function fitPreview() {
    // Measure the parent's inner width (the scaler's own width is mutated below).
    const parent = scalerEl.parentElement;
    const cs = getComputedStyle(parent);
    const avail =
      parent.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    const scale = Math.min(1, avail / tpl.width) * PREVIEW_SCALE;
    stageEl.style.transform = `scale(${scale})`;
    // Reserve the scaled-down footprint so layout doesn't overflow.
    scalerEl.style.width = tpl.width * scale + "px";
    scalerEl.style.height = currentHeight * scale + "px";
  }

  async function exportPng() {
    statusEl.textContent = "Rendering…";
    downloadBtn.disabled = true;
    try {
      await document.fonts.ready;
      // Capture at native size regardless of the on-screen preview transform.
      // pixelRatio scales the output canvas: width*pixelRatio = 2160 for a 1080 frame.
      // Do NOT also set canvasWidth/Height — html-to-image multiplies them by pixelRatio.
      const dataUrl = await toPng(stageEl, {
        pixelRatio: PIXEL_RATIO,
        width: tpl.width,
        height: currentHeight,
        style: { transform: "none", transformOrigin: "top left" },
        fontEmbedCSS: await getFontEmbedCss(),
      });
      const city = (fields.find((f) => f.field === "city") || {}).el;
      const slug =
        (city ? city.textContent : tpl.id)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || tpl.id;
      const link = document.createElement("a");
      link.download = `${tpl.id}_${tpl.width}x${currentHeight}_${slug}.png`;
      link.href = dataUrl;
      link.click();
      statusEl.textContent = "Downloaded ✓";
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Export failed — see console.";
    } finally {
      downloadBtn.disabled = false;
    }
  }

  tpl = TEMPLATES[0]; // single template for now
  buildStage();
  buildControls();
  fitPreview();
  window.addEventListener("resize", fitPreview);
  downloadBtn.addEventListener("click", exportPng);
  document.fonts.ready.then(fitPreview);
}
