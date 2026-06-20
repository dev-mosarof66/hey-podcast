# Hey Podcast — Backend

TypeScript REST API built with **Express**, **TypeORM**, and **NeonDB** (serverless Postgres).

## Stack

- **Express 4** — HTTP server / routing
- **TypeORM 0.3** — ORM with decorator-based entities + migrations
- **NeonDB** — serverless Postgres (`pg` driver, SSL required)
- **TypeScript 5** — strict mode

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment. Copy `.env.example` to `.env` and paste your Neon
   connection string (from the [Neon console](https://console.neon.tech)):

   ```bash
   cp .env.example .env
   ```

   ```env
   DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

3. Run in development (auto-reload):

   ```bash
   npm run dev
   ```

   The server starts on `http://localhost:4000`. Verify with
   `GET /api/health`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check without emitting |
| `npm run migration:generate -- src/migrations/<Name>` | Generate a migration from entity changes |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert the last migration |

> In development, `DB_SYNCHRONIZE=true` auto-creates tables from entities.
> For production, set it to `false` and use migrations.

## Project structure

```
src/
├── config/
│   └── env.ts            # env var loading + validation
├── controllers/
│   └── podcast.controller.ts
├── entities/
│   ├── Podcast.ts
│   └── Episode.ts
├── middleware/
│   └── error-handler.ts
├── routes/
│   ├── index.ts          # mounts feature routers + /health
│   └── podcast.routes.ts
├── app.ts                # Express app assembly
├── data-source.ts        # TypeORM DataSource (NeonDB)
└── index.ts              # bootstrap (DB connect + listen)
```

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/podcasts` | List podcasts |
| POST | `/api/podcasts` | Create a podcast |
| GET | `/api/podcasts/:id` | Get a podcast with its episodes |
| PATCH | `/api/podcasts/:id` | Update a podcast |
| DELETE | `/api/podcasts/:id` | Delete a podcast |
