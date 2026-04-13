import { Request, Response } from 'express';
import { getUserGameHistory } from './users.service';

export async function getMyHistoryController(req: Request, res: Response) {
  const data = await getUserGameHistory(req.user!.id, Number(req.query.limit ?? 20));
  res.status(200).json(data);
}
