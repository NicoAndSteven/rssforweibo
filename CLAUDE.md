# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Local dev server:** `npx vercel dev` (starts at http://localhost:3000)
- **Deploy to production:** `npx vercel --prod`
- **One-off deploy preview:** `npx vercel`
- **TypeScript check:** `npx tsc --noEmit`

## Architecture

RSSHub Vercel — a lightweight RSSHub deployment using Vercel Serverless Functions.

### Project structure

```
├── api/                    # Vercel Serverless Function handlers
│   ├── index.ts            # API root — returns route info
│   └── weibo/keyword/
│       └── [keyword].ts    # Dynamic route: /weibo/keyword/:keyword
├── lib/                    # Shared business logic
│   ├── config.ts           # Env vars (AUTH_CODE, WEIBO_COOKIE, etc.) + auth helpers
│   ├── rss.ts              # RSS/XML feed generation (wraps `rss` npm package)
│   └── weibo.ts            # Weibo mobile API scraping (axios + cheerio)
├── vercel.json             # URL rewrites (maps /weibo/keyword/:keyword → /api/weibo/keyword/:keyword)
└── tsconfig.json
```

### Key patterns

- **Route handlers** in `api/` export `(req: VercelRequest, res: VercelResponse) => void` following `@vercel/node` conventions
- **Dynamic params** use Vercel's bracket syntax: `[keyword].ts` → `req.query.keyword`
- **Auth** is centralized in `lib/config.ts` — `validateAuth()` checks Bearer token or `?code=` param against `AUTH_CODE` env var (skip auth when `AUTH_CODE` is unset)
- **New routes**: add a file under `api/` (use `[param].ts` for dynamic segments), add a rewrite to `vercel.json`, implement data fetching in `lib/`

### Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AUTH_CODE` | No | empty (public) | Access password via Bearer token or `?code=` query param |
| `WEIBO_COOKIE` | No | empty | Weibo cookie for higher rate limits |
| `MAX_ITEMS` | No | `20` | Max results per request |
| `REQUEST_TIMEOUT` | No | `8000` | HTTP request timeout in ms |
| `USER_AGENT` | No | iPhone UA string | HTTP User-Agent header |

### Vercel constraints

- Hobby plan: 10s function timeout (default request timeout is 8s to leave buffer)
- Functions are in the `api/` directory (root-level `package.json`)
- Cold starts are expected — first request after idle is slower
