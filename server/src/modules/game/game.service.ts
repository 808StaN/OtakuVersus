import { GameSessionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';

type StartSessionInput = {
  userId?: string;
  guestId?: string;
  roundsCount?: number;
};

type AnswerInput = {
  userId?: string;
  guestId?: string;
  sessionId: string;
  selectedAnswer: string;
  responseTimeMs?: number;
};

type MatchmakingJoinInput = {
  userId?: string;
  guestId?: string;
  roundsCount?: number;
  displayName?: string;
};

type MatchPlayerState = {
  sessionId: string;
  userId: string;
  participantKey: string;
  nickname: string;
  finishedSummary?: {
    score: number;
    correctAnswers: number;
    totalRounds: number;
  };
};

type MultiplayerMatchState = {
  id: string;
  players: [MatchPlayerState, MatchPlayerState];
  lockedRoundsBySession: Record<string, Set<number>>;
  roundTimers: Record<
    number,
    {
      startedAtMs: number;
      durationMs: number;
      shortened: boolean;
    }
  >;
};

type AnimeMeta = {
  year: number | null;
  genres: string[];
};

const GUEST_NICKNAME = 'Guest';
const GUEST_PASSWORD_HASH = '__guest_account__';
const MULTIPLAYER_ROUND_TIME_MS = 30_000;
const MULTIPLAYER_START_COUNTDOWN_MS = 3_000;
const MIN_MULTIPLAYER_REMAINING_MS = 1_000;
const animeMetaCache = new Map<string, AnimeMeta | null>();
const multiplayerMatches = new Map<string, MultiplayerMatchState>();
const sessionToMatchId = new Map<string, string>();
const multiplayerQueue: Array<{
  ticketId: string;
  userId: string;
  participantKey: string;
  displayName: string;
  roundsCount: number;
}> = [];
const queueStatus = new Map<
  string,
  | { status: 'waiting' }
  | { status: 'matched'; sessionId: string; opponentNickname: string }
>();

function sanitizeGuestId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

function buildGuestPlayerName() {
  return `Player ${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildParticipantKey(userId: string | undefined, guestId: string | undefined) {
  if (!userId) {
    const guestKey = sanitizeGuestId(guestId ?? '') || 'public';
    return `guest:${guestKey}`;
  }

  const clientKey = sanitizeGuestId(guestId ?? '') || 'auth';
  return `user:${userId}:${clientKey}`;
}

function getMatchBySessionId(sessionId: string) {
  const matchId = sessionToMatchId.get(sessionId);
  if (!matchId) return null;
  return multiplayerMatches.get(matchId) ?? null;
}

function getOpponentState(match: MultiplayerMatchState, sessionId: string) {
  return match.players[0].sessionId === sessionId ? match.players[1] : match.players[0];
}

function getTimerRemainingMs(timer: { startedAtMs: number; durationMs: number }) {
  const now = Date.now();
  if (now < timer.startedAtMs) {
    return timer.durationMs;
  }
  const elapsed = now - timer.startedAtMs;
  return Math.max(0, timer.durationMs - elapsed);
}

function ensureMatchRoundTimer(match: MultiplayerMatchState, roundOrder: number) {
  if (!match.roundTimers[roundOrder]) {
    match.roundTimers[roundOrder] = {
      startedAtMs: Date.now(),
      durationMs: MULTIPLAYER_ROUND_TIME_MS,
      shortened: false
    };
  }

  return match.roundTimers[roundOrder];
}

async function resolveMultiplayerRoundTimeout(match: MultiplayerMatchState, roundOrder: number) {
  const timer = match.roundTimers[roundOrder];
  if (!timer) return false;
  if (getTimerRemainingMs(timer) > 0) return false;

  const [sessionAId, sessionBId] = match.players.map((player) => player.sessionId);
  const [sessionA, sessionB] = await prisma.gameSession.findMany({
    where: {
      id: {
        in: [sessionAId, sessionBId]
      }
    },
    select: {
      id: true,
      userId: true,
      totalRounds: true,
      currentRoundIndex: true
    }
  });

  const sessions = [sessionA, sessionB].filter(Boolean);
  if (sessions.length === 0) return false;

  const totalRounds = sessions[0].totalRounds;
  if (roundOrder > totalRounds) return false;

  await prisma.$transaction(async (tx) => {
    for (const session of sessions) {
      const round = await tx.round.findFirst({
        where: {
          sessionId: session.id,
          order: roundOrder
        },
        include: {
          guess: true
        }
      });

      if (!round || round.guess) {
        continue;
      }

      await tx.guess.create({
        data: {
          sessionId: session.id,
          roundId: round.id,
          userId: session.userId,
          selectedOption: 'TIMEOUT',
          isCorrect: false,
          responseTimeMs: MULTIPLAYER_ROUND_TIME_MS,
          pointsAwarded: 0
        }
      });

      await tx.round.update({
        where: {
          id: round.id
        },
        data: {
          isAnswered: true
        }
      });
    }

    await tx.gameSession.updateMany({
      where: {
        id: {
          in: sessions.map((session) => session.id)
        },
        currentRoundIndex: roundOrder
      },
      data: {
        currentRoundIndex: {
          increment: 1
        }
      }
    });
  });

  match.lockedRoundsBySession[sessionAId]?.add(roundOrder);
  match.lockedRoundsBySession[sessionBId]?.add(roundOrder);

  const nextRound = roundOrder + 1;
  if (nextRound <= totalRounds) {
    match.roundTimers[nextRound] = {
      startedAtMs: Date.now(),
      durationMs: MULTIPLAYER_ROUND_TIME_MS,
      shortened: false
    };
  }

  return true;
}

async function registerMultiplayerRoundLock(sessionId: string, roundOrder: number) {
  const match = getMatchBySessionId(sessionId);
  if (!match) return;
  const lockSet = match.lockedRoundsBySession[sessionId];
  if (!lockSet) return;
  lockSet.add(roundOrder);

  const timer = ensureMatchRoundTimer(match, roundOrder);
  const opponent = getOpponentState(match, sessionId);
  const opponentLocks = match.lockedRoundsBySession[opponent.sessionId] ?? new Set<number>();
  const opponentAnswered = opponentLocks.has(roundOrder);

  if (!opponentAnswered && !timer.shortened) {
    const elapsed = Date.now() - timer.startedAtMs;
    const remaining = Math.max(0, timer.durationMs - elapsed);
    const halvedRemaining = Math.max(MIN_MULTIPLAYER_REMAINING_MS, Math.ceil(remaining / 2));
    timer.durationMs = elapsed + halvedRemaining;
    timer.shortened = true;
    return;
  }

  if (!opponentAnswered) {
    return;
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      totalRounds: true
    }
  });

  if (!session) {
    return;
  }

  const nextRound = roundOrder + 1;
  if (nextRound <= session.totalRounds) {
    match.roundTimers[nextRound] = {
      startedAtMs: Date.now(),
      durationMs: MULTIPLAYER_ROUND_TIME_MS,
      shortened: false
    };
  }
}

function registerMultiplayerFinish(
  sessionId: string,
  summary: { score: number; correctAnswers: number; totalRounds: number }
) {
  const match = getMatchBySessionId(sessionId);
  if (!match) return;
  const player = match.players.find((entry) => entry.sessionId === sessionId);
  if (!player) return;
  player.finishedSummary = summary;
}

async function resolveSessionUserId(userId?: string, guestId?: string) {
  if (userId) {
    return userId;
  }

  const guestKey = sanitizeGuestId(guestId ?? '');
  const fallbackKey = guestKey || 'public';
  const guestEmail = `guest.${fallbackKey}@otakuversus.local`;

  const existingGuest = await prisma.user.findUnique({
    where: {
      email: guestEmail
    },
    select: {
      id: true
    }
  });

  if (existingGuest) {
    return existingGuest.id;
  }

  const nicknameCandidate = `${GUEST_NICKNAME}-${fallbackKey.slice(0, 6)}`;

  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      nickname: nicknameCandidate,
      passwordHash: GUEST_PASSWORD_HASH
    },
    select: {
      id: true
    }
  });

  return guest.id;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function calcTimeBonus(responseTimeMs?: number): number {
  if (!responseTimeMs) {
    return 0;
  }

  return Math.max(0, 50 - Math.floor(responseTimeMs / 300));
}

function parseSceneImages(imageUrl: string) {
  const parts = imageUrl
    .split('||')
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [imageUrl];
}

async function getAnimeMeta(animeTitle: string): Promise<AnimeMeta | null> {
  const key = animeTitle.trim().toLowerCase();
  if (animeMetaCache.has(key)) {
    return animeMetaCache.get(key) ?? null;
  }

  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1&sfw=true`
    );

    if (!response.ok) {
      animeMetaCache.set(key, null);
      return null;
    }

    const payload = (await response.json()) as {
      data?: Array<{
        year?: number | null;
        aired?: { from?: string | null };
        genres?: Array<{ name?: string | null }>;
        themes?: Array<{ name?: string | null }>;
        demographics?: Array<{ name?: string | null }>;
      }>;
    };

    const first = payload.data?.[0];
    if (!first) {
      animeMetaCache.set(key, null);
      return null;
    }

    const parsedYear =
      first.year ??
      (first.aired?.from
        ? Number(first.aired.from.slice(0, 4))
        : null);

    const tags = [...(first.genres ?? []), ...(first.themes ?? []), ...(first.demographics ?? [])]
      .map((item) => item.name?.trim() ?? '')
      .filter(Boolean);

    const uniqueTags = [...new Set(tags)].slice(0, 4);

    const meta: AnimeMeta = {
      year: Number.isFinite(parsedYear as number) ? (parsedYear as number) : null,
      genres: uniqueTags
    };

    animeMetaCache.set(key, meta);
    return meta;
  } catch (_error) {
    animeMetaCache.set(key, null);
    return null;
  }
}

