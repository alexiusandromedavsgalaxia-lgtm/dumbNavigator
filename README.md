# dumbNavigator

Web-only browser project built with React and Vite.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Vite writes the production site to `dist/`.

## Cloudflare Pages

This repository is prepared for a direct **Cloudflare Pages** deployment. GitHub Actions is not the deployment mechanism.

Use these Pages settings:

- **Root directory:** `/`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 22

The project also includes `.nvmrc` and a Node engine requirement so the build uses a modern Node 22 runtime.

No Android or desktop build is required. The repository is web-only.
