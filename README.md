# MatExpress

A marketplace where contractors and architects order construction materials from many hardware stores, check out once, and have them delivered to site.

Built with Next.js, Neon Postgres, Drizzle, Better Auth and Zustand.

## Getting started

1. Copy `.env.example` to `.env.local` and fill it in. You'll need a [Neon](https://neon.tech) database in Singapore.
2. Install, set up the database, and start:

```bash
npm install
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

The store is at [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the store while you work on it |
| `npm run build`, `npm start` | Builds it for production, and runs that build |
| `npm test` | Unit and component tests. Needs no database |
| `npm run test:e2e` | Browser tests, after a build: every page, a real order, accounts, accessibility, and the database failing |
| `npm run test:db` | The order code against a real database, with buyers racing for the last of the stock |
| `npm run lint` | Lint |
| `npm run check:links` | Finds broken links on a running server |
| `npm run check:deploy <url>` | Checks a deployed copy from the outside |
| `npm run db:generate`, `npm run db:migrate` | Writes a migration from `src/db/schema.ts`, and applies it |
| `npm run db:seed` | Fills an empty catalog with the sample data |

## Where things are written down

- [docs/deploying.md](docs/deploying.md): putting the demo online, checking it, and what to do when something goes wrong
- [docs/rendering-and-data.md](docs/rendering-and-data.md): how pages are served and use the database, and the rules for new code
- [SECURITY.md](SECURITY.md): what protects buyers, what isn't built yet, and the go-live checklist
- [docs/superpowers/plans/2026-11-01-store-pages.md](docs/superpowers/plans/2026-11-01-store-pages.md): what was built and why, and what's still sample data
- [AGENTS.md](AGENTS.md): this version of Next.js differs from older ones. Its guides are in `node_modules/next/dist/docs/`
