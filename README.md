# dumbNavigator

dumbNavigator is a web-only local browser + mini web studio built with React, Vite and WebContainer.

## Features

- Chrome/Safari/Opera-inspired tabs, toolbar and sidebar
- local `dumb://` domains
- IndexedDB project storage
- static HTML/CSS/JS preview
- React/Vite/Angular/Node projects through WebContainer
- GitHub public repository importer
- project library and bookmarks
- Cloudflare Pages compatible headers

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
