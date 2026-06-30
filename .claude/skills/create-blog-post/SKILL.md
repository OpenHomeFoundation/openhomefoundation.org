---
name: create-blog-post
description: Use this if the user wants to convert a blog post from Google Docs markdown to the format used in the Open Home Foundation website.
---

# Create Blog Post

Convert a draft markdown file into a properly formatted Open Home Foundation blog post.

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
- Creates properly formatted blog post in `src/blog/` with front matter

## Required Files in `create-blog-post/` Directory

1. **Draft markdown file** (any .md filename)
2. **`card.*`** - OG/social card image (required, any common image format: `.webp`, `.png`, `.jpg`, `.jpeg`). This image is used for social sharing only and is **not** shown inline in the blog content.
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

- `src/blog/slug.md` - The formatted blog post
- `src/assets/images/blog/slug/card.webp` - OG/social card image (moved from `create-blog-post/`)
- `src/assets/images/blog/slug/image1.webp`, `image2.webp`, etc. - Inline content images (converted from source format)

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
- If the source is already `.webp`, copy it to `src/assets/images/blog/slug/card.webp`
- If the source is any other format, convert to WebP: `cwebp -resize 1200 630 -q 85 input -o src/assets/images/blog/slug/card.webp`
- The card image must be exactly 1200x630 pixels — the source image should already be this size, so use `-resize 1200 630` to ensure correctness
- This image goes in the `card_image` front matter field only; it is **not** placed in the content body

**Inline content images (if any):**

- Find `image1.*`, `image2.*`, `image3.*`, etc. in `create-blog-post/` (any extension: `.webp`, `.png`, `.jpg`, `.jpeg`)
- Convert to WebP with a max width of 900px: `cwebp -resize 900 0 -q 85 input -o output.webp` (the `0` for height preserves the aspect ratio)
- If the source is already `.webp`, still re-encode it with the resize: `cwebp -resize 900 0 -q 85 input.webp -o output.webp`
- Output to `src/assets/images/blog/slug/image1.webp`, `image2.webp`, etc.
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

Create `src/blog/slug.md` with the following front matter:

```yaml
---
layout: post
title: "Blog Title"
description: "Social/OpenGraph description"
card_image: /assets/images/blog/slug/card.webp
eleventyComputed:
  og_image: "https://assets.openhomefoundation.org/opengraph?url=https://www.openhomefoundation.org{{ page.url }}"
hide_header_image: true
date: YYYY-MM-DD
author: "Author Name"
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

- `src/blog/partner-update.md`
- `src/assets/images/blog/partner-update/card.webp`
- `src/assets/images/blog/partner-update/image1.webp`, `image2.webp` (if inline images exist)

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
- `og_image` is dynamically generated via `eleventyComputed` using the OG image service
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
- File location: `src/blog/`
- Image directory: `src/assets/images/blog/slug/`

**Link handling:**

- Only `www.openhomefoundation.org` stay as Markdown links
- All other domains/subdomains → HTML `<a>` tags with `target="_blank" rel="noopener noreferrer">`

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
