// The Plausible site registry: list/plausible-sites.json, a flat JSON object
// of { "domain": "script-id" }, baked into the loader script published as
// openhomefoundation.org/plausible.js. JSON has no comments, so the file's
// documentation lives here.
//
// WHY THE REGISTRY EXISTS
// Every Open Home Foundation site runs Plausible behind the referrer allowlist
// (see list/allowed-referrers.txt). Instead of each site vendoring the
// Plausible snippet and a copy of the allowlist into its own build, a site
// adds one tag:
//
//   <script async src="https://www.openhomefoundation.org/plausible.js?site=example.org"></script>
//
// The loader looks the site up in the registry, installs the referrer filter,
// and then loads that site's real Plausible script. Sites without a build step
// (Squarespace, the forums) get an always-current allowlist this way too.
//
// ADDING A SITE
// Add a "domain": "script-id" pair, where the script id is the "pa-…" part of
// the script filename shown in the Plausible dashboard under Site Settings →
// Site Installation. The domain must be the bare domain the site will pass as
// ?site= (the loader only forgives case and a leading "www."). Script ids are
// not secrets — they are visible in the HTML of every page that uses them —
// but only add sites we actually operate: an entry lets that ?site= value send
// events into our Plausible dashboards.
//
// Same pattern as allowed-referrers.js: the registry is imported as raw text
// so it is part of the module graph, and loadPlausibleSites() throws on a JSON
// syntax error, a duplicated key, or an invalid entry, which fails the build —
// a bad registry can never deploy. Every domain and script id is validated
// down to known-safe characters, so the map is safe to interpolate into the
// served /plausible.js.
import sitesFileText from "../../list/plausible-sites.json?raw";
import { loadPlausibleSites } from "./referrers.js";

export const plausibleSites = loadPlausibleSites(sitesFileText);
