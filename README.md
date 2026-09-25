# dumbNavigator 3

Navegador web-first con espacios `dumb://` y estudio integrado **develope**. Las páginas creadas viven en IndexedDB y se pueden publicar con Pages Functions + D1.

Rutas: home, create/develope, projects, bookmarks, history, settings y dumb://<dominio>.

Cloudflare Pages: `npm run build` → `dist`. Configura una binding D1 llamada `DB` y aplica `migrations/0001_public_sites.sql`.