import { DifficultyLevel } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export async function getSceneCategories() {
  const totalScenes = await prisma.scene.count();

  return {
    categories: [] as string[],
    counts: [],
    totalScenes
  };
}

export function getSceneDifficulties() {
  return {
    difficulties: Object.values(DifficultyLevel)
  };
}

export async function getAnimeTitles() {
  const titles = await prisma.animeTitle.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      name: true
    }
  });

  return {
    titles: titles.map((item) => item.name)
  };
}