async function buildPublicRound(round: {
  id: string;
  order: number;
  scene: {
    imageUrl: string;
    difficulty: string;
    animeTitle: {
      name: string;
    };
  };
}) {
  const animeMeta = await getAnimeMeta(round.scene.animeTitle.name);
  const imageUrls = parseSceneImages(round.scene.imageUrl);

  return {
    id: round.id,
    order: round.order,
    imageUrl: imageUrls[0],
    imageUrls,
    difficulty: round.scene.difficulty,
    animeMeta
  };
}

async function buildUniqueSceneSelection(roundsCount: number) {
  const scenePool = await prisma.scene.findMany({
    select: {
      id: true,
      animeTitle: {
        select: {
          name: true
        }
      }
    }
  });

  if (scenePool.length < roundsCount) {
    throw new ApiError(400, `Need at least ${roundsCount} scenes in dataset`);
  }

  const uniqueByAnime = new Map<string, (typeof scenePool)[number]>();
  for (const scene of shuffle(scenePool)) {
    if (!uniqueByAnime.has(scene.animeTitle.name)) {
      uniqueByAnime.set(scene.animeTitle.name, scene);
    }
  }

  const uniqueScenes = [...uniqueByAnime.values()];

  if (uniqueScenes.length < roundsCount) {
    throw new ApiError(400, `Need at least ${roundsCount} unique anime scenes in dataset`);
  }

  return uniqueScenes.slice(0, roundsCount);
}

