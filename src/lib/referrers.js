// Parsing and validation for the Plausible referrer allowlist.
//
// Why this exists: someone reaching one of our sites from their own Home
// Assistant or ESPHome instance sends their private URL as the referrer. We
// can't fix that at source (not everyone updates, and not every link carries
// rel="noreferrer"), so the site replaces any referrer that isn't on a known
// list of public websites before Plausible records it.
//
// This file is the gate. src/lib/allowed-referrers.js runs it during the
// build (for the base layout and the /allowed-referrers.json endpoint), so an
// invalid entry in list/allowed-referrers.txt fails the build rather than
// shipping. Adding a dynamic DNS provider or an IP address to the
// allowlist would publish someone's home URL, and that is not recoverable
// once it's in git history and on a CDN.

// This module is pure (no filesystem access) so it can run both inside the
// Astro build and from a plain `node` one-liner when reviewing the list. The
// site loads the list files via src/lib/allowed-referrers.js.

// URL() would silently swallow these rather than failing, e.g.
// new URL("http://example.com/oops/") yields hostname "example.com".
const FORBIDDEN = /[\s/\\?#@]/;
const LABEL = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/**
 * Expand an IPv6 textual address to 8 numeric hextets, or null if it isn't one.
 * Handles zone IDs, "::" compression and an embedded IPv4 tail.
 */
function parseIPv6(input) {
  let s = String(input).trim().toLowerCase();

  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  if (!s.includes(":")) return null;

  // Fold an embedded IPv4 tail (::ffff:127.0.0.1) into two hextets first, so
  // the rest of the parser only ever deals with hex groups.
  const v4 = s.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    const o = v4[2].split(".").map(Number);
    if (o.some((n) => n > 255)) return null;
    const hi = ((o[0] << 8) | o[1]).toString(16);
    const lo = ((o[2] << 8) | o[3]).toString(16);
    s = `${v4[1]}${hi}:${lo}`;
  }

  const halves = s.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 ? (halves[1] ? halves[1].split(":") : []) : null;

  let groups;
  if (tail === null) {
    if (head.length !== 8) return null;
    groups = head;
  } else {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null; // "::" must stand for at least one zero group
    groups = [...head, ...Array(fill).fill("0"), ...tail];
  }

  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

/** Render hextets in RFC 5952 form, so build errors are readable. */
function formatIPv6(nums) {
  let bestStart = -1;
  let bestLen = 0;
  let start = -1;

  for (let i = 0; i <= nums.length; i++) {
    if (i < nums.length && nums[i] === 0) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      if (i - start > bestLen) {
        bestStart = start;
        bestLen = i - start;
      }
      start = -1;
    }
  }

  const hex = nums.map((n) => n.toString(16));
  if (bestLen < 2) return hex.join(":");

  return `${hex.slice(0, bestStart).join(":")}::${hex.slice(bestStart + bestLen).join(":")}`;
}

/** Name the special-purpose range an IPv4 address falls in. */
function describeIPv4(o) {
  const [a, b, c] = o;
  if (a === 0) return 'unspecified / "this network" (RFC 1122)';
  if (a === 10) return "private (RFC 1918)";
  if (a === 127) return "loopback (RFC 1122)";
  if (a === 100 && b >= 64 && b <= 127) return "carrier-grade NAT (RFC 6598)";
  if (a === 169 && b === 254) return "link-local (RFC 3927)";
  if (a === 172 && b >= 16 && b <= 31) return "private (RFC 1918)";
  if (a === 192 && b === 0 && c === 0) return "IETF protocol assignments (RFC 6890)";
  if (a === 192 && b === 0 && c === 2) return "documentation TEST-NET-1 (RFC 5737)";
  if (a === 192 && b === 88 && c === 99) return "6to4 relay anycast (RFC 7526)";
  if (a === 192 && b === 168) return "private (RFC 1918)";
  if (a === 198 && (b === 18 || b === 19)) return "benchmarking (RFC 2544)";
  if (a === 198 && b === 51 && c === 100) return "documentation TEST-NET-2 (RFC 5737)";
  if (a === 203 && b === 0 && c === 113) return "documentation TEST-NET-3 (RFC 5737)";
  if (a >= 224 && a <= 239) return "multicast (RFC 5771)";
  if (o.every((n) => n === 255)) return "broadcast";
  if (a >= 240) return "reserved (RFC 1112)";
  return "public";
}

