# Architecture — Dynamic Engineering System

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TypeScript 5 | RTL (Arabic), Tailwind CSS 4 |
| UI Components | shadcn/ui + Radix UI | CSS-first Tailwind config |
| Routing | Wouter 3 | Lightweight SPA routing |
| State / Data | TanStack Query v5 | Server state via REST hooks |
| Backend | Express 4 (Node.js) | Bundled with esbuild |
| ORM | Drizzle ORM | Type-safe schema definitions |
| Database | SQLite (better-sqlite3) | Single `.db` file, portable |
| Build | Vite 7 (client) + esbuild (server) | `pnpm build` outputs `dist/` |

## Directory Layout

```
dynamic-prototype/
├── client/
│   ├── index.html              # lang="ar" dir="rtl"
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Routes + provider tree
│       ├── index.css           # Tailwind 4 CSS-first theme tokens
│       ├── contexts/
│       │   └── ThemeContext.tsx
│       ├── components/         # Shared UI (DashboardLayout, dialogs, shadcn/ui)
│       ├── lib/
│       │   ├── api.ts          # All fetch + TanStack Query hooks
│       │   └── pdf.ts          # Print-based PDF export (window.open)
│       └── pages/              # One file per route
├── server/
│   ├── index.ts               # Express REST API (all routes)
│   └── db/
│       ├── index.ts           # Drizzle + SQLite init
│       ├── schema.ts          # Table definitions
│       └── seed.ts            # Initial data
└── dist/                      # Production build output
```

## API Layer Contract

All client–server communication goes through `client/src/lib/api.ts`. Rules:
- Every route is `/api/<resource>` (RESTful CRUD)
- TanStack Query wraps every call — no raw `fetch` in pages
- Mutations call `qc.invalidateQueries` on success to keep UI in sync

## Future Migration Path: Self-Hosted ERP on Synology NAS

### Phase 1 — Current (MVP)
- SQLite database, single Express process
- Run via `pnpm start` on any machine or Synology Docker

### Phase 2 — Docker on Synology
```
Synology NAS
└── Container Manager
    ├── nginx (reverse proxy, SSL via Let's Encrypt)
    ├── dynamic-app (this repo, Node 22 image)
    └── dynamic-db (PostgreSQL 16)
```
Migration steps:
1. Replace `better-sqlite3` with `postgres` driver
2. Update Drizzle config: `dialect: "postgresql"`
3. Adjust column types (SQLite `integer` → Postgres `serial`/`bigint`)
4. Add `DATABASE_URL` env var; remove file path config
5. Build Docker image from `Dockerfile` (to be created)
6. Point Synology Container Manager to `docker-compose.yml`

### Phase 3 — Full ERP Modules (Future)
- Redis for session caching and job queues
- Background workers (email, PDF generation, reminders)
- Multi-user auth (JWT or session-based)
- Role-based access control (RBAC)
- Mobile-responsive PWA or dedicated React Native app

## Key Decisions

| Decision | Reason |
|----------|--------|
| SQLite over PostgreSQL | Zero-config for single-office use; trivially portable |
| Monorepo (client + server together) | Simplifies deployment — one `dist/` directory |
| RTL-first design | Office language is Arabic; `dir="rtl"` at HTML root |
| Print-based PDF | Avoids html2canvas/jsPDF localtunnel iframe issues; uses browser renderer |
| Drizzle ORM | Lightweight, type-safe, easy migration to PostgreSQL |
