import { getStoredToken } from '../utils/token-storage';
import { getOrCreateGuestId } from '../utils/guest-id';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? getStoredToken();
  const guestId = getOrCreateGuestId();
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': guestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: 'Request failed' }))) as {
      message?: string;
    };

    throw new HttpError(response.status, errorBody.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}