/** Name the special-purpose range an IPv6 address falls in. */
function describeIPv6(n) {
  if (n.every((h) => h === 0)) return "unspecified (::)";
  if (n.slice(0, 7).every((h) => h === 0) && n[7] === 1) return "loopback (::1)";
  if (n.slice(0, 5).every((h) => h === 0) && n[5] === 0xffff) return "IPv4-mapped (RFC 4291)";
  if (n[0] === 0x64 && n[1] === 0xff9b) return "NAT64 (RFC 6052)";
  if (n[0] === 0x100 && n.slice(1, 4).every((h) => h === 0)) return "discard-only (RFC 6666)";
  if (n[0] === 0x2001 && n[1] === 0x0db8) return "documentation (RFC 3849)";
  if (n[0] === 0x2002) return "6to4 (RFC 3056)";
  if ((n[0] & 0xfe00) === 0xfc00) return "unique local (RFC 4193)";
  if ((n[0] & 0xffc0) === 0xfe80) return "link-local (RFC 4291)";
  if ((n[0] & 0xff00) === 0xff00) return "multicast (RFC 4291)";
  return "global unicast";
}

/**
 * Classify one raw line from a list file.
 *
 * Returns { kind, canonical?, detail? }, kind being one of:
 *   "empty" | "domain" | "ipv4" | "ipv6" | "invalid"
 *
 * Only "domain" is ever allowed into the published list. IP literals are always
 * rejected — private and loopback ranges because a leaked RFC1918 address still
 * describes someone's network, and public ones because an address is never a
 * referrer worth attributing.
 *
 * allowSingleLabel is for deny patterns, which legitimately include bare
 * suffixes like "local" and "internal".
 */
function classifyEntry(raw, { allowSingleLabel = false } = {}) {
  const input = String(raw).trim();
  if (!input) return { kind: "empty" };

  // Bracketed IPv6, optionally with a port: [::1] or [fe80::1]:8123
  const bracketed = input.match(/^\[(.+?)\](?::(\d+))?$/);
  if (bracketed) {
    const nums = parseIPv6(bracketed[1]);
    return nums
      ? { kind: "ipv6", canonical: formatIPv6(nums), detail: describeIPv6(nums) }
      : { kind: "invalid", detail: "malformed bracketed address" };
  }

  // Bare IPv6 must be caught here: URL() throws on "::1" and "fe80::1", which
  // would otherwise surface as a vague parse failure instead of naming the range.
  if (input.includes(":")) {
    const nums = parseIPv6(input);
    if (nums) {
      return { kind: "ipv6", canonical: formatIPv6(nums), detail: describeIPv6(nums) };
    }
    if (/^[^:]+:\d+$/.test(input)) {
      return { kind: "invalid", detail: "port numbers are not allowed" };
    }
    return { kind: "invalid", detail: "stray ':' — entries are bare hostnames" };
  }

  if (FORBIDDEN.test(input)) {
    return {
      kind: "invalid",
      detail: "must be a bare hostname (no scheme, path, credentials or spaces)",
    };
  }

  // Let URL() canonicalise. This is what catches every obfuscated IPv4 form:
  // 2130706433, 0x7f000001, 017700000001, 127.1 and 0x7f.0.0.1 all normalise to
  // 127.0.0.1, and a bare "0" normalises to 0.0.0.0. No regex does that.
  let host;
  try {
    host = new URL(`http://${input.replace(/\.$/, "")}/`).hostname;
  } catch (err) {
    return { kind: "invalid", detail: "not a parseable hostname" };
  }
  if (!host) return { kind: "invalid", detail: "empty hostname" };

  const quad = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (quad) {
    const o = quad.slice(1).map(Number);
    return { kind: "ipv4", canonical: o.join("."), detail: describeIPv4(o) };
  }

  const labels = host.split(".");
  if (!allowSingleLabel && labels.length < 2) {
    return { kind: "invalid", detail: "single-label hostname" };
  }
  // Defence in depth: URL() already throws on an all-numeric final label,
  // because it tries to parse the whole thing as IPv4 and fails.
  if (/^\d+$/.test(labels[labels.length - 1])) {
    return { kind: "invalid", detail: "all-numeric TLD" };
  }
  for (const label of labels) {
    if (!LABEL.test(label)) {
      return { kind: "invalid", detail: `bad label "${label}"` };
    }
  }

  // Report any difference from the committed text, including case, so the file
  // always contains exactly what gets published.
  const detail = host === input ? null : `normalises to "${host}"`;
  return { kind: "domain", canonical: host, detail };
}

