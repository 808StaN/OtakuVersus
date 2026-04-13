import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../../api/leaderboard-api';

export function useLeaderboardQuery(limit = 25) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getLeaderboard(limit)
  });
}
