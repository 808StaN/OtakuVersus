export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  elo: number;
  createdAt: string;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export type ApiErrorPayload = {
  message: string;
};

export type SessionSnapshot = {
  id: string;
  status: 'ACTIVE' | 'FINISHED';
  totalRounds: number;
  currentRoundIndex: number;
  score: number;
  correctAnswers: number;
  startedAt: string;
  finishedAt: string | null;
  canFinish: boolean;
  multiplayer: boolean;
  opponentNickname: string | null;
  opponentElo: number | null;
  elo: number | null;
  mode: 'SINGLEPLAYER' | 'MULTIPLAYER';
};

export type PublicRound = {
  id: string;
  order: number;
  imageUrl: string;
  imageUrls: string[];
  difficulty: string;
  animeMeta: {
    year: number | null;
    genres: string[];
  } | null;
};

export type GameSessionResponse = {
  session: SessionSnapshot;
  answeredRounds: number;
  currentRound: PublicRound | null;
};

export type AnswerResultResponse = {
  result: {
    isCorrect: boolean;
    correctAnswer: string;
    selectedAnswer: string;
    pointsAwarded: number;
  };
  session: {
    id: string;
    score: number;
    correctAnswers: number;
    currentRoundIndex: number;
    totalRounds: number;
    canFinish: boolean;
    multiplayer: boolean;
    opponentNickname: string | null;
    opponentElo: number | null;
    mode: 'SINGLEPLAYER' | 'MULTIPLAYER';
  };
  nextRound: PublicRound | null;
};

export type FinishedSessionResponse = {
  summary: {
    sessionId: string;
    score: number;
    totalRounds: number;
    correctAnswers: number;
    mode: 'SINGLEPLAYER' | 'MULTIPLAYER';
    eloDelta: number;
    accuracy: number;
    startedAt: string;
    finishedAt: string | null;
  };
  rounds: Array<{
    order: number;
    imageUrl: string;
    correctAnswer: string;
    selectedAnswer: string | null;
    isCorrect: boolean;
    pointsAwarded: number;
    responseTimeMs: number | null;
  }>;
};

export type LeaderboardRow = {
  position: number;
  sessionId: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalRounds: number;
  playedAt: string | null;
};

export type EloLeaderboardRow = {
  position: number;
  userId: string;
  nickname: string;
  elo: number;
  matchesPlayed: number;
  winRatio: number;
  playedAt: string | null;
};

export type UserHistoryResponse = {
  stats: {
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    rank: string;
    singleplayer: {
      sessionsPlayed: number;
      averageScore: number;
      bestScore: number;
      averageAccuracy: number;
    };
    multiplayer: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      winRatio: number;
      totalLpChange: number;
      bestLpGain: number;
      peakElo: number;
    };
  };
  history: Array<{
    sessionId: string;
    score: number;
    correctAnswers: number;
    totalRounds: number;
    mode: 'SINGLEPLAYER' | 'MULTIPLAYER';
    eloDelta: number;
    accuracy: number;
    playedAt: string;
  }>;
};

export type MultiplayerQueueResponse = {
  status: 'waiting' | 'matched';
  ticketId: string;
  sessionId?: string;
  opponentNickname?: string;
  opponentElo?: number | null;
};

export type MultiplayerSessionStatusResponse = {
  multiplayer: boolean;
  opponentNickname: string | null;
  opponentElo: number | null;
  yourElo: number | null;
  opponentLockedCurrentRound: boolean;
  roundStartedAtMs: number | null;
  roundDurationMs: number | null;
  roundRemainingMs: number | null;
};

export type MultiplayerResultResponse =
  | { multiplayer: false }
  | { multiplayer: true; ready: false; opponentNickname: string; opponentElo: number | null }
  | {
      multiplayer: true;
      ready: true;
      result: 'WIN' | 'LOSE' | 'DRAW';
      you: { score: number; accuracy: number; elo: number | null; eloDelta: number };
      opponent: { nickname: string; score: number; accuracy: number; elo: number | null; eloDelta: number };
    };

export type MultiplayerRoundResultResponse =
  | { multiplayer: false }
  | { multiplayer: true; ready: false; opponentNickname: string }
  | {
      multiplayer: true;
      ready: true;
      opponentNickname: string;
      you: { isCorrect: boolean; pointsAwarded: number };
      opponent: { isCorrect: boolean; pointsAwarded: number };
    };
