import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  loginController,
  meController,
  registerController
} from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(registerController));
authRouter.post('/login', validate(loginSchema), asyncHandler(loginController));
authRouter.get('/me', requireAuth, asyncHandler(meController));

export { authRouter };
