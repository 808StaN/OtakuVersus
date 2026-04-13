import { Request, Response } from 'express';
import {
  answerRound,
  finishGameSession,
  getGameSessionDetails,
  getMultiplayerResultComparison,
  getMultiplayerRoundResult,
  getMultiplayerSessionStatus,
  getMultiplayerQueueStatus,
  joinMultiplayerQueue,
  startGameSession
} from './game.service';

function getGuestId(req: Request) {
  const header = req.headers['x-guest-id'];
  return typeof header === 'string' ? header : undefined;
}

export async function startGameController(req: Request, res: Response) {
  const payload = await startGameSession({
    userId: req.user?.id,
    guestId: getGuestId(req),
    roundsCount: req.body.roundsCount
  });

  res.status(201).json(payload);
}

export async function getGameSessionController(req: Request, res: Response) {
  const payload = await getGameSessionDetails(req.user?.id, req.params.id, getGuestId(req));
  res.status(200).json(payload);
}

export async function answerRoundController(req: Request, res: Response) {
  const payload = await answerRound({
    userId: req.user?.id,
    guestId: getGuestId(req),
    sessionId: req.params.id,
    selectedAnswer: req.body.selectedAnswer,
    responseTimeMs: req.body.responseTimeMs
  });

  res.status(200).json(payload);
}

export async function finishGameController(req: Request, res: Response) {
  const payload = await finishGameSession(req.user?.id, req.params.id, getGuestId(req));
  res.status(200).json(payload);
}

export async function joinMultiplayerQueueController(req: Request, res: Response) {
  const payload = await joinMultiplayerQueue({
    userId: req.user?.id,
    guestId: getGuestId(req),
    roundsCount: req.body.roundsCount,
    displayName: req.user?.nickname
  });
  res.status(200).json(payload);
}

export async function multiplayerQueueStatusController(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const payload = await getMultiplayerQueueStatus(req.params.ticketId);
  res.status(200).json(payload);
}

export async function multiplayerSessionStatusController(req: Request, res: Response) {
  await getGameSessionDetails(req.user?.id, req.params.id, getGuestId(req));
  const roundOrder = req.query.roundOrder ? Number(req.query.roundOrder) : undefined;
  const payload = await getMultiplayerSessionStatus(req.params.id, roundOrder);
  res.status(200).json(payload);
}

export async function multiplayerResultComparisonController(req: Request, res: Response) {
  await getGameSessionDetails(req.user?.id, req.params.id, getGuestId(req));
  const payload = await getMultiplayerResultComparison(req.params.id);
  res.status(200).json(payload);
}

export async function multiplayerRoundResultController(req: Request, res: Response) {
  await getGameSessionDetails(req.user?.id, req.params.id, getGuestId(req));
  const payload = await getMultiplayerRoundResult(req.params.id, Number(req.params.roundOrder));
  res.status(200).json(payload);
}
