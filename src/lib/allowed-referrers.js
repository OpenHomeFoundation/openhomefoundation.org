// The list files are imported as raw text so they are part of the module
// graph: the build bundles them, and editing them triggers a reload in dev.
// loadAllowedReferrers() throws on an invalid entry, which fails the build —
// a bad list can never deploy. Every entry is validated down to [a-z0-9.-],
// so it is safe to interpolate straight into a <script> block.
import allowFileText from "../../list/allowed-referrers.txt?raw";
import denyFileText from "../../list/deny-patterns.txt?raw";
import { loadAllowedReferrers } from "./referrers.js";

export const allowedReferrers = loadAllowedReferrers(allowFileText, denyFileText);
