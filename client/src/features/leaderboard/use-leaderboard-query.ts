import { useQuery } from '@tanstack/react-query';
import { getEloLeaderboard, getLeaderboard } from '../../api/leaderboard-api';

export function useLeaderboardQuery(limit = 25) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getLeaderboard(limit)
  });
}

export function useEloLeaderboardQuery(limit = 25) {
  return useQuery({
    queryKey: ['leaderboard', 'elo', limit],
    queryFn: () => getEloLeaderboard(limit)
  });
}
