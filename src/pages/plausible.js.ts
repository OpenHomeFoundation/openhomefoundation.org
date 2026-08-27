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
 * Add &manual to take over pageview tracking yourself:
 *
 *   <script async src="https://www.openhomefoundation.org/plausible.js?site=example.org&manual"></script>
 *
 * Nothing is tracked automatically; the page calls plausible("pageview") /
 * plausible("SomeEvent") itself (calls made before Plausible finishes loading
 * are queued and sent once it has). This replaces the legacy script.manual.js,
 * which predates transformRequest and so can never enforce the referrer
 * filter below — with &manual the same current-generation script is loaded,
 * just with automatic pageviews off, and the filter applies to every event.
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
  var manual = false;
  try {
    var params = new URL(script.src).searchParams;
    site = params.get("site");
    // Bare "&manual" is the documented form; tolerate =true/=1 and treat an
    // explicit =false/=0 as off.
    var manualParam = params.get("manual");
    manual = manualParam !== null && manualParam !== "false" && manualParam !== "0";
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

  var config = {
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
  };
  if (manual) {
    // Manual mode: the page triggers its own pageviews with
    // plausible("pageview"). The transformRequest filter above still runs on
    // every event — it is set once at init and applies for the page lifetime.
    config.autoCapturePageviews = false;
  }
  window.plausible.init(config);

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
