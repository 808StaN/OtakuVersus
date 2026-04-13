import { UserHistoryResponse } from '../types/api';
import { apiRequest } from './http';

export function getMyHistory(limit = 20) {
  return apiRequest<UserHistoryResponse>(`/users/me/history?limit=${limit}`);
}
