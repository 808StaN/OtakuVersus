import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  answerRound,
  finishGame,
  getGameSession,
  getMultiplayerQueueStatus,
  getMultiplayerRoundResult,
  getMultiplayerResult,
  getMultiplayerSessionStatus,
  joinMultiplayerQueue,
  startGame
} from '../../api/game-api';

export function useStartGameMutation() {
  return useMutation({
    mutationFn: (roundsCount: number) => startGame(roundsCount)
  });
}

export function useGameSessionQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['game-session', sessionId],
    queryFn: () => getGameSession(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.session.status === 'ACTIVE' ? 10_000 : false;
    }
  });
}

export function useAnswerMutation(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { selectedAnswer: string; responseTimeMs?: number }) =>
      answerRound(sessionId!, payload),
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['game-session', sessionId] });
      }
      queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  });
}

export function useFinishGameQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['results', sessionId],
    queryFn: () => finishGame(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: Infinity,
    retry: 0,
    refetchOnWindowFocus: false
  });
}

export function useJoinMultiplayerQueueMutation() {
  return useMutation({
    mutationFn: (roundsCount: number) => joinMultiplayerQueue(roundsCount)
  });
}

export function useMultiplayerQueueStatusQuery(ticketId: string | null) {
  return useQuery({
    queryKey: ['multiplayer-queue', ticketId],
    queryFn: () => getMultiplayerQueueStatus(ticketId!),
    enabled: Boolean(ticketId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'matched' ? false : 2_000;
    },
    refetchIntervalInBackground: true
  });
}

export function useMultiplayerSessionStatusQuery(sessionId: string | undefined, roundOrder?: number) {
  return useQuery({
    queryKey: ['multiplayer-session-status', sessionId, roundOrder],
    queryFn: () => getMultiplayerSessionStatus(sessionId!, roundOrder),
    enabled: Boolean(sessionId),
    refetchInterval: 300
  });
}

export function useMultiplayerResultQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['multiplayer-result', sessionId],
    queryFn: () => getMultiplayerResult(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.multiplayer === false) return false;
      return data.ready ? false : 1_500;
    }
  });
}

export function useMultiplayerRoundResultQuery(
  sessionId: string | undefined,
  roundOrder: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['multiplayer-round-result', sessionId, roundOrder],
    queryFn: () => getMultiplayerRoundResult(sessionId!, roundOrder!),
    enabled: Boolean(sessionId && roundOrder && enabled),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.multiplayer === false) return 1_000;
      return data.ready ? false : 1_000;
    }
  });
}
