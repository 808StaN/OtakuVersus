import { Request, Response } from 'express';
import { getEloLeaderboard, getSingleplayerLeaderboard } from './leaderboard.service';

export async function leaderboardController(req: Request, res: Response) {
  const list = await getSingleplayerLeaderboard(Number(req.query.limit ?? 25));
  res.status(200).json({ leaderboard: list });
}

export async function eloLeaderboardController(req: Request, res: Response) {
  const list = await getEloLeaderboard(Number(req.query.limit ?? 25));
  res.status(200).json({ leaderboard: list });
}
