# OtakuVersus

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite 8.0.8](https://img.shields.io/badge/Vite-8.0.8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

OtakuVersus is a manga-styled anime guessing game with both singleplayer and real-time multiplayer modes.  
Players identify anime titles from scene images, earn points, and compete in rankings.

![Front page preview](docs/readme-images/front_page.png)

---

## Table of Contents

- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Product Highlights](#product-highlights)
- [Technical Decisions](#technical-decisions)
- [How to Add Anime (Contributor Workflow)](#how-to-add-anime-contributor-workflow)
- [Database Configuration](#database-configuration)
- [Migrate Supabase Postgres to Neon](#migrate-supabase-postgres-to-neon)
- [Architecture Notes](#architecture-notes)
- [Roadmap](#roadmap)

---

## Core Features

- ✅ JWT authentication (register, login, current user)
- ✅ Guest play support (no account required)
- ✅ Singleplayer sessions (score-based)
- ✅ Multiplayer matchmaking with shared rounds
- ✅ Pre-match countdown and synchronized round timer
- ✅ Result comparison vs opponent
- ✅ ELO ranking for multiplayer accounts
- ✅ Separate leaderboards:
- ✅ Singleplayer score leaderboard
- ✅ Multiplayer ELO leaderboard
- ✅ User match history with mode filtering
- ✅ Anime titles and scenes seeded into PostgreSQL via Prisma

---

## Tech Stack

### Frontend

- ⚛️ React 19
- 🔷 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🧭 React Router
- 📦 TanStack Query

### Backend

- 🟢 Node.js
- 🚏 Express
- 🔷 TypeScript
- 🔺 Prisma ORM
- 🐘 PostgreSQL

### Additional

- 🔐 JWT auth
- 🗂️ Storage abstraction layer (`noop` / Cloudinary / Supabase Storage)
- ▲ Frontend deploy-ready for Vercel
- 🚄 Backend deploy-ready for Railway/Render

---

## Project Structure

```text
OtakuVersus/
  client/
    src/
      api/
      app/
      components/
        game/
        ui/
      features/
        auth/
        game/
        history/
        leaderboard/
      layouts/
      pages/
      routes/
      styles/
      types/
      utils/
    public/
    .env.example
    package.json

  server/
    prisma/
      migrations/
      schema.prisma
      seed.ts
    src/
      app/
      config/
      lib/
      middleware/
      modules/
        auth/
        users/
        game/
        leaderboard/
        anime-scenes/
      storage/
      types/
      utils/
    .env.example
    package.json

  package.json
  README.md
```

---

## Product Highlights

- 🎮 End-to-end gameplay loop with persisted sessions and post-match breakdown.
- 🏆 Two ranking systems: score-based singleplayer and ELO-based multiplayer.
- 👤 Guest flow and authenticated flow coexisting in one codebase.
- 🧠 Server-authoritative multiplayer scoring and ELO calculation.
- 🎨 Manga-styled UI system kept consistent across pages and game states.

---

## Technical Decisions

- 🧩 Domain-oriented backend modules (`auth`, `game`, `leaderboard`, `users`, `anime-scenes`) for maintainability.
- 🗃 Prisma + PostgreSQL with migrations and seed data to keep schema/content reproducible.
- ⚡ TanStack Query for predictable async state, caching, and refetch patterns.
- 🧠 In-memory caching for external anime metadata to reduce API calls and improve response time.
- 🧱 Reusable UI primitives (`Button`, `Card`, `Modal`, `Loading`) to avoid style drift.

---

## How to Add Anime (Contributor Workflow)

This section describes how to add new anime content as part of an official release contribution.

### 1. Add scene assets

Put exactly 3 images per anime in:

- `client/public/images/scenes`

Use naming:

- `<Anime Title>_1.png`
- `<Anime Title>_2.png`
- `<Anime Title>_3.png`

Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`.

### 2. Update seed source of truth

Edit:

- `server/prisma/seed.ts`

Changes:

- Add title to `animeCatalog` or `additionalAnimeTitles`.
- Add scene entry to `scenes`:
  - `anime: '<Anime Title>'`
  - `difficulty: DifficultyLevel.EASY | MEDIUM | HARD`

Important:

- `anime` in `scenes` must exactly match image filename title.
- Keep enough unique anime for session generation.

### 3. Rebuild local dataset

```bash
npm run prisma:seed --workspace server
```

If schema changed:

```bash
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
```

### 4. Validate before PR

- Start app and play multiple sessions.
- Confirm title appears in round pool and answer suggestions.
- Confirm slider loads all 3 images for the added title.
- Confirm no seed/runtime errors in backend logs.

### 5. Include in release PR

Commit:

- new files in `client/public/images/scenes`
- `server/prisma/seed.ts` updates

In PR description include:

- list of added anime
- selected difficulty per anime
- quick gameplay proof (screenshots/video)

---

## Architecture Notes

- Domain-based Express modules keep backend features isolated and maintainable.
- Prisma schema is the single source of truth for data shape and relations.
- TanStack Query handles async state and cache on the frontend.
- Auth context keeps JWT flow simple and explicit.
- Multiplayer and ELO are implemented server-side to keep scoring authoritative.

---

## Database Configuration

The server uses Prisma with standard PostgreSQL connections:

- `DATABASE_URL` is the pooled runtime connection used by the API.
- `DIRECT_URL` is the direct connection used by Prisma Migrate and administrative commands.

For Neon, copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL`. Both connections must use SSL. Keep `JWT_SECRET` unchanged when changing database providers so existing access tokens remain valid.

## Migrate Supabase Postgres to Neon

The application does not use Supabase Auth. Registered accounts, bcrypt password hashes, guest accounts, and game history live in the Prisma-managed `public` schema and are migrated with the rest of the database.

### Prerequisites

- Create an empty Neon project in the same or a nearby region and, when possible, use the same PostgreSQL major version as Supabase.
- Install `pg_dump` and `pg_restore` and make them available in `PATH`.
- Use direct, non-pooled connection strings for both the source and target migration connections.
- Schedule a maintenance window and stop the API before the final dump so no writes occur during migration.

### Export and restore

From PowerShell at the repository root, set the two temporary migration variables. Do not commit either value:

```powershell
$env:SOURCE_DATABASE_URL = '<supabase-direct-connection-string>'
$env:TARGET_DATABASE_URL = '<neon-direct-connection-string>'
```

Run the migration script. The explicit switch is required because restore removes existing objects from the target `public` schema:

```powershell
& ".\server\scripts\migrate-supabase-to-neon.ps1" `
  -BackupPath "$env:TEMP\otakuversus-supabase.dump" `
  -ConfirmTargetReset
```

The script uses a custom-format dump and restores it with `--no-owner` and `--no-acl`, preventing Supabase-specific ownership and privileges from being copied to Neon.

### Verify before cutover

Keep the API stopped and compare all application record counts:

```powershell
npm run db:verify-migration --workspace server
```

The verification command reads `SOURCE_DATABASE_URL` and `TARGET_DATABASE_URL`. It compares users, registered and guest account totals, sessions, rounds, guesses, anime titles, and scenes.

Update the deployed server environment only after verification succeeds:

```text
DATABASE_URL=<neon-pooled-connection-string>
DIRECT_URL=<neon-direct-connection-string>
```

Do not change `JWT_SECRET` and do not run `prisma:seed`, because the seed deletes existing application data. Check migration state and then build the application:

```powershell
npm exec --workspace server -- prisma migrate status
npm run build
```

Before ending maintenance mode, verify login, registration, `/api/auth/me`, guest play, completed games, ELO, history, and leaderboards. Keep Supabase unchanged as a short-lived rollback database. If rollback is required after writes have been enabled on Neon, those new writes must be reconciled manually.

Supabase Storage is an optional, currently inactive provider and is not migrated by this database procedure. Neon does not provide object storage.

---

## Roadmap

- WebSocket/SSE multiplayer events instead of polling
- Admin scene management panel with upload/moderation workflow
- Background image optimization pipeline (format conversion + resizing)
- Seasonal multiplayer ladder with soft reset and reward tiers
- User profile avatars with upload + preset avatar pack
- In-game achievements and account progression badges
- Activate difficulty-based score multipliers for `EASY`, `MEDIUM`, and `HARD`

---

## License

This project is proprietary and licensed as **All Rights Reserved**.  
Commercial use is not permitted without explicit written permission.
