import { AuthPayload } from '../types/api';
import { apiRequest } from './http';

export function register(payload: { email: string; nickname: string; password: string }) {
  return apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    body: payload
  });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: payload
  });
}

export function me(token: string) {
  return apiRequest<{ user: AuthPayload['user'] }>('/auth/me', { token });
}
