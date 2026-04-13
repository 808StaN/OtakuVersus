import { Request, Response } from 'express';
import { loginUser, registerUser, getCurrentUser } from './auth.service';

export async function registerController(req: Request, res: Response) {
  const response = await registerUser(req.body);
  res.status(201).json(response);
}

export async function loginController(req: Request, res: Response) {
  const response = await loginUser(req.body);
  res.status(200).json(response);
}

export async function meController(req: Request, res: Response) {
  const user = await getCurrentUser(req.user!.id);
  res.status(200).json({ user });
}
