# AGENTS.md — MX1

## What this is
A static Arabic (RTL) frontend app: `index.html`, `chat.html`, `script.js`, `styles.css`, `public/`. No build step, no framework. The `cloudflare/` directory contains a Cloudflare Worker backend (separate deployment target, not run in the preview).

## Running in Base44
- Served by `nginx:alpine` via `docker-compose.base44.yml` on port 3000.
- Source is bind-mounted read-only at `/usr/share/nginx/html`.
- A custom `nginx.dev.conf` runs nginx as `root` because the repo directory has `drwx------` permissions (nginx worker is non-root by default).
- No external credentials needed — the frontend works in local mode when no API base is configured in Settings.

## Editing
- Changes to HTML/CSS/JS are served immediately by nginx (reads from disk per request). Call `reload_preview` to refresh the user's browser after edits.
- No live-reload/HMR — it's a static file server.

## Cloudflare Worker (`cloudflare/`)
- Uses `fflate`, Gemini AI, Supabase, OAuth (Google/GitHub). Deployed via `wrangler` to Cloudflare Workers, not part of the local preview.
- Env vars: `GEMINI_API_KEY`, `MX1_API_TOKEN`, `SESSION_SECRET`, `SUPABASE_*`, `GOOGLE_*`, `GITHUB_*`, `MX3_API_URL`, etc.
