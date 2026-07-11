import { PrismaClient } from '@prisma/client';

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error('Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL before running this script.');
  process.exit(1);
}

if (sourceUrl === targetUrl) {
  console.error('Source and target database URLs must be different.');
  process.exit(1);
}

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const target = new PrismaClient({ datasourceUrl: targetUrl });

type DatabaseSummary = {
  users: number;
  registeredUsers: number;
  guestUsers: number;
  gameSessions: number;
  rounds: number;
  guesses: number;
  animeTitles: number;
  scenes: number;
};

async function summarize(client: PrismaClient): Promise<DatabaseSummary> {
  const [
    users,
    registeredUsers,
    guestUsers,
    gameSessions,
    rounds,
    guesses,
    animeTitles,
    scenes
  ] = await Promise.all([
    client.user.count(),
    client.user.count({ where: { isGuest: false } }),
    client.user.count({ where: { isGuest: true } }),
    client.gameSession.count(),
    client.round.count(),
    client.guess.count(),
    client.animeTitle.count(),
    client.scene.count()
  ]);

  return {
    users,
    registeredUsers,
    guestUsers,
    gameSessions,
    rounds,
    guesses,
    animeTitles,
    scenes
  };
}

async function main() {
  const [sourceSummary, targetSummary] = await Promise.all([
    summarize(source),
    summarize(target)
  ]);

  console.table(
    Object.keys(sourceSummary).map((name) => ({
      table: name,
      source: sourceSummary[name as keyof DatabaseSummary],
      target: targetSummary[name as keyof DatabaseSummary]
    }))
  );

  const mismatches = Object.keys(sourceSummary).filter((name) => {
    const key = name as keyof DatabaseSummary;
    return sourceSummary[key] !== targetSummary[key];
  });

  if (mismatches.length > 0) {
    throw new Error(`Migration verification failed for: ${mismatches.join(', ')}`);
  }

  console.log('Migration verification passed. All application record counts match.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  });
