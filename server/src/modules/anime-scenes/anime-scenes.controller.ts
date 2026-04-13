import { Request, Response } from 'express';
import { getAnimeTitles, getSceneCategories, getSceneDifficulties } from './anime-scenes.service';

export async function categoriesController(_req: Request, res: Response) {
  const payload = await getSceneCategories();
  res.status(200).json(payload);
}

export async function difficultiesController(_req: Request, res: Response) {
  const payload = getSceneDifficulties();
  res.status(200).json(payload);
}

export async function titlesController(_req: Request, res: Response) {
  const payload = await getAnimeTitles();
  res.status(200).json(payload);
}
