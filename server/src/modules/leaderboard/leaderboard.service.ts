import { GameSessionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export async function getLeaderboard(limit = 25) {
  const rows = await prisma.gameSession.findMany({
    where: {
      status: GameSessionStatus.FINISHED
    },
    orderBy: [{ score: 'desc' }, { finishedAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      score: true,
      correctAnswers: true,
      totalRounds: true,
      finishedAt: true,
      user: {
        select: {
          nickname: true
        }
      }
    }
  });

  return rows.map((row, index) => ({
    position: index + 1,
    sessionId: row.id,
    nickname: row.user.nickname,
    score: row.score,
    correctAnswers: row.correctAnswers,
    totalRounds: row.totalRounds,
    playedAt: row.finishedAt?.toISOString() ?? null
  }));
}
