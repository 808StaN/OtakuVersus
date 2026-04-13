-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('SINGLEPLAYER', 'MULTIPLAYER');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "elo" INTEGER DEFAULT 1000;

-- AlterTable
ALTER TABLE "GameSession"
ADD COLUMN "mode" "GameMode" NOT NULL DEFAULT 'SINGLEPLAYER',
ADD COLUMN "eloDelta" INTEGER NOT NULL DEFAULT 0;

-- Backfill guest users created before ELO system
UPDATE "User"
SET "isGuest" = true,
    "elo" = NULL
WHERE "email" LIKE 'guest.%@otakuversus.local'
   OR "passwordHash" = '__guest_account__';

-- Ensure normal accounts always start from baseline ELO
UPDATE "User"
SET "elo" = 1000
WHERE "isGuest" = false
  AND "elo" IS NULL;

-- CreateIndex
CREATE INDEX "User_isGuest_elo_idx" ON "User"("isGuest", "elo");

-- CreateIndex
CREATE INDEX "GameSession_mode_status_score_idx" ON "GameSession"("mode", "status", "score");
