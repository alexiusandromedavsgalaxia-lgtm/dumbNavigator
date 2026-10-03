# dumbNavigator

dumbNavigator is an experimental browser shell built around a local `dumb://` namespace and a family of conceptual web protocols.

## Protocol family

- `httc://` · HTTC, universal/common web
- `amwp://` · American Web Protocol
- `euwp://` · European Web Protocol
- `aswp://` · Asian Web Protocol
- `afwp://` · African Web Protocol
- `ocwp://` · Oceania Web Protocol

Regional and HTTC addresses are translated to HTTPS only when leaving the local browser shell.

## Storage

The existing public-site D1 schema is intentionally preserved:

- `sites`
- `site_files`

Local projects use IndexedDB in the browser.

## Develope

The rebuilt Develope studio can create HTML/CSS/JS files, preview them, save local projects and publish static projects through the existing D1-backed Pages Functions.

## Development

```bash
npm install
npm run build
```

The database migration is not replaced by the frontend rebuild.
