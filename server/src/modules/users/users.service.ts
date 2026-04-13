import { GameMode, GameSessionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

function computeRankFromAverageScore(avgScore: number): string {
  if (avgScore >= 520) return 'S-Rank Sensei';
  if (avgScore >= 420) return 'A-Rank Rival';
  if (avgScore >= 300) return 'B-Rank Scout';
  if (avgScore >= 180) return 'C-Rank Trainee';
  return 'D-Rank Rookie';
}

export async function getUserGameHistory(userId: string, limit = 20) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      elo: true
    }
  });

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
      mode: true,
      eloDelta: true,
      finishedAt: true,
      createdAt: true
    }
  });

  const historySessions = sessions.slice(0, limit);
  const singleSessions = sessions.filter((session) => session.mode === GameMode.SINGLEPLAYER);
  const multiplayerSessions = sessions.filter((session) => session.mode === GameMode.MULTIPLAYER);

  const totalSessions = sessions.length;
  const averageScore =
    totalSessions > 0 ? Math.round(sessions.reduce((sum, item) => sum + item.score, 0) / totalSessions) : 0;
  const bestScore = totalSessions > 0 ? Math.max(...sessions.map((session) => session.score)) : 0;
  const rank = computeRankFromAverageScore(averageScore);

  const singleAverageScore =
    singleSessions.length > 0
      ? Math.round(singleSessions.reduce((sum, item) => sum + item.score, 0) / singleSessions.length)
      : 0;
  const singleBestScore = singleSessions.length > 0 ? Math.max(...singleSessions.map((session) => session.score)) : 0;
  const singleAverageAccuracy =
    singleSessions.length > 0
      ? Number(
          (
            singleSessions.reduce(
              (sum, item) => sum + (item.correctAnswers / Math.max(item.totalRounds, 1)) * 100,
              0
            ) / singleSessions.length
          ).toFixed(1)
        )
      : 0;

  const multiplayerMatches = multiplayerSessions.length;
  const multiplayerWins = multiplayerSessions.filter((session) => session.eloDelta > 0).length;
  const multiplayerLosses = multiplayerSessions.filter((session) => session.eloDelta < 0).length;
  const multiplayerDraws = multiplayerSessions.filter((session) => session.eloDelta === 0).length;
  const multiplayerWinRatio =
    multiplayerMatches > 0 ? Number(((multiplayerWins / multiplayerMatches) * 100).toFixed(1)) : 0;
  const multiplayerLpChange = multiplayerSessions.reduce((sum, item) => sum + item.eloDelta, 0);
  const multiplayerBestLpGain =
    multiplayerSessions.length > 0 ? Math.max(...multiplayerSessions.map((session) => session.eloDelta)) : 0;
  const currentElo = user?.elo ?? 1000;
  let eloCursor = currentElo;
  let peakElo = currentElo;
  for (const match of multiplayerSessions) {
    const eloBeforeMatch = eloCursor - match.eloDelta;
    peakElo = Math.max(peakElo, eloBeforeMatch);
    eloCursor = eloBeforeMatch;
  }

  return {
    stats: {
      totalSessions,
      averageScore,
      bestScore,
      rank,
      singleplayer: {
        sessionsPlayed: singleSessions.length,
        averageScore: singleAverageScore,
        bestScore: singleBestScore,
        averageAccuracy: singleAverageAccuracy
      },
      multiplayer: {
        matchesPlayed: multiplayerMatches,
        wins: multiplayerWins,
        losses: multiplayerLosses,
        draws: multiplayerDraws,
        winRatio: multiplayerWinRatio,
        totalLpChange: multiplayerLpChange,
        bestLpGain: multiplayerBestLpGain,
        peakElo
      }
    },
    history: historySessions.map((session) => ({
      sessionId: session.id,
      score: session.score,
      correctAnswers: session.correctAnswers,
      totalRounds: session.totalRounds,
      mode: session.mode,
      eloDelta: session.eloDelta,
      accuracy: Number(((session.correctAnswers / session.totalRounds) * 100).toFixed(1)),
      playedAt: (session.finishedAt ?? session.createdAt).toISOString()
    }))
  };
}
