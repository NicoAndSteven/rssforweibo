# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Local dev server:** `npx wrangler pages dev` (starts at http://8788)
- **Deploy to production:** `npx wrangler pages deploy`
- **TypeScript check:** `npx tsc --noEmit`

## Architecture

RSSHub Cloudflare — a lightweight RSSHub deployment using Cloudflare Pages Functions.

### Project structure

```
├── functions/               # Cloudflare Pages Functions handlers
│   ├── index.ts             # API root — returns route info
│   └── weibo/keyword/
│       └── [keyword].ts     # Dynamic route: /weibo/keyword/:keyword
├── lib/                     # Shared business logic
│   ├── config.ts            # Env vars + auth helpers (createConfig, validateAuth)
│   ├── rss.ts               # RSS/XML feed generation (manual XML, no dependencies)
│   └── weibo.ts             # Weibo mobile API scraping (fetch + regex)
├── public/                  # Static assets (empty, required by wrangler)
├── wrangler.toml            # Cloudflare Pages config
└── tsconfig.json
```

### Key patterns

- **Route handlers** in `functions/` export `onRequestGet: PagesFunction<Env>` following CF Pages Functions conventions
- **Dynamic params** use bracket syntax: `[keyword].ts` → `context.params.keyword`
- **Env vars** are accessed via `context.env` (typed as `Env` interface in each handler)
- **Auth** uses `createConfig(context.env)` then `validateAuth(token, config)` — supports Bearer token and `?code=` query param; skip auth when `AUTH_CODE` is unset
- **New routes**: add a file under `functions/` (use `[param].ts` for dynamic segments), implement data fetching in `lib/`

### Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AUTH_CODE` | No | empty (public) | Access password via Bearer token or `?code=` query param |
| `WEIBO_COOKIE` | No | empty | Weibo cookie for higher rate limits |
| `MAX_ITEMS` | No | `20` | Max results per request |
| `REQUEST_TIMEOUT` | No | `8000` | HTTP request timeout in ms |
| `USER_AGENT` | No | iPhone UA string | HTTP User-Agent header |

Set environment variables via Cloudflare Dashboard → Pages → Settings → Environment variables, or `wrangler secret put`.

### Cloudflare constraints

- Free plan: 10ms CPU time per request (network I/O doesn't count)
- Functions run on Cloudflare's global edge network
- No Node.js APIs — uses Web标准 APIs (fetch, Request, Response, URL)
