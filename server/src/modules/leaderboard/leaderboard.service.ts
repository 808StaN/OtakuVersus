import { GameMode, GameSessionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export async function getSingleplayerLeaderboard(limit = 25) {
  const rows = await prisma.gameSession.findMany({
    where: {
      status: GameSessionStatus.FINISHED,
      mode: GameMode.SINGLEPLAYER,
      user: {
        isGuest: false
      }
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

export async function getEloLeaderboard(limit = 25) {
  const rows = await prisma.user.findMany({
    where: {
      isGuest: false,
      elo: {
        not: null
      }
    },
    orderBy: [{ elo: 'desc' }, { updatedAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      nickname: true,
      elo: true,
      updatedAt: true,
      gameSessions: {
        where: {
          status: GameSessionStatus.FINISHED,
          mode: GameMode.MULTIPLAYER
        },
        orderBy: {
          finishedAt: 'desc'
        },
        select: {
          finishedAt: true,
          eloDelta: true
        }
      },
      _count: {
        select: {
          gameSessions: {
            where: {
              status: GameSessionStatus.FINISHED,
              mode: GameMode.MULTIPLAYER
            }
          }
        }
      }
    }
  });

  return rows.map((row, index) => {
    const matchesPlayed = row._count.gameSessions;
    const wins = row.gameSessions.filter((session) => session.eloDelta > 0).length;
    const winRatio = matchesPlayed > 0 ? Number(((wins / matchesPlayed) * 100).toFixed(1)) : 0;

    return {
      position: index + 1,
      userId: row.id,
      nickname: row.nickname,
      elo: row.elo ?? 0,
      matchesPlayed,
      winRatio,
      playedAt: row.gameSessions[0]?.finishedAt?.toISOString() ?? null
    };
  });
}
