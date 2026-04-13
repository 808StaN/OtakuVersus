# OtakuVersus

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite 8.0.8](https://img.shields.io/badge/Vite-8.0.8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)

OtakuVersus is a fullstack anime guessing game inspired by GeoGuessr.  
Players analyze anime-inspired scene frames and type the anime title.

The project is structured as a complete, production-style app with:
- production-style folder structure,
- auth + game loop + rankings,
- singleplayer and multiplayer modes,
- ELO system for multiplayer,
- reusable UI components and responsive manga-styled interface.

## Core Features

- JWT authentication (register, login, current user)
- Guest play support (no account required)
- Singleplayer sessions (score-based)
- Multiplayer matchmaking with shared rounds
- Pre-match countdown and synchronized round timer
- Result comparison vs opponent
- ELO ranking for multiplayer accounts
- Separate leaderboards:
  - Singleplayer score leaderboard
  - Multiplayer ELO leaderboard
- User match history with mode filtering
- Anime titles and scenes seeded into PostgreSQL via Prisma

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

### Additional
- JWT auth
- Storage abstraction layer (`noop` / Cloudinary / Supabase Storage)
- Frontend deploy-ready for Vercel
- Backend deploy-ready for Railway/Render

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

## Data Model (Prisma)

Main models:
- `User`
- `GameSession`
- `Round`
- `Guess`
- `AnimeTitle`
- `Scene`

Key enums:
- `GameSessionStatus` (`ACTIVE`, `FINISHED`)
- `DifficultyLevel` (`EASY`, `MEDIUM`, `HARD`)
- `GameMode` (`SINGLEPLAYER`, `MULTIPLAYER`)

## API Endpoints

Base path: `/api`

### Health
- `GET /health`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Game
- `POST /game/start`
- `GET /game/session/:id`
- `POST /game/session/:id/answer`
- `POST /game/session/:id/finish`

### Multiplayer
- `POST /game/multiplayer/queue/join`
- `GET /game/multiplayer/queue/:ticketId`
- `GET /game/multiplayer/session/:id/status`
- `GET /game/multiplayer/session/:id/result`
- `GET /game/multiplayer/session/:id/round/:roundOrder/result`

### Leaderboards
- `GET /leaderboard` (singleplayer score ranking)
- `GET /leaderboard/elo` (multiplayer ELO ranking)

### User
- `GET /users/me/history`

### Scene/Metadata
- `GET /scenes/categories`
- `GET /scenes/difficulties`
- `GET /scenes/titles`

## Local Setup

## 1. Requirements
- Node.js 20+
- PostgreSQL 14+

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Copy and fill:
- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

Important variables:

- `server/.env`
  - `PORT`
  - `DATABASE_URL`
  - `DIRECT_URL` (recommended for Prisma migrations when using poolers)
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `CLIENT_URL`
  - `STORAGE_PROVIDER`

- `client/.env`
  - `VITE_API_URL` (default: `http://localhost:4000/api`)

## 4. Prisma setup

```bash
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
```

If you're using an existing remote DB and committed migrations:

```bash
npm run prisma:deploy --workspace server
```

## 5. Run app

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Useful Scripts

### Root
```bash
npm run dev
npm run build
npm run lint
```

### Server
```bash
npm run dev --workspace server
npm run build --workspace server
npm run lint --workspace server
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run prisma:deploy --workspace server
npm run prisma:seed --workspace server
```

### Client
```bash
npm run dev --workspace client
npm run build --workspace client
npm run lint --workspace client
npm run preview --workspace client
```

## Deployment Notes

### Frontend (Vercel)
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_URL`

### Backend (Railway / Render)
- Root directory: `server`
- Build command: `npm run build`
- Start command: `npm run start`
- Env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, optional storage vars

## Architecture Notes

- Domain-based Express modules keep backend features isolated and maintainable.
- Prisma schema is the single source of truth for data shape and relations.
- TanStack Query handles async state and cache on the frontend.
- Auth context keeps JWT flow simple and explicit.
- Multiplayer and ELO are implemented server-side to keep scoring authoritative.

## Roadmap

- WebSocket-based real-time multiplayer updates
- Ranked seasons and decay
- Admin panel for scene management
- Replay mode and per-round analytics
- More robust test coverage (unit/integration/e2e)
