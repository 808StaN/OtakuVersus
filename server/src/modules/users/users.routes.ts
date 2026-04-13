import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { getMyHistoryController } from './users.controller';
import { historyQuerySchema } from './users.schemas';

const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get('/me/history', validate(historyQuerySchema), asyncHandler(getMyHistoryController));

export { usersRouter };
