// Same pattern as allowed-referrers.js: the list file is imported as raw text
// so it is part of the module graph, and loadPlausibleSites() throws on an
// invalid entry, which fails the build — a bad registry can never deploy.
// Every domain and script id is validated down to known-safe characters, so
// the map is safe to interpolate into the served /plausible.js.
import sitesFileText from "../../list/plausible-sites.txt?raw";
import { loadPlausibleSites } from "./referrers.js";

export const plausibleSites = loadPlausibleSites(sitesFileText);
