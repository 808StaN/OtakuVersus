import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(1000).optional().default(25)
  })
});
