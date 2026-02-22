# Advent of Kube

Kubernetes debugging challenge platform — 25 progressive days of broken clusters to fix.

## Stack

- Frontend: Vanilla JS SPA (no build step), Cloudflare Pages
- Backend: Cloudflare Pages Functions, Supabase (auth + DB)
- Challenges: Helm charts (`charts/dayNN/`) + Go container images (`images/dayNN/`)
- CI/CD: GitHub Actions → GHCR (images + OCI Helm charts)

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
The project backend currently maps connections between user-ids and completion time through an SQL db hosted on supabase. This is pretty brittle and is expected to likely change if the usage picks up significantly
Each commit should have a bulleted list of updates being made.
Ideally, the average user should take about 5-10 minutes to find the issue for lower level problems, while later puzzles should increase the scope of complexity to maybe 30-45 minutes.

Beginner Days: 5-10 minutes
Intermediate Days: 15-25 minutes
Expert Days: 30-45 minutes

