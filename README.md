# Form Builder (Next.js)

Web UI for the **EZ Form Builder** Nest API: create forms, questions, publish, view responses, and share public links.

## Prerequisites

- Node.js 18+
- API running (default `http://localhost:3000`) — see `../ez-form-builder-api`

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens the Next app (default port **3001** if 3000 is taken). Browser requests to `/api/v1/...` are proxied to the API via `next.config.ts` (`API_PROXY_TARGET`, default `http://localhost:3000`).

## Production build

```bash
npm run build
npm start
```

## Main routes

| Path | Purpose |
|------|--------|
| `/` | My forms (signed in) |
| `/login`, `/register` | Auth |
| `/forms/new` | Create form |
| `/forms/[id]` | Editor |
| `/f/[id]` | Public respondent view |

## Related

- Backend: [`../ez-form-builder-api`](../ez-form-builder-api)
# form-builder-frontend
