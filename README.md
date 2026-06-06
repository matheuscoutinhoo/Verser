# Verser

> The World-Aware Writing Studio for Series Fiction.

A web platform that combines deep worldbuilding with context-aware AI assistance — purpose-built for novelists, screenwriters, and worldbuilders working on long-form series.

## Why Verser

- **No context drift.** The AI knows your universe — characters, laws, lore — and respects it.
- **One tool, not five.** Worldbuilding + writing studio + AI co-pilot in a single workspace.
- **Voice-preserving suggestions.** Fragments, options, and questions — never bulk paragraphs.

## Stack

| Layer       | Tech                                                       |
| ----------- | ---------------------------------------------------------- |
| Frontend    | React 18, TypeScript (strict), Vite, Tailwind CSS, TipTap  |
| Backend     | Node.js, Express, TypeScript (strict)                      |
| Database    | SQLite (Prisma — Postgres-ready)                           |
| AI Provider | Abacus AI (text + image)                                   |
| Tests       | Jest, Supertest, Vitest, React Testing Library             |
| Auth        | bcrypt + JWT (access 15m + rotating refresh 7d, httpOnly) |

## Project Layout

```
project-root/
├── AGENTS.md            # Living source of truth — read first
├── packages/shared/     # Shared types, Zod schemas, constants
├── server/              # Express API (layered architecture)
├── client/              # React SPA
└── scripts/             # Setup, migration, test automation
```

See [AGENTS.md](AGENTS.md) for architecture, business rules, security checklist, and feature status.

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 10

### First-time setup

```bash
# Clone and enter
git clone <repo-url> verser && cd verser

# Install all workspace dependencies
npm install

# Copy env template and fill secrets
cp .env.example .env
cp .env.example server/.env

# Generate Prisma client + run migrations + seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Running locally

```bash
# Two terminals:
npm run dev:server   # API on http://localhost:3001
npm run dev:client   # Web on http://localhost:5173
```

### Testing

```bash
npm test                    # All workspaces
npm run test:server         # Server only (Jest + Supertest)
npm run test:client         # Client only (Vitest + RTL)
```

## Branching

`main` (prod) ← `release/*` ← `develop` ← `feature/*` | `bugfix/*` | `hotfix/*`

Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`.

## Security

All security requirements are tracked in [AGENTS.md § 6](AGENTS.md#6-requisitos-de-segurança). Found a vulnerability? Open a private issue — do **not** disclose publicly.

## License

Proprietary — all rights reserved.
