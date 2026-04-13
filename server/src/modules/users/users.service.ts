import { GameSessionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

function computeRankFromAverageScore(avgScore: number): string {
  if (avgScore >= 520) return 'S-Rank Sensei';
  if (avgScore >= 420) return 'A-Rank Rival';
  if (avgScore >= 300) return 'B-Rank Scout';
  if (avgScore >= 180) return 'C-Rank Trainee';
  return 'D-Rank Rookie';
}

export async function getUserGameHistory(userId: string, limit = 20) {
  const sessions = await prisma.gameSession.findMany({
    where: {
      userId,
      status: GameSessionStatus.FINISHED
    },
    orderBy: {
      finishedAt: 'desc'
    },
    take: limit,
    select: {
      id: true,
      score: true,
      correctAnswers: true,
      totalRounds: true,
      finishedAt: true,
      createdAt: true
    }
  });

  const totalSessions = sessions.length;
  const averageScore =
    totalSessions > 0 ? Math.round(sessions.reduce((sum, item) => sum + item.score, 0) / totalSessions) : 0;
  const bestScore = totalSessions > 0 ? Math.max(...sessions.map((session) => session.score)) : 0;
  const rank = computeRankFromAverageScore(averageScore);

  return {
    stats: {
      totalSessions,
      averageScore,
      bestScore,
      rank
    },
    history: sessions.map((session) => ({
      sessionId: session.id,
      score: session.score,
      correctAnswers: session.correctAnswers,
      totalRounds: session.totalRounds,
      accuracy: Number(((session.correctAnswers / session.totalRounds) * 100).toFixed(1)),
      playedAt: (session.finishedAt ?? session.createdAt).toISOString()
    }))
  };
}
