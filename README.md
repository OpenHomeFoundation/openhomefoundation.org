# Open Home Foundation website

This is the source of the Open Home Foundation website, built with [Astro](https://astro.build).

## Development

Requires Node.js (see `.nvmrc` for the version).

```shell
npm install
npm run dev      # start a dev server at http://localhost:4321
npm run build    # build the production site into dist/
npm run preview  # serve the built site locally
```

## Project layout

- `src/pages/` — one file per page (Astro pages, plus markdown papers)
- `src/content/blog/` — blog posts (markdown)
- `src/layouts/`, `src/components/` — shared templates
- `src/styles/`, `src/scripts/` — CSS and client-side JavaScript, bundled by Astro
- `src/data/` — YAML data (authors, documents, hardware press kits)
- `public/` — static files copied verbatim (documents, images, fonts, badges, redirects)
- `list/` — the Plausible referrer allowlist (validated on every build)

## Deployment

This website is automatically deployed with Cloudflare pages on each commit to the main branch.

## Badges
This repository also contains the badges for various projects and partners to use with permission. Below are examples of how these are to be used in a repository.

### Collaborator
[![A collaboration with the Open Home Foundation](./public/badges/ohf-collaboration.png)](https://www.openhomefoundation.org/)
```markdown
[![A collaboration with the Open Home Foundation](https://www.openhomefoundation.org/badges/ohf-collaboration.png)](https://www.openhomefoundation.org/)
```
### Library
[![A library from the Open Home Foundation](./public/badges/ohf-library.png)](https://www.openhomefoundation.org/)
```markdown
[![A library from the Open Home Foundation](https://www.openhomefoundation.org/badges/ohf-library.png)](https://www.openhomefoundation.org/)
```
### Open Standard
[![An open standard from the Open Home Foundation](./public/badges/ohf-open-standard.png)](https://www.openhomefoundation.org/)
```markdown
[![An open standard from the Open Home Foundation](https://www.openhomefoundation.org/badges/ohf-open-standard.png)](https://www.openhomefoundation.org/)
```
### Project
[![A project from the Open Home Foundation](./public/badges/ohf-project.png)](https://www.openhomefoundation.org/)
```markdown
[![A project from the Open Home Foundation](https://www.openhomefoundation.org/badges/ohf-project.png)](https://www.openhomefoundation.org/)
```
