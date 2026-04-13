import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'Route not found'));
}
