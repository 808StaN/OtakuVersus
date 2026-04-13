import { apiRequest } from './http';

export function getDifficulties() {
  return apiRequest<{ difficulties: string[] }>('/scenes/difficulties');
}

export function getAnimeTitles() {
  return apiRequest<{ titles: string[] }>('/scenes/titles');
}
