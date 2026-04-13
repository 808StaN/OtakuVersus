import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { gameRouter } from '../modules/game/game.routes';
import { leaderboardRouter } from '../modules/leaderboard/leaderboard.routes';
import { animeScenesRouter } from '../modules/anime-scenes/anime-scenes.routes';
import { usersRouter } from '../modules/users/users.routes';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'OtakuVersus API',
    timestamp: new Date().toISOString()
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/game', gameRouter);
apiRouter.use('/leaderboard', leaderboardRouter);
apiRouter.use('/scenes', animeScenesRouter);
apiRouter.use('/users', usersRouter);

export { apiRouter };
