# OneAtlas — AI Model Discovery & Intelligence Platform

An MVP that helps developers, AI engineers and researchers **discover, explore,
compare and evaluate AI models across providers** — pricing, context windows,
capabilities, benchmarks, labs and providers in one place.

Built as the demo task for The AI Signal's AI Software Engineer Internship
(Full Stack Developer role). Live product name: **OneAtlas**
(https://oneatlas.dev/ is the product's home; this repo is the MVP build).

## What it does

1. **Model discovery & search** — browse and search models; filter by lab,
   model type, capability, modality and open-weights status; sort by price,
   context window or release date. Global search across models, labs and
   providers from the header.
2. **Model detail pages** — overview, input/output pricing, context window,
   modalities, capabilities, available providers and benchmark scores.
3. **Model comparison** — side-by-side comparison (up to 4 models) of pricing,
   context length, capabilities and benchmark scores. Shareable URL
   (`/compare?models=gpt-5,claude-sonnet-4-5`).
4. **Rankings & benchmarks** — leaderboards per benchmark, filterable by
   benchmark category (general / reasoning / coding / math).
5. **AI labs & provider directory** — browse labs and providers, see their
   models and releases.
6. **Product experience** — clean navigation, global search, responsive
   layouts, consistent listing/detail pages.

## Tech stack (mandatory, as specified in the task)

| Layer    | Choice                                                   |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, TailwindCSS v4  |
| Backend  | Node.js + TypeScript via Next.js API Routes              |
| Database | PostgreSQL + Prisma ORM                                  |
| Deploy   | Vercel (app) + Neon (Postgres) — see below               |

References studied (not replicated): OpenRouter, RouterPlus, LiteLLM.

## Architecture

```
Browser ──► Next.js App Router (React Server Components)
                │  ├─ Pages: /, /models, /models/[slug], /compare,
                │  │         /rankings, /labs, /labs/[slug],
                │  │         /providers, /providers/[slug]
                │  └─ Client islands: SearchBar, CompareTray,
                │                     CompareButton, SortSelect
                ▼
           API Routes (/api/*) — Next.js Route Handlers
                │  /api/models, /api/models/[slug], /api/search,
                │  /api/rankings, /api/labs[/slug], /api/providers[/slug],
                │  /api/compare
                ▼
           Prisma Client (singleton, lib/prisma.ts)
                ▼
           PostgreSQL (Neon in production, local Postgres in dev)
```

**Data flow (the important rule):** all application data lives in PostgreSQL
and is read through Prisma — either directly in Server Components or via the
`/api/*` routes for client components. Nothing is hardcoded in the frontend.
The seed (`prisma/seed.ts` + `prisma/seed-data.ts`) is the only place data is
defined, and it writes to the database. The compare list is the one exception:
it is UI state only (a list of model slugs in `localStorage`), and the
comparison data itself still comes from the database.

**Why this shape:**
- App Router + Server Components: pages render from the DB on the server, so
  listings are fast, SEO-friendly and need no client-side fetching for the
  initial view.
- API Routes as the backend: every client interaction (global search, compare
  data) goes through a typed Route Handler — the same layer a mobile app or
  third party would use.
- Prisma: typed queries, migrations via `db push`, and a seed script that is
  idempotent (safe to re-run).

## Run it locally

Prerequisites: Node.js 20+, PostgreSQL 16+ running locally.

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure the database
cp .env.example .env
# .env: DATABASE_URL="postgresql://oneatlas:oneatlas@localhost:5432/oneatlas?schema=public"

# 3. Create the database (once)
createdb oneatlas          # or: psql -c "CREATE DATABASE oneatlas;"

# 4. Create tables and seed realistic data (25 models, 8 labs, 11 providers, 5 benchmarks)
npx prisma db push
npm run db:seed

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

Production build check: `npm run build` then `npm start`.

Useful: `npm run db:studio` opens Prisma Studio to inspect the data.

**If `npm install` fails in the `@prisma/engines` postinstall** with
`ECONNRESET` (a flaky network while downloading the Prisma engine binaries):
just re-run `npm install` — the download usually succeeds on a retry. If it
keeps failing, install packages without scripts first and run the postinstall
by hand once the network is stable:

```bash
npm install --ignore-scripts
npx prisma generate   # downloads the engines if they are missing
```

## Deploy (Vercel + Neon)

No live URL is deployed from this repo yet — deployment needs a Vercel/Neon
account, which is a manual step for the owner. Exact steps:

1. **Neon (database):** create a free project at https://neon.tech → copy the
   connection string (`postgresql://<user>:<password>@<host>/<db>?sslmode=require`).
2. **Push the repo to GitHub** (see below) and import it in Vercel
   (https://vercel.com/new) — framework preset: Next.js.
3. **Environment variable in Vercel:** `DATABASE_URL` = the Neon connection
   string. No other secrets are needed.
4. **Deploy.** After the first deploy, run the schema + seed once against Neon:
   ```bash
   DATABASE_URL="<neon-connection-string>" npx prisma db push
   DATABASE_URL="<neon-connection-string>" npm run db:seed
   ```
   (Or run `npx prisma db push` + `npm run db:seed` from your machine with
   `DATABASE_URL` set to Neon.)
5. The live URL is then the Vercel domain (e.g. `https://oneatlas-<….vercel.app`).
   A custom domain (`oneatlas.dev`) can be attached in Vercel → Domains.

## Publish the repo to GitHub

```bash
git init
git add .
git commit -m "OneAtlas MVP — AI model discovery platform"
gh repo create oneatlas --public --source=. --remote=origin --push
# …or, if you prefer the web UI:
# create an empty public repo on github.com, then:
#   git remote add origin https://github.com/<you>/oneatlas.git
#   git branch -M main
#   git push -u origin main
```

## Data notes (read this before judging the data)

- **Pricing / context windows** are public list prices as of November 2026,
  taken from provider pricing pages and the OpenRouter public model API
  (checked 20 Nov 2026). Prices change — confirm on the provider's own
  pricing page. Two models are marked `deprecated` because their APIs are
  sunsetting (GPT-5: Dec 11, 2026; Gemini 2.5 Pro: Dec 1, 2026) and are kept
  for historical comparison.
- **Benchmark scores are included ONLY where a public source publishes them**
  (official model card / technical report — the `source` field on each score
  says which). Everything else is `null` and shown as "—" / "Not verified".
  No score was invented. If a model has no verified score for a benchmark, it
  simply doesn't appear on that leaderboard.
- **Release dates** are the public announcement dates; a few are approximate
  to the month.
- **Providers** list where a model can actually be called (first-party API,
  cloud, or aggregator). Hosted prices vary by provider — the stored price is
  the first-party list price.

## Technical decisions

- **PostgreSQL + Prisma, not a JSON file:** the task requires data through
  the DB and APIs, so models/labs/providers/benchmarks are relational tables
  with proper relations (Model ↔ Provider is a join table; scores are a join
  table with a `verified` flag).
- **Server Components for pages, Route Handlers for clients:** the fastest
  correct split — pages get data on the server; the search box and compare
  flow use the API so the same endpoints are reusable.
- **Compare state in localStorage, not the DB:** a comparison is ephemeral UI
  state, not user data. The shareable `/compare?models=…` URL makes a
  comparison linkable without an account.
- **No external model APIs at runtime:** the MVP reads from its own seeded
  database. A sync job (e.g. a cron hitting the OpenRouter models API) is the
  obvious next step and is deliberately left out of the MVP scope.
- **No AI-generated code platforms** were used (no Lovable / Bolt / Base44 /
  Replit AI / Firebase Studio / Google AI Studio). Hand-written Next.js +
  Prisma, assisted by an AI coding agent whose output the candidate reviewed
  and understands.

## Video walkthrough (for the submission)

A 5–10 minute video (Loom, or a screen recording uploaded to Google Drive —
the form accepts a Drive link). Suggested outline:

1. **(0:00–1:00) What OneAtlas is** — the problem: model choice is scattered
   across provider pages; OneAtlas puts pricing, context, capabilities and
   benchmarks in one place. Quick tour of the home page.
2. **(1:00–3:00) Features** — search a model, filter/sort the browse page,
   open a detail page (specs, providers, benchmarks), add models to compare
   and show the side-by-side table, open a rankings leaderboard, browse a lab
   and a provider.
3. **(3:00–6:00) Architecture** — Next.js App Router + Server Components,
   API Routes as the backend, Prisma + PostgreSQL; show the schema and the
   seed data; explain the rule that all data flows through the DB/APIs and
   nothing is hardcoded in the frontend.
4. **(6:00–8:00) Technical decisions** — why this stack; how the compare
   list works (localStorage + shareable URL); how benchmark scores are handled
   (verified-only, null otherwise); deploy shape (Vercel + Neon).
5. **(8:00–end) Challenges** — what was hard (e.g. keeping seeded pricing
   honest, the deprecated-model edge case, making comparison shareable, and
   getting Prisma's engine binaries to download on a flaky network — plus two
   real bugs caught by end-to-end verification: a sort prop passed to the
   wrong object, and a function passed to a client component) and what you'd
   do next (live price sync from OpenRouter, user accounts, more benchmarks).

Note: Loom's free plan caps recordings at 5 minutes — if the video runs
longer than that, record with another tool and upload to Google Drive instead.

## Submission

Form: https://forms.gle/oDQ6ucjpiFaZtCGL9 — needs three links: **Live URL**,
**GitHub repository**, **Loom video (5–10 min)**. Role: pick
**Role 3 → Full Stack Developer**. Deadline: Monday 23 Nov 2026, 7:00 PM IST.

## Project structure

```
app/                    # Next.js App Router
  page.tsx              # Home: hero, newest models, benchmark spotlight, labs
  models/               # Browse (filter/sort/paginate) + [slug] detail
  compare/              # Side-by-side comparison (?models=a,b,c)
  rankings/             # Benchmark leaderboards
  labs/ providers/      # Directories + detail pages
  api/                  # Backend: models, search, rankings, labs, providers, compare
components/             # SearchBar, CompareTray, CompareButton, ModelCard, SortSelect, CompareLoader
lib/                    # prisma.ts (singleton), queries.ts (shared filters), format.ts, compare.ts, types.ts
prisma/
  schema.prisma         # PostgreSQL schema (Lab, Provider, Model, ModelProvider, Benchmark, ModelBenchmark)
  seed-data.ts          # Realistic seed data (grounded pricing/specs; verified benchmark scores only)
  seed.ts               # Idempotent seed runner
```

## Known limitations

- Live URL is not deployed yet — it needs a Vercel + Neon account (steps
  above). The app is deploy-ready.
- Benchmark coverage is partial by design: only publicly verified scores are
  stored; most frontier models have no verified public score for these
  benchmarks, so leaderboards are short. That is honest data, not missing
  work.
- No authentication, no user accounts, no live price sync — out of MVP scope.
- Prices are a Nov 2026 snapshot, not live.
