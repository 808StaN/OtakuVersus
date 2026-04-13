export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
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
  };
  nextRound: PublicRound | null;
};

export type FinishedSessionResponse = {
  summary: {
    sessionId: string;
    score: number;
    totalRounds: number;
    correctAnswers: number;
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

export type UserHistoryResponse = {
  stats: {
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    rank: string;
  };
  history: Array<{
    sessionId: string;
    score: number;
    correctAnswers: number;
    totalRounds: number;
    accuracy: number;
    playedAt: string;
  }>;
};

export type MultiplayerQueueResponse = {
  status: 'waiting' | 'matched';
  ticketId: string;
  sessionId?: string;
  opponentNickname?: string;
};

export type MultiplayerSessionStatusResponse = {
  multiplayer: boolean;
  opponentNickname: string | null;
  opponentLockedCurrentRound: boolean;
  roundStartedAtMs: number | null;
  roundDurationMs: number | null;
  roundRemainingMs: number | null;
};

export type MultiplayerResultResponse =
  | { multiplayer: false }
  | { multiplayer: true; ready: false; opponentNickname: string }
  | {
      multiplayer: true;
      ready: true;
      result: 'WIN' | 'LOSE' | 'DRAW';
      you: { score: number; accuracy: number };
      opponent: { nickname: string; score: number; accuracy: number };
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
