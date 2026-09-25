# dumbNavigator

dumbNavigator is a web browser shell + mini web studio built with React, Vite and WebContainer.

## Features

- Chrome/Safari/Opera-inspired tabs, toolbar and sidebar
- local `dumb://` domains for browser projects
- IndexedDB local workspace
- static HTML/CSS/JS preview
- React/Vite/Angular/Node projects through WebContainer
- GitHub public repository importer
- project library and bookmarks
- **public publishing** with persistent Cloudflare D1 storage
- public site URLs under `/sites/<domain>`
- publish/update/unpublish with a private per-domain publish token

## Public publishing

The local `dumb://` address is intentionally an app-only browser address. Publishing creates a real HTTPS URL such as:

`https://TU-PAGES-DOMAIN/sites/miweb.local`

Published files are stored server-side in Cloudflare D1, so they are no longer tied to the browser/device that created them.

### Cloudflare setup

Pages Functions require a D1 binding. Cloudflare documents D1 bindings for Pages Functions here:

- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/functions/routing/

1. Create a D1 database, for example `dumbnavigator`.
2. In **Cloudflare Pages → Settings → Functions → D1 database bindings**, add:
   - Variable name: `DB`
   - Database: your `dumbnavigator` database
3. Run `migrations/0001_public_sites.sql` against that database.
4. Redeploy the Pages project.
5. Open `dumb://develope.it`, create/import a site and press **↑ publicar**.

The repository intentionally does **not** contain a fake `database_id`; that ID belongs to the Cloudflare account. `wrangler.toml` documents the binding without inventing account-specific credentials.

### Published project limits

The D1-backed publisher accepts up to:

- 500 files
- 1.4 MB per file
- 8 MB total original file data

These limits keep individual D1 rows below Cloudflare's documented 2 MB row limit. Larger asset storage can later be moved to R2 without changing the public URL model.

### Ownership / updates

The first publish of a domain creates a random 256-bit publish token. Only the browser that receives that token can update or unpublish the domain. The token is kept in localStorage and is never returned by the public GET endpoint.

If you publish the same domain from another browser without its token, the server rejects the update instead of silently overwriting someone else's site.

## Cloudflare Pages

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 22

The `public/_headers` file supplies the COOP/COEP headers required by WebContainer.

## Local development

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
```

For Pages Functions + local D1 development, use Wrangler with the `DB` binding configured as documented by Cloudflare.
