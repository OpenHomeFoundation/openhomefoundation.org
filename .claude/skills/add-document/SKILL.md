---
name: add-document
description: Use this when the user wants to add a new foundation document (PDF) to the website, or upload a new revision of an existing document. Enforces the document naming convention, dates files by their revision date, and handles revisions by replacing the old file, updating references, and adding a redirect.
---

# Add / Update Document

Add a new PDF document to the Open Home Foundation website, or publish a new
revision of an existing one, while enforcing the naming convention and keeping
old links working.

## Usage

Place the PDF file(s) in the project root `add-document/` directory, then run:

```shell
/add-document
```

Documents live in `src/assets/documents/` and are listed in `_data/documents.yml`.
The documents page ([src/documents.html](../../../src/documents.html)) renders
that data. `src/assets/documents/` is passed through to `/assets/documents/` by
the passthrough copy rule in [.eleventy.js](../../../.eleventy.js).

## Naming Convention

Every document file MUST follow this pattern:

```text
<slug>-<DD>-<mon>-<YYYY>.pdf
```

- **`<slug>`** — a stable, descriptive, kebab-case identifier for the document.
  It is lowercase, uses hyphens between words, and contains only `a-z`, `0-9`,
  and `-`. **No spaces, underscores, uppercase, or special characters** (this
  keeps URLs clean and avoids percent-encoding). The slug stays the **same**
  across every revision of the same document — only the date changes.
- **`<DD>`** — two-digit day of the month, zero-padded (e.g. `03`, `17`).
- **`<mon>`** — lowercase three-letter English month:
  `jan feb mar apr may jun jul aug sep oct nov dec`.
- **`<YYYY>`** — four-digit year.

The date is the document's **revision date** (when the document itself was last
revised), NOT the date it was uploaded to the site.

For documents that are inherently tied to a calendar/fiscal year (budgets,
annual reports, yearly donation tiers), include that year in the slug so each
year is a distinct document, then append the revision date:

```text
budget-2025-04-sep-2025.pdf          # the 2025 budget, revised 4 Sep 2025
budget-2026-23-jun-2026.pdf          # the 2026 budget, revised 23 Jun 2026
annual-report-2025-11-jun-2026.pdf   # the 2025 annual report, revised 11 Jun 2026
```

Examples of valid names:

```text
privacy-position-paper-29-oct-2025.pdf
working-group-resolution-policy-and-principles-17-dec-2025.pdf
it-policy-01-jul-2026.pdf
```

Links in `_data/documents.yml` point at `/assets/documents/<filename>` and,
because filenames contain no spaces or special characters, need **no**
URL-encoding.

## Determining the Revision Date

Determine the revision date in this order of preference:

1. **A date the user explicitly provides** for the revision.
2. **The PDF's own metadata.** Prefer the modification date over the creation
   date. `pdfinfo` is often not installed and cannot be relied on, so extract
   directly:

   ```shell
   # Document info dictionary (uncompressed PDFs):
   LC_ALL=C grep -aoE '/ModDate ?\(D:[0-9]{8}' "file.pdf" | head -1

   # XMP metadata (often present when the info dict is compressed):
   LC_ALL=C grep -aoE 'xmp:ModifyDate>[0-9]{4}-[0-9]{2}-[0-9]{2}' "file.pdf" | head -1
   ```

3. **A date already present in the source filename** (e.g. `..._17Dec2025.pdf`).
4. **As a last resort**, ask the user for the revision date. Do not silently
   guess a day when only a month/year is known.

Convert whatever you find into the `DD-mon-YYYY` format.

## Adding a New Document

1. Read the PDF(s) in `add-document/`.
2. Choose a `slug` (see the convention). Confirm it does not collide with an
   existing document by checking both `src/assets/documents/` and
   `_data/documents.yml`.
3. Determine the revision date and build the filename `<slug>-<DD>-<mon>-<YYYY>.pdf`.
4. Move the PDF to `src/assets/documents/<filename>` (lowercase the name; strip
   the original messy name entirely).
5. Add an entry to the appropriate section in `_data/documents.yml`:

   ```yaml
   - title: "Human Readable Title"
     description: "One-sentence description of the document." # optional, omit if the section already describes its items
     link: "/assets/documents/<filename>"
   ```

   Match the surrounding style: some sections give every document a
   `description`, others rely on the section-level description and omit it.

6. Build and verify (see Verification).
7. Empty the `add-document/` staging directory.

## Publishing a New Revision of an Existing Document

Use this flow when the incoming PDF replaces a document already on the site
(same `slug`).

1. Identify the `slug` of the existing document. Find the current file:

   ```shell
   ls src/assets/documents/ | grep '^<slug>-'
   ```

   Confirm the match against the `link:` in `_data/documents.yml`.

2. Determine the new revision date and build the new filename
   `<slug>-<newDD>-<newmon>-<newYYYY>.pdf`.
3. Move the incoming PDF to `src/assets/documents/<newfilename>`.
4. Update the matching `link:` in `_data/documents.yml` to point at the new file.
5. Add a permanent redirect from the OLD path to the NEW path in
   [src/\_redirects](../../../src/_redirects) so existing/bookmarked links keep
   working (Netlify-style, one per line):

   ```text
   /assets/documents/<slug>-<oldDD>-<oldmon>-<oldYYYY>.pdf /assets/documents/<slug>-<newDD>-<newmon>-<newYYYY>.pdf 301
   ```

   If a redirect line already exists whose **target** was the old file (i.e. an
   even older revision redirected to it), update that line's target to the new
   file too, so every historical URL points at the current revision.

6. Delete the old file:

   ```shell
   rm "src/assets/documents/<slug>-<oldDD>-<oldmon>-<oldYYYY>.pdf"
   ```

7. Make sure nothing else still references the old filename:

   ```shell
   grep -rn "<slug>-<oldDD>-<oldmon>-<oldYYYY>.pdf" src _data
   ```

   The only remaining reference should be the source side of the redirect line.

8. Build and verify (see Verification).
9. Empty the `add-document/` staging directory.

## Verification

After any change, rebuild and confirm every document link resolves to a file
that exists, and that the old revision (if any) is gone:

```shell
rm -rf dist && npx @11ty/eleventy 2>&1 | tail -3
# every link in the rendered page must exist on disk:
grep -o '/assets/documents/[^"]*' dist/documents/index.html | while read -r l; do
  [ -f "dist${l}" ] && echo "OK   $l" || echo "MISSING $l"
done
```

For a revision, also confirm the redirect line is present in `src/_redirects`
and that `dist/assets/documents/` no longer contains the old filename.

## Rules

- Never leave a document file with spaces, underscores, uppercase letters, or
  other special characters in its name — always normalise to the convention.
- Never change a document's `slug` between revisions; only the date changes.
- Never delete an old revision without first adding the old→new redirect and
  updating the reference in `_data/documents.yml`.
- Keep `_data/documents.yml` links un-encoded (the convention guarantees safe
  filenames).
