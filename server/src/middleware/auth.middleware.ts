import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error';
import { verifyAccessToken } from '../utils/jwt';

function parseAuthUser(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.replace('Bearer ', '').trim();
  const payload = verifyAccessToken(token);

  return {
    id: payload.sub,
    email: payload.email,
    nickname: payload.nickname
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token missing'));
  }

  try {
    req.user = parseAuthUser(req) ?? undefined;
    return next();
  } catch (_error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = parseAuthUser(req) ?? undefined;
    return next();
  } catch (_error) {
    req.user = undefined;
    return next();
  }
}
