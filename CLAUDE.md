# Advent of Kube

Kubernetes debugging challenge platform — 25 progressive days of broken clusters to fix.

## Stack

- Frontend: Vanilla JS SPA (no build step), Cloudflare Pages
- Backend: Cloudflare Pages Functions + D1 (SQLite), self-hosted GitHub OAuth
- Challenges: Helm charts (`charts/dayNN/`) + Go container images (`images/dayNN/`)
- CI/CD: GitHub Actions → GHCR (images + OCI Helm charts)

## Backend Architecture

Auth and the leaderboard are entirely on Cloudflare (no third-party service to pause).

- **Auth**: GitHub OAuth implemented in Pages Functions (`functions/auth/{login,callback,logout,me}.js`)
  with a signed session cookie (HMAC-SHA256, `functions/_lib/session.js`, `SESSION_SECRET`).
- **DB**: Cloudflare D1, bound as `env.DB` (`wrangler.toml`). Schema in `migrations/`.
  Tables: `profiles` (GitHub identity), `submissions` (fastest time per user/day).
- **Endpoints**: `POST /submit-flag` (verifies flag hash + session, upserts fastest time),
  `GET /api/leaderboard`, `GET /api/me/submissions`, `DELETE /api/submissions/:day`.
- **Client**: `js/api.js` talks to those endpoints (cookie-based; replaced the old Supabase client).
- **Env vars** (Pages): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`. Local dev uses
  `.dev.vars` + `wrangler pages dev`; D1 migrations via `npm run migrate:local|remote`.

## Challenge Structure

Each day has 3 components:
1. **Helm chart** in `charts/dayNN/` — bugs are embedded in `values.yaml`, not templates
2. **Container image** in `images/dayNN/` — Go app, multi-stage Docker build to `scratch`
3. **Flag hash** (SHA-256 hex) in `js/config.js` and `functions/submit-flag.js`

Flags follow the format `AOK{...}`. Users fix the cluster, find the flag, submit via web UI.

## Commands

```bash
# Local cluster
kind create cluster --name adventofkube

# Install a challenge
helm install dayNN oci://ghcr.io/adventofkube/charts/dayNN --version 0.2.0

# CI builds automatically on push to images/ or charts/
# Manual trigger: workflow_dispatch with target (e.g. "day05", "all-images")
```

## Project Conventions & Preferences

This project relies on testing each chart manually to validate that it breaks as expected, and can be fixed as expected.
The project backend maps GitHub user-ids to completion times in a Cloudflare D1 database (migrated off Supabase, which kept pausing on the free tier). See the Backend Architecture section above.
Each commit should have a bulleted list of updates being made.
Ideally, the average user should take about 5-10 minutes to find the issue for lower level problems, while later puzzles should increase the scope of complexity to maybe 30-45 minutes.

Beginner Days: 5-10 minutes
Intermediate Days: 15-25 minutes
Expert Days: 30-45 minutes

