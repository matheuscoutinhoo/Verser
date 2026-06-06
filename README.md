# Verser

> The World-Aware Writing Studio for Series Fiction.

A web platform that combines deep worldbuilding with context-aware AI assistance — purpose-built for novelists, screenwriters, and worldbuilders working on long-form series.

## Why Verser

- **No context drift.** The AI knows your universe — characters, laws, lore — and respects it.
- **One tool, not five.** Worldbuilding + writing studio + AI co-pilot in a single workspace.
- **Voice-preserving suggestions.** Fragments, options, and questions — never bulk paragraphs.

## Status

| Phase                                | State          |
| ------------------------------------ | -------------- |
| 1 — Foundation (auth, security)      | ✅ Complete    |
| 2 — Worldbuilding CRUDs              | ✅ Complete    |
| 3 — TipTap editor & versioning       | ✅ Complete    |
| 4 — Abacus AI integration            | ✅ Complete    |
| 5 — Polish, dashboard, mobile        | ✅ Complete    |

Always update this README when something changes setup, scripts, env vars, dependencies, or phase status (per AGENTS § 8).

## Stack

| Layer       | Tech                                                       |
| ----------- | ---------------------------------------------------------- |
| Frontend    | React 18, TypeScript (strict), Vite 7, Tailwind CSS, TipTap |
| Backend     | Node.js 20+, Express 4, TypeScript (strict 5.6.3)          |
| Database    | SQLite (Prisma — Postgres-ready)                           |
| AI Provider | Abacus AI (text + image) — configurable via env            |
| Tests       | Jest + Supertest (server), Vitest + RTL (client)           |
| Auth        | bcryptjs + JWT (access 15m + rotating refresh 7d, httpOnly)|

## Project Layout

```
project-root/
├── AGENTS.md            # Living source of truth — read first (local-only)
├── packages/shared/     # Shared types, Zod schemas, constants
├── server/              # Express API (layered architecture)
├── client/              # React SPA
└── scripts/             # Setup, migration, test automation
```

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 10

### First-time setup

```bash
# Clone and enter
git clone https://github.com/matheuscoutinhoo/Verser.git verser && cd verser

# Install all workspace dependencies (also builds @verser/shared on demand)
npm install

# Copy env templates and fill secrets
cp .env.example .env
cp .env.example server/.env

# Build the shared package (server + client need this on first run)
npm run build --workspace=@verser/shared

# Generate Prisma client + run migrations + seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Required environment variables (`server/.env`)

| Variable                  | Purpose                                              | Example                            |
| ------------------------- | ---------------------------------------------------- | ---------------------------------- |
| `NODE_ENV`                | `development` \| `test` \| `production`              | `development`                      |
| `PORT`                    | API port                                             | `3001`                             |
| `CLIENT_URL`              | CORS allow-list origin                               | `http://localhost:5173`            |
| `DATABASE_URL`            | Prisma connection string                             | `file:./dev.db`                    |
| `JWT_ACCESS_SECRET`       | ≥ 32 chars                                           | (random 64+ bytes)                 |
| `JWT_REFRESH_SECRET`      | ≥ 32 chars                                           | (random 64+ bytes)                 |
| `ABACUS_AI_API_KEY`       | Abacus AI credential (Phase 4)                       | _provided by user_                 |
| `ABACUS_AI_BASE_URL`      | API base URL                                         | `https://api.abacus.ai`            |
| `ABACUS_AI_TEXT_MODEL`    | Text model / deployment id                           | _provided by user_                 |
| `ABACUS_AI_IMAGE_MODEL`   | Image model / deployment id                          | _provided by user_                 |
| `UPLOAD_DIR`              | Local storage dir for image uploads                  | `./uploads`                        |
| `LOG_LEVEL`               | `fatal` \| `error` \| `warn` \| `info` \| `debug`    | `info`                             |

See `.env.example` for the full list.

### Running locally

```bash
# Two terminals:
npm run dev:server   # API on http://localhost:3001
npm run dev:client   # Web on http://localhost:5173
```

### Testing

```bash
npm run test:server         # Server (Jest + Supertest, 111 tests)
npm run test:client         # Client (Vitest + RTL, 27 tests)
```

The AI provider is auto-mocked in tests (`MockAIProvider`), so no real API key is required to run the suite.

## Branching

`main` (prod) ← `release/*` ← `develop` ← `feature/*` | `bugfix/*` | `hotfix/*`

Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`.

**Workflow rule:** every finished + tested feature is pushed to `develop` before the next one starts (AGENTS § 10).

## Security

All security requirements are tracked in [AGENTS.md § 6](AGENTS.md#6-requisitos-de-segurança). Found a vulnerability? Open a private issue — do **not** disclose publicly.

## License

Proprietary — all rights reserved.
