import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  answerRoundController,
  finishGameController,
  getGameSessionController,
  joinMultiplayerQueueController,
  multiplayerResultComparisonController,
  multiplayerRoundResultController,
  multiplayerQueueStatusController,
  multiplayerSessionStatusController,
  startGameController
} from './game.controller';
import {
  answerSchema,
  finishSchema,
  multiplayerJoinSchema,
  multiplayerRoundResultParamsSchema,
  multiplayerSessionParamsSchema,
  multiplayerStatusParamsSchema,
  sessionIdParamsSchema,
  startGameSchema
} from './game.schemas';

const gameRouter = Router();

gameRouter.use(optionalAuth);
gameRouter.post('/start', validate(startGameSchema), asyncHandler(startGameController));
gameRouter.get('/session/:id', validate(sessionIdParamsSchema), asyncHandler(getGameSessionController));
gameRouter.post('/session/:id/answer', validate(answerSchema), asyncHandler(answerRoundController));
gameRouter.post('/session/:id/finish', validate(finishSchema), asyncHandler(finishGameController));
gameRouter.post('/multiplayer/queue/join', validate(multiplayerJoinSchema), asyncHandler(joinMultiplayerQueueController));
gameRouter.get(
  '/multiplayer/queue/:ticketId',
  validate(multiplayerStatusParamsSchema),
  asyncHandler(multiplayerQueueStatusController)
);
gameRouter.get(
  '/multiplayer/session/:id/status',
  validate(multiplayerSessionParamsSchema),
  asyncHandler(multiplayerSessionStatusController)
);
gameRouter.get(
  '/multiplayer/session/:id/result',
  validate(multiplayerSessionParamsSchema),
  asyncHandler(multiplayerResultComparisonController)
);
gameRouter.get(
  '/multiplayer/session/:id/round/:roundOrder/result',
  validate(multiplayerRoundResultParamsSchema),
  asyncHandler(multiplayerRoundResultController)
);

export { gameRouter };
