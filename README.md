# Advent of Kube

Kubernetes debugging challenges. Solve broken clusters, find flags, compete on the leaderboard.

## How It Works

1. Set up a local Kubernetes cluster with [kind](https://kind.sigs.k8s.io/)
2. Install the challenge Helm chart
3. Debug the cluster — diagnose and fix the issues
4. Find the flag and submit it

## Leaderboard Architecture

```mermaid
sequenceDiagram
    participant Browser
    participant CF as Cloudflare Pages
    participant Supabase

    Note over Browser,Supabase: Initial Page Load
    Browser->>CF: GET /api/config
    CF-->>Browser: {supabaseUrl, supabasePublishableKey}
    Browser->>Supabase: Initialize client with publishable key

    Note over Browser,Supabase: GitHub OAuth Login
    Browser->>Supabase: signInWithOAuth({provider: 'github'})
    Supabase-->>Browser: Redirect to GitHub
    Browser->>Supabase: GitHub callback with code
    Supabase-->>Browser: Session (access_token JWT)

    Note over Browser,Supabase: Flag Submission (logged in)
    Browser->>Browser: Hash flag, verify locally
    Browser->>CF: POST /submit-flag {day, flag, elapsed_ms, access_token}
    CF->>CF: Hash flag, compare to FLAG_HASHES
    CF->>Supabase: GET /auth/v1/user (apikey: secret, Bearer: access_token)
    Supabase-->>CF: {id: user_id}
    CF->>Supabase: POST /rest/v1/rpc/upsert_submission (apikey: secret)
    Supabase-->>CF: {elapsed_ms, improved}
    CF-->>Browser: {recorded: true, improved}

    Note over Browser,Supabase: Leaderboard Read
    Browser->>Supabase: SELECT from submissions + profiles (publishable key)
    Supabase-->>Browser: Leaderboard data (RLS: public read)
```

## Development

Static SPA deployed on Cloudflare Pages. No build step — vanilla JS modules.

### Environment Variables (Cloudflare Pages)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public key for browser client |
| `SUPABASE_SECRET_KEY` | Secret key for server-side functions (encrypt) |

### Project Structure

```
├── index.html              # SPA shell
├── css/style.css           # All styles
├── js/
│   ├── app.js              # Router + auth header
│   ├── router.js           # SPA router (History API)
│   ├── config.js           # Day definitions + flag hashes
│   ├── supabase.js         # Supabase client + auth helpers
│   ├── leaderboard.js      # Leaderboard widget
│   └── pages/
│       ├── landing.js      # Home page + calendar
│       ├── calendar.js     # Standalone calendar
│       └── day.js          # Challenge page
├── functions/              # Cloudflare Pages Functions
│   ├── api/config.js       # Serves public Supabase config
│   └── submit-flag.js      # Server-side flag validation
└── charts/                 # Helm charts for each day
    └── day00/, day01/, ...
```
