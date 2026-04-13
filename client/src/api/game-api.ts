import {
  AnswerResultResponse,
  FinishedSessionResponse,
  GameSessionResponse,
  MultiplayerQueueResponse,
  MultiplayerResultResponse,
  MultiplayerRoundResultResponse,
  MultiplayerSessionStatusResponse
} from '../types/api';
import { apiRequest } from './http';

export function startGame(roundsCount = 5) {
  return apiRequest<GameSessionResponse>('/game/start', {
    method: 'POST',
    body: { roundsCount }
  });
}

export function getGameSession(sessionId: string) {
  return apiRequest<GameSessionResponse>(`/game/session/${sessionId}`);
}

export function answerRound(sessionId: string, payload: { selectedAnswer: string; responseTimeMs?: number }) {
  return apiRequest<AnswerResultResponse>(`/game/session/${sessionId}/answer`, {
    method: 'POST',
    body: payload
  });
}

export function finishGame(sessionId: string) {
  return apiRequest<FinishedSessionResponse>(`/game/session/${sessionId}/finish`, {
    method: 'POST'
  });
}

export function joinMultiplayerQueue(roundsCount = 5) {
  return apiRequest<MultiplayerQueueResponse>('/game/multiplayer/queue/join', {
    method: 'POST',
    body: { roundsCount }
  });
}

export function getMultiplayerQueueStatus(ticketId: string) {
  return apiRequest<MultiplayerQueueResponse>(`/game/multiplayer/queue/${ticketId}`);
}

export function getMultiplayerSessionStatus(sessionId: string, roundOrder?: number) {
  const suffix = roundOrder ? `?roundOrder=${roundOrder}` : '';
  return apiRequest<MultiplayerSessionStatusResponse>(
    `/game/multiplayer/session/${sessionId}/status${suffix}`
  );
}

export function getMultiplayerResult(sessionId: string) {
  return apiRequest<MultiplayerResultResponse>(`/game/multiplayer/session/${sessionId}/result`);
}

export function getMultiplayerRoundResult(sessionId: string, roundOrder: number) {
  return apiRequest<MultiplayerRoundResultResponse>(
    `/game/multiplayer/session/${sessionId}/round/${roundOrder}/result`
  );
}
