// The shared Plausible loader, served as /plausible.js. Any Open Home
// Foundation site enables analytics with a single tag and nothing else:
//
//   <script async src="https://www.openhomefoundation.org/plausible.js?site=example.org"></script>
//
// The site map (list/plausible-sites.json) and the referrer allowlist
// (list/allowed-referrers.txt) are baked in at build time, both validated by
// src/lib/referrers.js down to characters that are safe to interpolate.
// Because embedding sites always fetch this file from us, updating either
// list and deploying updates every site — including ones with no build step.
import type { APIRoute } from "astro";
import { allowedReferrers } from "../lib/allowed-referrers.js";
import { plausibleSites } from "../lib/plausible-sites.js";

// Classic ES5-style script on purpose: it gets pasted into places we don't
// control (Squarespace, forum templates) and must never need a build step.
const source = `/*!
 * Open Home Foundation — Plausible loader.
 *
 * Usage (one tag, nothing else):
 *
 *   <script async src="https://www.openhomefoundation.org/plausible.js?site=example.org"></script>
 *
 * where ?site= names a site registered in list/plausible-sites.json. This
 * script resolves the site's Plausible script id, installs a referrer filter,
 * and then loads the real Plausible script.
 *
 * Why the filter: visitors arriving from their own Home Assistant or ESPHome
 * instance send their private URL as the referrer. Any referrer not on the
 * public allowlist is replaced with https://unlisted.invalid/ before Plausible
 * ever sees it, so those URLs are never recorded.
 *
 * Source: https://github.com/OpenHomeFoundation/openhomefoundation.org
 *   Site registry:      list/plausible-sites.json
 *   Referrer allowlist: list/allowed-referrers.txt
 */
(function () {
  "use strict";

  var SITES = ${JSON.stringify(plausibleSites)};

  var ALLOWED_REFERRERS = ${JSON.stringify(allowedReferrers)};

  function warn(message) {
    if (window.console && console.warn) console.warn("[OHF plausible.js] " + message);
  }

  // Find our own <script> tag to read ?site= from. currentScript covers every
  // normal inclusion, async included; the selector fallback covers scripts
  // inserted dynamically, where currentScript is null.
  var script = document.currentScript;
  if (!script || !script.src) {
    var candidates = document.querySelectorAll('script[src*="/plausible.js"]');
    script = candidates.length ? candidates[candidates.length - 1] : null;
  }
  if (!script || !script.src) {
    warn("could not find my own <script> tag, not loading Plausible");
    return;
  }

  var site = null;
  try {
    site = new URL(script.src).searchParams.get("site");
  } catch (e) {
    // Unparseable src: handled below.
  }
  if (!site) {
    warn('missing ?site= — use src="…/plausible.js?site=example.org", not loading Plausible');
    return;
  }

  var scriptId = SITES[site.toLowerCase().replace(/^www\\./, "")];
  if (!scriptId) {
    warn(
      '"' + site + '" is not a registered site — add it to list/plausible-sites.json ' +
      "in the openhomefoundation.org repository, not loading Plausible"
    );
    return;
  }

  // A duplicated tag (easy to do in a CMS) must not load Plausible twice.
  if (window.__ohfPlausible) {
    warn("already loaded on this page, ignoring the extra tag");
    return;
  }
  window.__ohfPlausible = site;

  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  window.plausible.init =
    window.plausible.init ||
    function (i) {
      window.plausible.o = i || {};
    };

  window.plausible.init({
    transformRequest: function (payload) {
      var ref = payload.r;
      if (!ref) return payload;

      var host = "";
      try {
        host = new URL(ref).hostname.replace(/\\.$/, "");
      } catch (e) {
        // Unparseable referrer: falls through and gets replaced.
      }

      for (var i = 0; i < ALLOWED_REFERRERS.length; i++) {
        var d = ALLOWED_REFERRERS[i];
        if (host === d || (host.length > d.length && host.slice(-(d.length + 1)) === "." + d)) {
          return payload;
        }
      }

      // One aggregate bucket in Plausible, so we can see how much we filter
      // without learning anything about individual visitors. .invalid is
      // reserved by RFC 2606 and can never collide with a real domain.
      payload.r = "https://unlisted.invalid/";
      return payload;
    },
  });

  var loader = document.createElement("script");
  loader.async = true;
  loader.src = "https://plausible.openhomefoundation.org/js/" + scriptId + ".js";
  (document.head || document.documentElement).appendChild(loader);
})();
`;

export const GET: APIRoute = () =>
  new Response(source, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
