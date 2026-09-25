# Athletiq

Athletiq is a mobile-first sports performance app for daily training plans, progress tracking, and athlete coaching guidance.

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

- `artifacts/athletiq/src/App.tsx` — application routes, state, and feature interactions
- `artifacts/athletiq/src/data.ts` — seeded sports, drills, workouts, social, live, nutrition, and facility demo data
- `artifacts/athletiq/src/index.css` — Athletiq visual tokens and responsive styling
- `artifacts/athletiq/.replit-artifact/artifact.toml` — web artifact routing and workflow metadata

## Architecture decisions

- The first release is frontend-first and uses localStorage so the complete demo journey works without external services.
- External-service-dependent areas are explicitly labeled demo mode rather than implying real AI, sports scores, streaming, or bookings.
- Shared athlete state powers onboarding, home, training completion, goals, Rahul responses, profile editing, and social actions.
- The seeded content is intentionally broad enough to make the app feel alive while keeping the project simple to run.

## Product

- Demo auth and multi-step athlete onboarding
- Personalized home dashboard with daily focus, progress, goals, and recommendations
- Searchable training library with drills, workouts, bookmarks, active timer, completion summaries, and streak updates
- Progress charts, goals and roadmap milestones, nutrition guidance, achievements, social feed, demo live area, and profile settings
- Demo Rahul assistant with profile-aware predefined coaching responses

## User preferences

- Keep the project simple to build and run, with working demo behavior when paid APIs are unavailable.

## Gotchas

- Demo-only surfaces must stay clearly labeled until real providers are connected.
- App state is local to the browser; a future backend can replace the persistence layer without changing the main product surfaces.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
