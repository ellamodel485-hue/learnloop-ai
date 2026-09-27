# LearnLoop AI

LearnLoop AI helps students turn one learning question into a focused video lesson, concise flashcards, and a simple review loop.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/learnloop-ai/src/App.tsx` — single-route prototype and local learning-loop state
- `artifacts/learnloop-ai/src/index.css` — LearnLoop visual tokens, typography, motion, and responsive styling
- `artifacts/learnloop-ai/.replit-artifact/artifact.toml` — artifact routing and managed web workflow

## Architecture decisions

- The first build is frontend-only and uses realistic local demo content so the full student journey works without an external account or API.
- Video discovery is behind a `VideoSearchAdapter` interface; the current mock adapter can be replaced by an Oriane-backed implementation without changing the learning UI.
- Review progress is intentionally local to the active loop for the prototype; no auth or database is required to demonstrate the core behavior.

## Product

- Students enter a topic and search for educational video starting points.
- Students choose a video, review three key learning points, and mark the lesson as started.
- AI-style demo generation reveals four concise flashcards with answer reveal, “I know this,” and “I need to review this” actions.
- The progress rail and memory map update as cards are reviewed, ending in a completion state.

## User preferences

_None recorded._

## Gotchas

- Run the web artifact through its managed workflow so `PORT` and `BASE_PATH` are present.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