/** True if host equals suffix or is a subdomain of it. */
function suffixMatch(host, suffix) {
  return (
    host === suffix ||
    (host.length > suffix.length && host.slice(-(suffix.length + 1)) === `.${suffix}`)
  );
}

/** Split a list file into { lineNumber, raw } entries, dropping comments. */
function parseListFile(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ lineNumber: i + 1, raw: line.replace(/#.*$/, "").trim() }))
    .filter((entry) => entry.raw !== "");
}

/**
 * Validate and normalise the allowlist, given the raw text of
 * list/allowed-referrers.txt and list/deny-patterns.txt.
 *
 * Returns a deduplicated, sorted array of domains. Entries already covered by a
 * broader entry are pruned, so the shipped list has no lines the browser would
 * never reach. Throws with every problem listed if anything is wrong.
 */
function loadAllowedReferrers(allowFileText, denyFileText) {
  const problems = [];
  const notes = [];

  // Deny patterns are validated too: a typo here silently weakens the gate it
  // exists to enforce.
  const deny = [];
  for (const { lineNumber, raw } of parseListFile(denyFileText)) {
    const result = classifyEntry(raw, { allowSingleLabel: true });
    if (result.kind !== "domain") {
      const detail = result.detail ? ` — ${result.detail}` : "";
      problems.push(
        `list/deny-patterns.txt:${lineNumber}  "${raw}" is not a valid deny pattern (${result.kind})${detail}`,
      );
      continue;
    }
    deny.push(result.canonical);
  }

  const seen = new Map();
  for (const { lineNumber, raw } of parseListFile(allowFileText)) {
    const where = `list/allowed-referrers.txt:${lineNumber}`;
    const result = classifyEntry(raw);

    if (result.kind === "ipv4" || result.kind === "ipv6") {
      const family = result.kind === "ipv4" ? "IPv4" : "IPv6";
      problems.push(
        `${where}  "${raw}" is an ${family} address (${result.canonical} — ${result.detail}). ` +
          `Addresses are never valid referrers.`,
      );
      continue;
    }
    if (result.kind !== "domain") {
      const detail = result.detail ? ` — ${result.detail}` : "";
      problems.push(`${where}  "${raw}" is not a valid domain${detail}`);
      continue;
    }

    const host = result.canonical;

    const blocked = deny.find((pattern) => suffixMatch(host, pattern));
    if (blocked) {
      problems.push(
        `${where}  "${host}" matches deny pattern "${blocked}". Individuals get ` +
          `their own hostnames there, so allowing it would publish personal URLs.`,
      );
      continue;
    }

    if (seen.has(host)) {
      notes.push(`${where}  "${host}" duplicates line ${seen.get(host)}, ignoring`);
      continue;
    }
    if (result.detail) notes.push(`${where}  "${host}" ${result.detail}`);

    seen.set(host, lineNumber);
  }

  if (problems.length) {
    throw new Error(
      `\n\nRefusing to build — ${problems.length} invalid referrer list entr` +
        `${problems.length === 1 ? "y" : "ies"}:\n\n  ${problems.join("\n  ")}\n\n` +
        `See the comments at the top of list/allowed-referrers.txt.\n`,
    );
  }

  const hosts = [...seen.keys()];
  const published = hosts
    .filter((host) => {
      const covered = hosts.find((other) => other !== host && suffixMatch(host, other));
      if (covered) {
        notes.push(
          `list/allowed-referrers.txt  "${host}" is redundant — already covered by "${covered}", pruned`,
        );
      }
      return !covered;
    })
    .sort();

  for (const note of notes) console.warn(`[referrers] ${note}`);

  return published;
}

export {
  loadAllowedReferrers,
  classifyEntry,
  suffixMatch,
  parseListFile,
  parseIPv6,
  formatIPv6,
  describeIPv4,
  describeIPv6,
};
