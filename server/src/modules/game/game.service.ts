import { GameMode, GameSessionStatus } from '@prisma/client';
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
  isGuest: boolean;
  elo: number | null;
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
  eloResolved: boolean;
  eloDeltaBySession: Record<string, number>;
  eloResolutionPromise?: Promise<Record<string, number>>;
};

type AnimeMeta = {
  year: number | null;
  genres: string[];
};

type AnimeMetaCacheEntry = {
  value: AnimeMeta | null;
  expiresAt: number;
};

const GUEST_NICKNAME = 'Guest';
const GUEST_PASSWORD_HASH = '__guest_account__';
const MULTIPLAYER_ROUND_TIME_MS = 30_000;
const MULTIPLAYER_START_COUNTDOWN_MS = 3_000;
const MIN_MULTIPLAYER_REMAINING_MS = 1_000;
const ELO_DEFAULT = 1000;
const ELO_K_FACTOR = 32;
const ANIME_META_SUCCESS_TTL_MS = Number.POSITIVE_INFINITY;
const ANIME_META_FAILURE_TTL_MS = 1000 * 60;
const animeMetaCache = new Map<string, AnimeMetaCacheEntry>();
const animeMetaInFlight = new Map<string, Promise<AnimeMeta | null>>();
const multiplayerMatches = new Map<string, MultiplayerMatchState>();
const sessionToMatchId = new Map<string, string>();
const multiplayerQueue: Array<{
  ticketId: string;
  userId: string;
  participantKey: string;
  displayName: string;
  isGuest: boolean;
  elo: number | null;
  roundsCount: number;
}> = [];
const queueStatus = new Map<
  string,
  | { status: 'waiting' }
  | { status: 'matched'; sessionId: string; opponentNickname: string; opponentElo: number | null }
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

type ResolvedSessionPlayer = {
  id: string;
  nickname: string;
  isGuest: boolean;
  elo: number | null;
};

function computeEloDelta(selfElo: number, opponentElo: number, actualScore: number) {
  const expectedScore = 1 / (1 + 10 ** ((opponentElo - selfElo) / 400));
  return Math.round(ELO_K_FACTOR * (actualScore - expectedScore));
}

function ensureDefaultElo(elo: number | null) {
  return typeof elo === 'number' ? elo : ELO_DEFAULT;
}

async function resolveSessionPlayer(userId?: string, guestId?: string): Promise<ResolvedSessionPlayer> {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        isGuest: true,
        elo: true
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  const guestKey = sanitizeGuestId(guestId ?? '');
  const fallbackKey = guestKey || 'public';
  const guestEmail = `guest.${fallbackKey}@otakuversus.local`;

  const existingGuest = await prisma.user.findUnique({
    where: {
      email: guestEmail
    },
    select: {
      id: true,
      nickname: true,
      isGuest: true,
      elo: true
    }
  });

  if (existingGuest) {
    if (existingGuest.isGuest && existingGuest.elo === null) {
      return existingGuest;
    }

    return prisma.user.update({
      where: {
        id: existingGuest.id
      },
      data: {
        isGuest: true,
        elo: null
      },
      select: {
        id: true,
        nickname: true,
        isGuest: true,
        elo: true
      }
    });
  }

  const nicknameCandidate = `${GUEST_NICKNAME}-${fallbackKey.slice(0, 6)}`;

  const existingNicknameCount = await prisma.user.count({
    where: {
      nickname: {
        startsWith: nicknameCandidate
      }
    }
  });

  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      nickname: existingNicknameCount > 0 ? `${nicknameCandidate}-${existingNicknameCount + 1}` : nicknameCandidate,
      passwordHash: GUEST_PASSWORD_HASH,
      isGuest: true,
      elo: null
    },
    select: {
      id: true,
      nickname: true,
      isGuest: true,
      elo: true
    }
  });

  return guest;
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

function buildAnimeMetaFromRaw(year: number | null, tags: string[]) {
  return {
    year: typeof year === 'number' && Number.isFinite(year) ? year : null,
    genres: [...new Set(tags.map((item) => item.trim()).filter(Boolean))].slice(0, 4)
  } satisfies AnimeMeta;
}

async function fetchAnimeMetaFromAniList(animeTitle: string): Promise<AnimeMeta | null> {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        startDate { year }
        seasonYear
        genres
        tags {
          name
          rank
          isMediaSpoiler
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: { search: animeTitle }
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: {
      Media?: {
        startDate?: { year?: number | null };
        seasonYear?: number | null;
        genres?: string[];
        tags?: Array<{ name?: string | null; rank?: number | null; isMediaSpoiler?: boolean | null }>;
      } | null;
    };
  };

  const media = payload.data?.Media;
  if (!media) return null;

  const tagNames = (media.tags ?? [])
    .filter((tag) => !tag.isMediaSpoiler)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((tag) => tag.name ?? '')
    .filter(Boolean);
  const genres = (media.genres ?? []).filter(Boolean);
  const year = media.startDate?.year ?? media.seasonYear ?? null;

  const meta = buildAnimeMetaFromRaw(year, [...genres, ...tagNames]);
  return meta.genres.length > 0 || meta.year ? meta : null;
}

