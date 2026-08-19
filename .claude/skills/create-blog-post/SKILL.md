---
name: create-blog-post
description: Use this if the user wants to convert a blog post from Google Docs markdown to the format used in the Open Home Foundation website, or wants to publish an externally linked (crosspost) blog post that redirects to an article hosted on one of our other sites (Home Assistant, ESPHome, Music Assistant).
---

# Create Blog Post

Convert a draft markdown file into a properly formatted Open Home Foundation blog post.

There are two kinds of blog posts this skill handles:

- **Standard blog posts** — full content hosted on the Open Home Foundation website, converted from a Google Docs markdown draft. This is the default path, described in the sections below.
- **Externally linked (crosspost) blog posts** — a short teaser hosted here that redirects readers to an article on one of our other sites (for example, the Home Assistant, ESPHome, or Music Assistant blog). If the user asks to "crosspost", "publish an externally linked blog", "add an external blog post", or link out to an article on another OHF site, follow the [Externally linked (crosspost) blog posts](#externally-linked-crosspost-blog-posts) section instead.

## Usage

Place your draft blog post markdown file in the project root `create-blog-post/` directory, then run:

```shell
/create-blog-post
```

## What This Skill Does

Automates conversion of a draft markdown file with metadata into a production-ready Open Home Foundation blog post:

- Extracts metadata (blog title, author, publish date, category, Social/OpenGraph fields)
- Removes "# Blog notes/preparations" section and lines with ☝️ emoji
- Converts `### **– Summary break / Read more –**` to `<!--more-->`
- Processes card image (OG/social) and inline content images
- Converts external links to HTML `<a>` tags with `target="_blank"`
- Formats content (removes bold from headings, fixes link references)
- Creates properly formatted blog post in `src/content/blog/` with front matter

## Required Files in `create-blog-post/` Directory

1. **Draft markdown file** (any .md filename)
2. **`card.*`** - OG/social card image (any common image format: `.webp`, `.png`, `.jpg`, `.jpeg`). This image is used for social sharing only and is **not** shown inline in the blog content. If no `card.*` image is provided, fall back to the dynamic OG service (see the card image handling below) instead of blocking.
3. **`image1.*`, `image2.*`, etc.** - Inline content images (optional, any common image format). These are embedded in the blog content body.

## Draft File Format

```markdown
# Metadata

**Blog title:** Your Blog Title

**Author:** Author Name

**Publish date:** DD-MM-YYYY

**Category:** Category Name

**Social/OpenGraph title** (Usually same as the blog title, visibility mostly limited to 50-60 characters)**:**
A short title.

**Social/OpenGraph description** (120-158 characters):
Influences SEO ranking. Include the main keyword, describe what readers will find, and give them a clear reason to click.

# Blog notes/preparations

☝️ Any lines with the pointer emoji can be removed during processing

# Blog content

Your intro paragraph here...

### **– Summary break / Read more –**

Rest of content...
```

**Notes:**

- Content should begin with text, not an image. The card image is handled separately and is not placed in the content body.
- `![][image1]` through `![][imageN]` references in the content body correspond to `image1.*` through `imageN.*` files in `create-blog-post/`. They are replaced with inline `<img>` tags.
- URL slug is optional and will be auto-generated from the blog title if not provided in metadata
- Lines beginning with ☝️ emoji are instructions and will be removed during processing
- The `### **– Summary break / Read more –**` marker will be converted to `<!--more-->`

## Output

Creates a production-ready blog post at:

- `src/content/blog/slug.md` - The formatted blog post
- `public/assets/images/blog/slug/card.webp` - OG/social card image (moved from `create-blog-post/`)
- `public/assets/images/blog/slug/image1.webp`, `image2.webp`, etc. - Inline content images (converted from source format)

## Conversion Process

### 1. Pre-process Draft

Before doing anything else, strip out embedded base64 image data from the draft file using a shell command. **Do not read the draft file before this step** — the base64 data can make the file extremely large.

Google Docs markdown exports include image references like `![][image1]` in the content body, with corresponding base64 definitions at the bottom of the file in the format:

```text
[image1]: <data:image/png;base64,iVBORw0KGgo... (potentially megabytes of data)>
```

Run this `sed` command via the Bash tool to strip them in-place:

```shell
sed -i '/^\[image[0-9]*\]: <data:/d' "create-blog-post/draft.md"
```

- This removes all lines matching the base64 image definition pattern
- The `![][image1]` references in the content body are preserved — they will be replaced with proper image paths later
- Only after this command completes should you read the draft file

### 2. Parse Metadata

- Extract blog title, author, publish date, category, Social/OpenGraph title and description
- Auto-generate URL slug from blog title (lowercase, hyphens for spaces, remove special characters)
- Remove "# Blog notes/preparations" section and all content under it (up to "# Blog content")
- Remove all lines that start with ☝️ emoji (instruction lines)
- Convert `### **– Summary break / Read more –**` marker to `<!--more-->`

### 3. Process Images

Before processing images, ensure the `cwebp` tool is installed. If not, install it:

```shell
# Check if cwebp is available, install if missing
which cwebp || sudo apt-get install -y webp
```

**Card image (`card.*`):**

- Find the `card` image in `create-blog-post/` (any extension: `.webp`, `.png`, `.jpg`, `.jpeg`)
- If the source is already `.webp`, copy it to `public/assets/images/blog/slug/card.webp`
- If the source is any other format, convert to WebP: `cwebp -resize 1200 630 -q 85 input -o public/assets/images/blog/slug/card.webp`
- The card image must be exactly 1200x630 pixels — the source image should already be this size, so use `-resize 1200 630` to ensure correctness
- This image goes in the `card_image` front matter field only; it is **not** placed in the content body
- **No card image available?** If there is no `card.*` in `create-blog-post/`, do not block. Simply omit the `card_image` line — when it is absent the card falls back to `og_image`, which itself defaults to the dynamic OG service (see `ogImage()`/`cardImage()` in [src/lib/blog.ts](../../../src/lib/blog.ts)). If the user says they will supply the card image manually later, keep the standard local `card_image: /assets/images/blog/slug/card.webp` path so their file drops straight into place.

**Inline content images (if any):**

- Find `image1.*`, `image2.*`, `image3.*`, etc. in `create-blog-post/` (any extension: `.webp`, `.png`, `.jpg`, `.jpeg`)
- Convert to WebP with a max width of 900px: `cwebp -resize 900 0 -q 85 input -o output.webp` (the `0` for height preserves the aspect ratio)
- If the source is already `.webp`, still re-encode it with the resize: `cwebp -resize 900 0 -q 85 input.webp -o output.webp`
- Output to `public/assets/images/blog/slug/image1.webp`, `image2.webp`, etc.
- Replace each `![][imageN]` reference in the content with: `<img src="/assets/images/blog/slug/imageN.webp" alt="descriptive alt text" style="border: 0;box-shadow: none;">`
- CRITICAL: Use double quotes for all HTML attributes (prevents breaking on apostrophes in alt text)
- Write descriptive, meaningful alt text for each image based on context
- No wrapper tags (no `<p>` tag)

### 4. Transform Links

**External links** (different domains/subdomains):

- Convert to: `<a href="URL" target="_blank" rel="noopener noreferrer">text</a>`

**Internal links** (`www.openhomefoundation.org` only):

- Keep as Markdown links: `[text](/path)`

### 5. Clean Content

- **Headings**: Remove bold formatting (`## **Title**` → `## Title`)
- **Heading levels**: If content starts with H1 (`#`), demote all headings one level (content should start at H2)
- **Backticks**: Strip erroneous `\`` characters (preserve code blocks/inline code)
- **Text content**: Do not change the author's wording, phrasing, or writing style. The blog text should stay as-is. If you spot obvious typos or locale spelling issues (such as British English instead of American English), do not fix them silently — collect them and ask the user for confirmation before applying any changes.
- **Emojis**: Preserve all emojis that appear in the blog content. Do not strip them out.
- **Apostrophes**: All apostrophes in content and front matter must be curly/smart quotes (') not straight apostrophes ('). HTML entities like `&rsquo;` should also be converted to the curly character directly.

### 6. Build Blog Post

Create `src/content/blog/slug.md` with the following front matter:

```yaml
---
title: "Blog Title"
description: "Social/OpenGraph description"
card_image: /assets/images/blog/slug/card.webp
hide_header_image: true
date: YYYY-MM-DD
author: [author-slug]
category: "Category"
---
```

Do **not** set `og_image`: when it is omitted, the post automatically uses the dynamic OG service pointed at the post's own URL (computed at build time by `ogImage()` in `src/lib/blog.ts`).

When no `card.*` image is available (and the user is not supplying one manually), drop the `card_image` line too — the card then falls back to the same dynamic OG image:

```yaml
---
title: "Blog Title"
description: "Social/OpenGraph description"
hide_header_image: true
date: YYYY-MM-DD
author: [author-slug]
category: "Category"
---
```

Then the content:

- Intro paragraph(s)
- `<!--more-->` tag after first paragraph
- Remaining content (with inline images embedded where `![][imageN]` references appeared)

**Note**: The `card_image` and OG image are header/social fields only. Do not add a hero image to the content body.

## Example

1. Place in project root `create-blog-post/`:
   - `draft-partner-update.md` - Your draft file
   - `card.webp` - OG/social card image (1200x630)
   - `image1.png`, `image2.png` - Inline content images (if any)
2. Run `/create-blog-post`

This would create:

- `src/content/blog/partner-update.md`
- `public/assets/images/blog/partner-update/card.webp`
- `public/assets/images/blog/partner-update/image1.webp`, `image2.webp` (if inline images exist)

## Important Notes

**Image handling:**

- `card.*` → `card.webp` (1200x630, OG/social only, not shown in content)
- `image1.*` → `image1.webp` (max 900px wide, inline content image)
- `image2.*` → `image2.webp` (max 900px wide, inline content image)
- Source images can be any common format (`.webp`, `.png`, `.jpg`, `.jpeg`) — all are converted/re-encoded to `.webp`
- `![][imageN]` references in draft content → inline `<img>` tags pointing to `imageN.webp`

**Requirements:**

- `cwebp` tool is required — the skill will auto-install it via `sudo apt-get install -y webp` if not already present

**Front matter:**

- `card_image` points to `card.webp` (OG/social card image)
- If no `card.*` image is supplied, omit `card_image` — it falls back to `og_image`
- Omit `og_image` — it defaults to the dynamic OG image service at build time (`ogImage()` in `src/lib/blog.ts`)
- `hide_header_image: true` suppresses the default header image
- `category` is a plain string (not a YAML list)
- Date format in front matter: `YYYY-MM-DD`
- No `date_formatted` field

**Content processing:**

- Remove "# Blog notes/preparations" section entirely
- Remove all lines starting with ☝️ emoji (instruction lines)
- Convert `### **– Summary break / Read more –**` to `<!--more-->`
- Content starts with text, not an image

**Output format:**

- Filename: `slug.md` (no date prefix in filename)
- File location: `src/content/blog/`
- Image directory: `public/assets/images/blog/slug/` (served at `/assets/images/blog/slug/`)

**Link handling:**

- Only `www.openhomefoundation.org` stay as Markdown links
- All other domains/subdomains → HTML `<a>` tags with `target="_blank" rel="noopener noreferrer">`

## Externally linked (crosspost) blog posts

A crosspost is a short blog entry that does **not** host the full article. It shows a teaser and then redirects the reader to an article hosted on one of our other sites (Home Assistant, ESPHome, Music Assistant). Use this path when the user asks to publish an externally linked blog, add a crosspost, or link out to an article on another OHF site.

Unlike a standard blog post, a crosspost has **no draft file and no local images to process**:

- It uses the normal `post` layout. The page is built and indexed (it appears in the sitemap and the blog archive, and the card/feed links point at the OHF URL so the hit lands on our domain first — good for analytics), then a small JavaScript redirect sends visitors to the `external_url` on page load.
- The page sets its canonical URL to `external_url` (via the `post` layout), so search engines credit the original article.
- Comments stay off — crossposts simply omit `comments: true`.
- The Open Graph and card image can come from one of two sources, chosen with the user in the wizard: the dynamic OG service (`https://assets.openhomefoundation.org/opengraph?url=<external_url>`, which auto-updates — this is what an omitted `og_image` resolves to automatically when `external_url` is set), or the source article's own `og:image`. Never point them at the post's own URL.

### 1. Collect the details with a wizard

Before writing anything, gather the required details from the user with the ask-questions tool (`vscode_askQuestions`). Present them as a short wizard, pre-filling any values the user already provided. Ask for:

- **Title** — the blog post title. Sentence-style capitalization.
- **Source URL** — the link to the source article. First ask whether the user only has a preview URL so far (for example a Netlify deploy-preview like `https://deploy-preview-87--…netlify.app/blog/…`). A preview URL is fine for pulling details but must **not** be used as the final `external_url`. If they give a preview URL, work out the final published URL (usually the same path on the live domain, e.g. `https://www.home-assistant.io/blog/…`) and confirm it before continuing.
- **External source** — the name of the site hosting the article (for example, "Home Assistant", "ESPHome", "Music Assistant"). Shown as the source label.
- **Opening text** — the teaser paragraph shown before the reader is redirected. It ends with the `<!--more-->` tag. If the user has none ready, offer to draft a short teaser from the article for their review.
- **Description** — the Social/OpenGraph description (roughly 120–158 characters). Often a condensed version of the opening text.
- **Author** — must match a top-level key in `src/data/authors.yml`. Verify it exists; if not, tell the user it must be added first (name only is fine, like the standard-post path).
- **Publish date** — in `YYYY-MM-DD` format. Used for the filename slug context and the `date` field.
- **Category** — the blog category (for example, `Announcements`).
- **Social image** — ask the user which source to use for `og_image`/`card_image` (whatever they pick is used for both):
  - **Dynamic OG service (default)** — `https://assets.openhomefoundation.org/opengraph?url=<external_url>`. Generated automatically and auto-updates if the source article changes its share image. Simply omit `og_image`/`card_image` — a crosspost without them resolves to this URL at build time.
  - **Source article's og:image** — fetch the `<meta property="og:image">` from the source article and set that static URL directly. Good when the source already has a polished share image. Confirm the resolved URL with the user.
  - **Custom URL** — a specific image URL the user provides, used the same way as the source og:image (static value).

If a source URL is available, fetch it to pre-fill as many details as possible (title, description, opening paragraph, author, date). Confirm the collected values back to the user before creating the file.

### 2. Validate the details

- Verify the **author** exists as a top-level key in `src/data/authors.yml`. If missing, add it (name only) and flag that a GitHub handle/avatar can be added later, or ask the user to confirm.
- Verify the **external URL** starts with `https://` (the OG image endpoint only works over HTTPS).
- Make sure `external_url` is the final published URL, not a preview/deploy-preview link. The images are derived from it, so a preview URL would produce the wrong image.
- Generate the URL slug from the title (lowercase, hyphens for spaces, remove special characters), unless the user provides one or the source URL already has a clean slug in its path (prefer reusing that).

### 3. Build the crosspost

Create `src/content/blog/slug.md` with this front matter and body (no hero image, no `<img>` in the body). Use the `og_image`/`card_image` form that matches the image source chosen in the wizard.

**Option A — dynamic OG service** (omit the image fields; with `external_url` set they resolve to the OG service automatically):

```yaml
---
title: "Your crosspost title"
description: "Your Social/OpenGraph description."
external_url: "https://www.home-assistant.io/blog/full-article-url/"
external_source: "Home Assistant"
hide_header_image: true
date: YYYY-MM-DD
author: [author-slug]
category: "Category"
---
```

**Option B — source article's og:image or a custom URL** (static values):

```yaml
---
title: "Your crosspost title"
description: "Your Social/OpenGraph description."
external_url: "https://esphome.io/blog/full-article-url/"
external_source: "ESPHome"
og_image: "https://esphome.io/images/example-hero.png"
card_image: "https://esphome.io/images/example-hero.png"
hide_header_image: true
date: YYYY-MM-DD
author: [author-slug]
category: "Category"
---
```

Follow the chosen option with the body:

```markdown
Your opening teaser paragraph goes here, ending with the summary break tag.<!--more-->
```

Notes:

- Wrap `title`, `description`, `external_url`, and `external_source` in double quotes.
- `author` is a YAML list of slugs from `src/data/authors.yml` (not the display name), same as standard posts.
- The body is **only** the opening teaser paragraph followed immediately by `<!--more-->`. Do not add the full article text — the reader is redirected to the source.
- Do **not** set `comments: true`. The `post` layout adds the canonical tag and the instant JavaScript redirect whenever `external_url` is present.
- Use the `og_image`/`card_image` form matching the wizard choice: omitted fields for the OG service (Option A) or static URLs from the source `og:image`/custom URL (Option B).
- Apply the same prose rules as standard posts (curly apostrophes/quotes in body text, sentence-style capitalization for the title).

### 4. Crosspost summary

After creating the file, summarize for the user:

- The output file path.
- Title, external source, external URL, author (and whether verified in `src/data/authors.yml`), date, and category.
- The opening text and description used.
- Which social image source was used (dynamic OG service or the source `og:image`/custom URL), that the page is indexed and canonicalised to the source, and that visitors are redirected on load.

## Post-processing summary

After the blog post has been created, output a summary to the user covering:

**Metadata:**

- Title, author (and whether they were verified in `people.yml`), date, category

**Images:**

- Each source image, its original dimensions/format, and where it was output (with the conversion applied)

**Content transformations:**

- A bulleted list of every notable transformation applied, such as:
  - Sections/content removed (base64 data, blog template, notes, instruction lines)
  - Image references replaced
  - Summary break conversion
  - Device list replacement (if WWHA, including brand used and number of devices)
  - Link conversions (external to HTML, internal to relative markdown)
  - Quote/blockquote formatting
  - Heading changes (reformatted, promoted/demoted, bold removed)
  - Escape character cleanup

**Proposed text changes (requires user approval):**

- If any typos or locale spelling issues were spotted (such as British to American English), list each one and ask the user whether to apply them. Do not apply these changes until the user confirms.
