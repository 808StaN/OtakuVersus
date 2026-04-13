import { env } from './config/env';
import { prisma } from './lib/prisma';
import { createApp } from './app/create-app';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`OtakuVersus API listening on http://localhost:${env.PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