async function createSessionFromSelectedScenes(
  userId: string,
  selectedScenes: Array<{ id: string; animeTitle: { name: string } }>
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({
      data: {
        userId,
        totalRounds: selectedScenes.length,
        currentRoundIndex: 1,
        status: GameSessionStatus.ACTIVE
      }
    });

    for (let i = 0; i < selectedScenes.length; i += 1) {
      const scene = selectedScenes[i];
      await tx.round.create({
        data: {
          sessionId: session.id,
          sceneId: scene.id,
          order: i + 1,
          correctAnswer: scene.animeTitle.name
        }
      });
    }

    return session;
  });
}

export async function startGameSession(input: StartSessionInput) {
  const userId = await resolveSessionUserId(input.userId, input.guestId);
  const roundsCount = input.roundsCount ?? 5;
  const selected = await buildUniqueSceneSelection(roundsCount);
  const createdSession = await createSessionFromSelectedScenes(userId, selected);

  return getGameSessionDetails(userId, createdSession.id);
}

export async function getGameSessionDetails(
  userId: string | undefined,
  sessionId: string,
  guestId?: string
) {
  const sessionUserId = await resolveSessionUserId(userId, guestId);
  let session = await prisma.gameSession.findFirst({
    where: {
      id: sessionId,
      userId: sessionUserId
    },
    include: {
      rounds: {
        orderBy: {
          order: 'asc'
        },
        include: {
          scene: {
            select: {
              imageUrl: true,
              difficulty: true,
              animeTitle: {
                select: {
                  name: true
                }
              }
            }
          },
          guess: true
        }
      }
    }
  });

  if (!session) {
    throw new ApiError(404, 'Game session not found');
  }

  const preMatch = getMatchBySessionId(session.id);
  if (
    preMatch &&
    session.status === GameSessionStatus.ACTIVE &&
    session.currentRoundIndex <= session.totalRounds
  ) {
    const timer = preMatch.roundTimers[session.currentRoundIndex];
    if (timer && getTimerRemainingMs(timer) <= 0) {
      await resolveMultiplayerRoundTimeout(preMatch, session.currentRoundIndex);
      session = await prisma.gameSession.findFirst({
        where: {
          id: sessionId,
          userId: sessionUserId
        },
        include: {
          rounds: {
            orderBy: {
              order: 'asc'
            },
            include: {
              scene: {
                select: {
                  imageUrl: true,
                  difficulty: true,
                  animeTitle: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              guess: true
            }
          }
        }
      });
      if (!session) {
        throw new ApiError(404, 'Game session not found');
      }
    }
  }

  const answeredRounds = session.rounds.filter((round) => Boolean(round.guess)).length;
  const match = getMatchBySessionId(session.id);
  const opponent = match ? getOpponentState(match, session.id) : null;

  const currentRound =
    session.status === GameSessionStatus.ACTIVE && session.currentRoundIndex <= session.totalRounds
      ? session.rounds.find((round) => round.order === session.currentRoundIndex)
      : undefined;

  return {
    session: {
      id: session.id,
      status: session.status,
      totalRounds: session.totalRounds,
      currentRoundIndex: session.currentRoundIndex,
      score: session.score,
      correctAnswers: session.correctAnswers,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null,
      canFinish: session.currentRoundIndex > session.totalRounds,
      multiplayer: Boolean(match),
      opponentNickname: opponent?.nickname ?? null
    },
    answeredRounds,
    currentRound: currentRound ? await buildPublicRound(currentRound) : null
  };
}

export async function answerRound(input: AnswerInput) {
  const userId = await resolveSessionUserId(input.userId, input.guestId);
  const selectedAnswer = input.selectedAnswer.trim();

  if (!selectedAnswer) {
    throw new ApiError(400, 'Selected answer cannot be empty');
  }

  const response = await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.findFirst({
      where: {
        id: input.sessionId,
        userId
      }
    });

    if (!session) {
      throw new ApiError(404, 'Game session not found');
    }

    if (session.status !== GameSessionStatus.ACTIVE) {
      throw new ApiError(400, 'Game session is already finished');
    }

    if (session.currentRoundIndex > session.totalRounds) {
      throw new ApiError(400, 'All rounds are answered. Finish the session.');
    }

    const round = await tx.round.findFirst({
      where: {
        sessionId: session.id,
        order: session.currentRoundIndex
      },
      include: {
        guess: true,
        scene: {
          select: {
            imageUrl: true,
            difficulty: true
          }
        }
      }
    });

    if (!round) {
      throw new ApiError(404, 'Round not found for current session');
    }

    if (round.guess) {
      throw new ApiError(409, 'Round already answered');
    }

    const isCorrect = selectedAnswer.toLowerCase() === round.correctAnswer.toLowerCase();
    const pointsAwarded = isCorrect ? 100 + calcTimeBonus(input.responseTimeMs) : 0;

    await tx.guess.create({
      data: {
        sessionId: session.id,
        roundId: round.id,
        userId,
        selectedOption: selectedAnswer,
        isCorrect,
        responseTimeMs: input.responseTimeMs,
        pointsAwarded
      }
    });

    await tx.round.update({
      where: { id: round.id },
      data: { isAnswered: true }
    });

    const updatedSession = await tx.gameSession.update({
      where: { id: session.id },
      data: {
        currentRoundIndex: {
          increment: 1
        },
        score: {
          increment: pointsAwarded
        },
        correctAnswers: {
          increment: isCorrect ? 1 : 0
        }
      }
    });

    const nextRound =
      updatedSession.currentRoundIndex <= updatedSession.totalRounds
        ? await tx.round.findFirst({
            where: {
              sessionId: updatedSession.id,
              order: updatedSession.currentRoundIndex
            },
            include: {
              scene: {
                select: {
                  imageUrl: true,
                  difficulty: true,
                  animeTitle: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          })
        : null;

    return {
      session: updatedSession,
      round,
      isCorrect,
      pointsAwarded,
      nextRound
    };
  });

  await registerMultiplayerRoundLock(response.session.id, response.round.order);
  const match = getMatchBySessionId(response.session.id);
  const opponent = match ? getOpponentState(match, response.session.id) : null;

  return {
    result: {
      isCorrect: response.isCorrect,
      correctAnswer: response.round.correctAnswer,
      selectedAnswer,
      pointsAwarded: response.pointsAwarded
    },
    session: {
      id: response.session.id,
      score: response.session.score,
      correctAnswers: response.session.correctAnswers,
      currentRoundIndex: response.session.currentRoundIndex,
      totalRounds: response.session.totalRounds,
      canFinish: response.session.currentRoundIndex > response.session.totalRounds,
      multiplayer: Boolean(match),
      opponentNickname: opponent?.nickname ?? null
    },
    nextRound: response.nextRound
      ? await buildPublicRound({
          id: response.nextRound.id,
          order: response.nextRound.order,
          scene: response.nextRound.scene
        })
      : null
  };
}

export async function finishGameSession(userId: string | undefined, sessionId: string, guestId?: string) {
  const sessionUserId = await resolveSessionUserId(userId, guestId);
  const session = await prisma.gameSession.findFirst({
    where: {
      id: sessionId,
      userId: sessionUserId
    },
    include: {
      rounds: {
        orderBy: {
          order: 'asc'
        },
        include: {
          scene: {
            select: {
              imageUrl: true,
              animeTitle: {
                select: {
                  name: true
                }
              }
            }
          },
          guess: true
        }
      }
    }
  });

  if (!session) {
    throw new ApiError(404, 'Game session not found');
  }

  if (session.status === GameSessionStatus.FINISHED) {
    registerMultiplayerFinish(session.id, {
      score: session.score,
      correctAnswers: session.correctAnswers,
      totalRounds: session.totalRounds
    });
    return buildFinishedSessionSummary(session);
  }

  if (session.currentRoundIndex <= session.totalRounds) {
    throw new ApiError(400, 'Complete all rounds before finishing the session');
  }

  const finished = await prisma.gameSession.update({
    where: {
      id: session.id
    },
    data: {
      status: GameSessionStatus.FINISHED,
      finishedAt: new Date()
    },
    include: {
      rounds: {
        orderBy: {
          order: 'asc'
        },
        include: {
          scene: {
            select: {
              imageUrl: true,
              animeTitle: {
                select: {
                  name: true
                }
              }
            }
          },
          guess: true
        }
      }
    }
  });

  registerMultiplayerFinish(finished.id, {
    score: finished.score,
    correctAnswers: finished.correctAnswers,
    totalRounds: finished.totalRounds
  });

  return buildFinishedSessionSummary(finished);
}

export async function joinMultiplayerQueue(input: MatchmakingJoinInput) {
  const roundsCount = input.roundsCount ?? 5;
  const resolvedUserId = await resolveSessionUserId(input.userId, input.guestId);
  const participantKey = buildParticipantKey(input.userId, input.guestId);
  const displayName = input.displayName?.trim() || (input.userId ? 'Player' : buildGuestPlayerName());

  // Idempotent re-join: if this user is already in an active match, return that match again.
  for (const match of multiplayerMatches.values()) {
    const self = match.players.find((player) => player.participantKey === participantKey);
    if (!self) continue;
    const opponent = getOpponentState(match, self.sessionId);
    if (!self.finishedSummary) {
      return {
        status: 'matched' as const,
        ticketId: `match-${match.id}`,
        sessionId: self.sessionId,
        opponentNickname: opponent.nickname
      };
    }
  }

  const existingTicket = multiplayerQueue.find((entry) => entry.participantKey === participantKey);
  if (existingTicket) {
    const existingStatus = queueStatus.get(existingTicket.ticketId);
    if (existingStatus?.status === 'matched') {
      return {
        status: 'matched' as const,
        ticketId: existingTicket.ticketId,
        sessionId: existingStatus.sessionId,
        opponentNickname: existingStatus.opponentNickname
      };
    }
    if (existingStatus?.status === 'waiting') {
      return {
        status: 'waiting' as const,
        ticketId: existingTicket.ticketId
      };
    }
    queueStatus.set(existingTicket.ticketId, { status: 'waiting' });
    return {
      status: 'waiting' as const,
      ticketId: existingTicket.ticketId
    };
  }

  const opponentIndex = multiplayerQueue.findIndex((entry) => entry.participantKey !== participantKey);

  const ticketId = randomUUID();

  if (opponentIndex === -1) {
    multiplayerQueue.push({
      ticketId,
      userId: resolvedUserId,
      participantKey,
      displayName,
      roundsCount
    });

    queueStatus.set(ticketId, { status: 'waiting' });
    return {
      status: 'waiting' as const,
      ticketId
    };
  }

  const opponent = multiplayerQueue.splice(opponentIndex, 1)[0];
  const sharedRoundsCount = Math.min(roundsCount, opponent.roundsCount);
  const sharedScenes = await buildUniqueSceneSelection(sharedRoundsCount);

  const [playerSessionRecord, opponentSessionRecord] = await Promise.all([
    createSessionFromSelectedScenes(resolvedUserId, sharedScenes),
    createSessionFromSelectedScenes(opponent.userId, sharedScenes)
  ]);

  const [playerSession, opponentSession] = await Promise.all([
    getGameSessionDetails(resolvedUserId, playerSessionRecord.id),
    getGameSessionDetails(opponent.userId, opponentSessionRecord.id)
  ]);

  const matchId = randomUUID();
  const matchState: MultiplayerMatchState = {
    id: matchId,
    players: [
      {
        sessionId: playerSession.session.id,
        userId: resolvedUserId,
        participantKey,
        nickname: displayName
      },
      {
        sessionId: opponentSession.session.id,
        userId: opponent.userId,
        participantKey: opponent.participantKey,
        nickname: opponent.displayName
      }
    ],
    lockedRoundsBySession: {
      [playerSession.session.id]: new Set<number>(),
      [opponentSession.session.id]: new Set<number>()
    },
    roundTimers: {
      1: {
        startedAtMs: Date.now() + MULTIPLAYER_START_COUNTDOWN_MS,
        durationMs: MULTIPLAYER_ROUND_TIME_MS,
        shortened: false
      }
    }
  };
  multiplayerMatches.set(matchId, matchState);
  sessionToMatchId.set(playerSession.session.id, matchId);
  sessionToMatchId.set(opponentSession.session.id, matchId);

  queueStatus.set(ticketId, {
    status: 'matched',
    sessionId: playerSession.session.id,
    opponentNickname: opponent.displayName
  });

  queueStatus.set(opponent.ticketId, {
    status: 'matched',
    sessionId: opponentSession.session.id,
    opponentNickname: displayName
  });

  return {
    status: 'matched' as const,
    ticketId,
    sessionId: playerSession.session.id,
    opponentNickname: opponent.displayName
  };
}

export async function getMultiplayerQueueStatus(ticketId: string) {
  const status = queueStatus.get(ticketId);

  if (!status) {
    throw new ApiError(404, 'Queue ticket not found');
  }

  if (status.status === 'waiting') {
    return {
      status: 'waiting' as const,
      ticketId
    };
  }

  return {
    status: 'matched' as const,
    ticketId,
    sessionId: status.sessionId,
    opponentNickname: status.opponentNickname
  };
}

export async function getMultiplayerSessionStatus(sessionId: string, roundOrder?: number) {
  const match = getMatchBySessionId(sessionId);
  if (!match) {
    return {
      multiplayer: false as const,
      opponentNickname: null,
      opponentLockedCurrentRound: false,
      roundStartedAtMs: null,
      roundDurationMs: null,
      roundRemainingMs: null
    };
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      currentRoundIndex: true,
      totalRounds: true
    }
  });

  if (!session) {
    throw new ApiError(404, 'Game session not found');
  }

  const targetRoundOrder = roundOrder ?? Math.min(session.currentRoundIndex, session.totalRounds);

  const timer = match.roundTimers[targetRoundOrder];
  if (timer && getTimerRemainingMs(timer) <= 0) {
    await resolveMultiplayerRoundTimeout(match, targetRoundOrder);
  }

  const opponent = getOpponentState(match, sessionId);
  const opponentLocks = match.lockedRoundsBySession[opponent.sessionId] ?? new Set<number>();
  const upToDateTimer =
    targetRoundOrder <= session.totalRounds ? ensureMatchRoundTimer(match, targetRoundOrder) : null;

  return {
    multiplayer: true as const,
    opponentNickname: opponent.nickname,
    opponentLockedCurrentRound: targetRoundOrder ? opponentLocks.has(targetRoundOrder) : false,
    roundStartedAtMs: upToDateTimer?.startedAtMs ?? null,
    roundDurationMs: upToDateTimer?.durationMs ?? null,
    roundRemainingMs: upToDateTimer ? getTimerRemainingMs(upToDateTimer) : null
  };
}

export async function getMultiplayerResultComparison(sessionId: string) {
  const match = getMatchBySessionId(sessionId);
  if (!match) {
    return {
      multiplayer: false as const
    };
  }

  const self = match.players.find((entry) => entry.sessionId === sessionId);
  const opponent = getOpponentState(match, sessionId);

  if (!self || !self.finishedSummary) {
    throw new ApiError(400, 'Finish your session first');
  }

  if (!opponent.finishedSummary) {
    return {
      multiplayer: true as const,
      ready: false as const,
      opponentNickname: opponent.nickname
    };
  }

  const selfAccuracy = Number(
    ((self.finishedSummary.correctAnswers / self.finishedSummary.totalRounds) * 100).toFixed(1)
  );
  const opponentAccuracy = Number(
    ((opponent.finishedSummary.correctAnswers / opponent.finishedSummary.totalRounds) * 100).toFixed(1)
  );
  const result =
    self.finishedSummary.score > opponent.finishedSummary.score
      ? 'WIN'
      : self.finishedSummary.score < opponent.finishedSummary.score
        ? 'LOSE'
        : 'DRAW';

  return {
    multiplayer: true as const,
    ready: true as const,
    result,
    you: {
      score: self.finishedSummary.score,
      accuracy: selfAccuracy
    },
    opponent: {
      nickname: opponent.nickname,
      score: opponent.finishedSummary.score,
      accuracy: opponentAccuracy
    }
  };
}

export async function getMultiplayerRoundResult(sessionId: string, roundOrder: number) {
  const match = getMatchBySessionId(sessionId);
  if (!match) {
    return {
      multiplayer: false as const
    };
  }

  const timer = match.roundTimers[roundOrder];
  if (timer && getTimerRemainingMs(timer) <= 0) {
    await resolveMultiplayerRoundTimeout(match, roundOrder);
  }

  const opponent = getOpponentState(match, sessionId);

  const [selfRound, opponentRound] = await Promise.all([
    prisma.round.findFirst({
      where: {
        sessionId,
        order: roundOrder
      },
      include: {
        guess: true
      }
    }),
    prisma.round.findFirst({
      where: {
        sessionId: opponent.sessionId,
        order: roundOrder
      },
      include: {
        guess: true
      }
    })
  ]);

  if (!selfRound) {
    throw new ApiError(404, 'Round not found');
  }

  if (!selfRound.guess) {
    throw new ApiError(400, 'You need to answer this round first');
  }

  if (!opponentRound?.guess) {
    return {
      multiplayer: true as const,
      ready: false as const,
      opponentNickname: opponent.nickname
    };
  }

  return {
    multiplayer: true as const,
    ready: true as const,
    opponentNickname: opponent.nickname,
    you: {
      isCorrect: selfRound.guess.isCorrect,
      pointsAwarded: selfRound.guess.pointsAwarded
    },
    opponent: {
      isCorrect: opponentRound.guess.isCorrect,
      pointsAwarded: opponentRound.guess.pointsAwarded
    }
  };
}

function buildFinishedSessionSummary(session: {
  id: string;
  score: number;
  totalRounds: number;
  correctAnswers: number;
  startedAt: Date;
  finishedAt: Date | null;
  rounds: Array<{
    order: number;
    scene: {
      imageUrl: string;
      animeTitle: {
        name: string;
      };
    };
    guess: {
      selectedOption: string;
      isCorrect: boolean;
      pointsAwarded: number;
      responseTimeMs: number | null;
    } | null;
  }>;
}) {
  return {
    summary: {
      sessionId: session.id,
      score: session.score,
      totalRounds: session.totalRounds,
      correctAnswers: session.correctAnswers,
      accuracy: Number(((session.correctAnswers / session.totalRounds) * 100).toFixed(1)),
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null
    },
    rounds: session.rounds.map((round) => ({
      order: round.order,
      imageUrl: round.scene.imageUrl,
      correctAnswer: round.scene.animeTitle.name,
      selectedAnswer: round.guess?.selectedOption ?? null,
      isCorrect: round.guess?.isCorrect ?? false,
      pointsAwarded: round.guess?.pointsAwarded ?? 0,
      responseTimeMs: round.guess?.responseTimeMs ?? null
    }))
  };
}
