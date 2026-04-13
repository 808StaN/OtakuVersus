import { EloLeaderboardRow, LeaderboardRow } from '../types/api';
import { apiRequest } from './http';

export function getLeaderboard(limit = 25) {
  return apiRequest<{ leaderboard: LeaderboardRow[] }>(`/leaderboard?limit=${limit}`);
}

export function getEloLeaderboard(limit = 25) {
  return apiRequest<{ leaderboard: EloLeaderboardRow[] }>(`/leaderboard/elo?limit=${limit}`);
}
