import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { leaderboardController } from './leaderboard.controller';
import { leaderboardQuerySchema } from './leaderboard.schemas';

const leaderboardRouter = Router();

leaderboardRouter.get('/', validate(leaderboardQuerySchema), asyncHandler(leaderboardController));

export { leaderboardRouter };