async function fetchAnimeMetaFromJikan(animeTitle: string): Promise<AnimeMeta | null> {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1&sfw=true`
  );

  if (!response.ok) {
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

  const meta = buildAnimeMetaFromRaw(Number.isFinite(parsedYear as number) ? (parsedYear as number) : null, tags);
  return meta.genres.length > 0 || meta.year ? meta : null;
}

async function getAnimeMeta(animeTitle: string): Promise<AnimeMeta | null> {
  const key = animeTitle.trim().toLowerCase();
  const cached = animeMetaCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inFlight = animeMetaInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const request = (async (): Promise<AnimeMeta | null> => {
    try {
      const meta = (await fetchAnimeMetaFromAniList(animeTitle)) ?? (await fetchAnimeMetaFromJikan(animeTitle));

      animeMetaCache.set(key, {
        value: meta,
        expiresAt: Date.now() + (meta ? ANIME_META_SUCCESS_TTL_MS : ANIME_META_FAILURE_TTL_MS)
      });

      return meta;
    } catch (_error) {
      animeMetaCache.set(key, {
        value: null,
        expiresAt: Date.now() + ANIME_META_FAILURE_TTL_MS
      });
      return null;
    } finally {
      animeMetaInFlight.delete(key);
    }
  })();

  animeMetaInFlight.set(key, request);
  return request;
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
  selectedScenes: Array<{ id: string; animeTitle: { name: string } }>,
  mode: GameMode
) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({
      data: {
        userId,
        mode,
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

async function resolveMultiplayerElo(match: MultiplayerMatchState) {
  if (match.eloResolved) {
    return match.eloDeltaBySession;
  }

  if (match.eloResolutionPromise) {
    return match.eloResolutionPromise;
  }

  match.eloResolutionPromise = (async () => {
    try {
      const playerA = match.players[0];
      const playerB = match.players[1];

      if (!playerA.finishedSummary || !playerB.finishedSummary) {
        return match.eloDeltaBySession;
      }

      const scoreA =
        playerA.finishedSummary.score > playerB.finishedSummary.score
          ? 1
          : playerA.finishedSummary.score < playerB.finishedSummary.score
            ? 0
            : 0.5;
      const scoreB = 1 - scoreA;

      const canApplyRatedMatch =
        !playerA.isGuest &&
        !playerB.isGuest &&
        typeof playerA.elo === 'number' &&
        typeof playerB.elo === 'number';

      let deltaA = 0;
      let deltaB = 0;

      if (canApplyRatedMatch) {
        const safeEloA = ensureDefaultElo(playerA.elo);
        const safeEloB = ensureDefaultElo(playerB.elo);
        deltaA = computeEloDelta(safeEloA, safeEloB, scoreA);
        deltaB = computeEloDelta(safeEloB, safeEloA, scoreB);
      }

      await prisma.$transaction(async (tx) => {
        if (canApplyRatedMatch) {
          await tx.user.update({
            where: { id: playerA.userId },
            data: {
              elo: {
                increment: deltaA
              }
            }
          });
          await tx.user.update({
            where: { id: playerB.userId },
            data: {
              elo: {
                increment: deltaB
              }
            }
          });
        }

        await tx.gameSession.update({
          where: { id: playerA.sessionId },
          data: {
            eloDelta: deltaA
          }
        });
        await tx.gameSession.update({
          where: { id: playerB.sessionId },
          data: {
            eloDelta: deltaB
          }
        });
      });

      playerA.elo = canApplyRatedMatch ? ensureDefaultElo(playerA.elo) + deltaA : playerA.elo;
      playerB.elo = canApplyRatedMatch ? ensureDefaultElo(playerB.elo) + deltaB : playerB.elo;
      match.eloDeltaBySession[playerA.sessionId] = deltaA;
      match.eloDeltaBySession[playerB.sessionId] = deltaB;
      match.eloResolved = true;

      return match.eloDeltaBySession;
    } finally {
      match.eloResolutionPromise = undefined;
    }
  })();

  return match.eloResolutionPromise;
}

export async function startGameSession(input: StartSessionInput) {
  const player = await resolveSessionPlayer(input.userId, input.guestId);
  const roundsCount = input.roundsCount ?? 5;
  const selected = await buildUniqueSceneSelection(roundsCount);
  const createdSession = await createSessionFromSelectedScenes(player.id, selected, GameMode.SINGLEPLAYER);

  return getGameSessionDetails(player.id, createdSession.id);
}

export async function getGameSessionDetails(
  userId: string | undefined,
  sessionId: string,
  guestId?: string
) {
  const sessionPlayer = await resolveSessionPlayer(userId, guestId);
  let session = await prisma.gameSession.findFirst({
    where: {
      id: sessionId,
      userId: sessionPlayer.id
    },
    include: {
      user: {
        select: {
          elo: true,
          isGuest: true
        }
      },
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
          userId: sessionPlayer.id
        },
        include: {
          user: {
            select: {
              elo: true,
              isGuest: true
            }
          },
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
      opponentNickname: opponent?.nickname ?? null,
      opponentElo: opponent?.elo ?? null,
      elo: session.user.isGuest ? null : session.user.elo ?? ELO_DEFAULT,
      mode: session.mode
    },
    answeredRounds,
    currentRound: currentRound ? await buildPublicRound(currentRound) : null
  };
}

export async function answerRound(input: AnswerInput) {
  const player = await resolveSessionPlayer(input.userId, input.guestId);
  const selectedAnswer = input.selectedAnswer.trim();

  if (!selectedAnswer) {
    throw new ApiError(400, 'Selected answer cannot be empty');
  }

  const response = await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.findFirst({
      where: {
        id: input.sessionId,
        userId: player.id
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
        userId: player.id,
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
      opponentNickname: opponent?.nickname ?? null,
      opponentElo: opponent?.elo ?? null,
      mode: response.session.mode
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
  const player = await resolveSessionPlayer(userId, guestId);
  const session = await prisma.gameSession.findFirst({
    where: {
      id: sessionId,
      userId: player.id
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
  const player = await resolveSessionPlayer(input.userId, input.guestId);
  const participantKey = buildParticipantKey(input.userId, input.guestId);
  const displayName = input.displayName?.trim() || (player.isGuest ? buildGuestPlayerName() : player.nickname);

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
        opponentNickname: opponent.nickname,
        opponentElo: opponent.elo
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
        opponentNickname: existingStatus.opponentNickname,
        opponentElo: existingStatus.opponentElo
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
      userId: player.id,
      participantKey,
      displayName,
      isGuest: player.isGuest,
      elo: player.isGuest ? null : player.elo ?? ELO_DEFAULT,
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
    createSessionFromSelectedScenes(player.id, sharedScenes, GameMode.MULTIPLAYER),
    createSessionFromSelectedScenes(opponent.userId, sharedScenes, GameMode.MULTIPLAYER)
  ]);

  const [playerSession, opponentSession] = await Promise.all([
    getGameSessionDetails(player.id, playerSessionRecord.id),
    getGameSessionDetails(opponent.userId, opponentSessionRecord.id)
  ]);

  const matchId = randomUUID();
  const matchState: MultiplayerMatchState = {
    id: matchId,
    players: [
      {
        sessionId: playerSession.session.id,
        userId: player.id,
        participantKey,
        nickname: displayName,
        isGuest: player.isGuest,
        elo: player.isGuest ? null : player.elo ?? ELO_DEFAULT
      },
      {
        sessionId: opponentSession.session.id,
        userId: opponent.userId,
        participantKey: opponent.participantKey,
        nickname: opponent.displayName,
        isGuest: opponent.isGuest,
        elo: opponent.elo
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
    },
    eloResolved: false,
    eloDeltaBySession: {}
  };
  multiplayerMatches.set(matchId, matchState);
  sessionToMatchId.set(playerSession.session.id, matchId);
  sessionToMatchId.set(opponentSession.session.id, matchId);

  queueStatus.set(ticketId, {
    status: 'matched',
    sessionId: playerSession.session.id,
    opponentNickname: opponent.displayName,
    opponentElo: opponent.elo
  });

  queueStatus.set(opponent.ticketId, {
    status: 'matched',
    sessionId: opponentSession.session.id,
    opponentNickname: displayName,
    opponentElo: player.isGuest ? null : player.elo ?? ELO_DEFAULT
  });

  return {
    status: 'matched' as const,
    ticketId,
    sessionId: playerSession.session.id,
    opponentNickname: opponent.displayName,
    opponentElo: opponent.elo
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
    opponentNickname: status.opponentNickname,
    opponentElo: status.opponentElo
  };
}

export async function getMultiplayerSessionStatus(sessionId: string, roundOrder?: number) {
  const match = getMatchBySessionId(sessionId);
  if (!match) {
    return {
      multiplayer: false as const,
      opponentNickname: null,
      opponentElo: null,
      yourElo: null,
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
  const self = match.players.find((player) => player.sessionId === sessionId);
  const opponentLocks = match.lockedRoundsBySession[opponent.sessionId] ?? new Set<number>();
  const upToDateTimer =
    targetRoundOrder <= session.totalRounds ? ensureMatchRoundTimer(match, targetRoundOrder) : null;

  return {
    multiplayer: true as const,
    opponentNickname: opponent.nickname,
    opponentElo: opponent.elo,
    yourElo: self?.elo ?? null,
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
      opponentNickname: opponent.nickname,
      opponentElo: opponent.elo
    };
  }

  const eloDeltaBySession = await resolveMultiplayerElo(match);
  const selfEloDelta = eloDeltaBySession[self.sessionId] ?? 0;
  const opponentEloDelta = eloDeltaBySession[opponent.sessionId] ?? 0;

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
      accuracy: selfAccuracy,
      elo: self.elo,
      eloDelta: selfEloDelta
    },
    opponent: {
      nickname: opponent.nickname,
      score: opponent.finishedSummary.score,
      accuracy: opponentAccuracy,
      elo: opponent.elo,
      eloDelta: opponentEloDelta
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
  mode: GameMode;
  eloDelta: number;
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
      mode: session.mode,
      eloDelta: session.eloDelta,
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
