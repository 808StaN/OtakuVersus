import { Request, Response } from 'express';
import { getLeaderboard } from './leaderboard.service';

export async function leaderboardController(req: Request, res: Response) {
  const list = await getLeaderboard(Number(req.query.limit ?? 25));
  res.status(200).json({ leaderboard: list });
}
