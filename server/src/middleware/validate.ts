import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import { ApiError } from '../utils/api-error';

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      return next(
        new ApiError(
          400,
          parsed.error.errors
            .map((item) => `${item.path.join('.')}: ${item.message}`)
            .join(' | ')
        )
      );
    }

    const data = parsed.data as {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    req.body = (data.body ?? {}) as Request['body'];
    req.params = (data.params ?? {}) as Request['params'];
    req.query = (data.query ?? {}) as Request['query'];

    return next();
  };
}
