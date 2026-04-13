import { LeaderboardRow } from '../types/api';
import { apiRequest } from './http';

export function getLeaderboard(limit = 25) {
  return apiRequest<{ leaderboard: LeaderboardRow[] }>(`/leaderboard?limit=${limit}`);
}
