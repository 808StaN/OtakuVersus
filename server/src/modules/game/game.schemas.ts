import { z } from 'zod';

export const startGameSchema = z.object({
  body: z.object({
    roundsCount: z.number().int().min(3).max(20).optional().default(5)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const sessionIdParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional().default({})
});

export const answerSchema = z.object({
  body: z.object({
    selectedAnswer: z.string().min(1),
    responseTimeMs: z.number().int().min(0).max(120000).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional().default({})
});

export const finishSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional().default({})
});

export const multiplayerJoinSchema = z.object({
  body: z.object({
    roundsCount: z.number().int().min(3).max(20).optional().default(5)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const multiplayerStatusParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    ticketId: z.string().min(1)
  }),
  query: z.object({}).optional().default({})
});

export const multiplayerSessionParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z
    .object({
      roundOrder: z
        .union([z.string(), z.number()])
        .optional()
        .transform((value) => (value === undefined ? undefined : Number(value)))
    })
    .optional()
    .default({})
});

export const multiplayerRoundResultParamsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: z.string().min(1),
    roundOrder: z
      .union([z.string(), z.number()])
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value > 0, 'roundOrder must be positive integer')
  }),
  query: z.object({}).optional().default({})
});
