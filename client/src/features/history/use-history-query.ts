import { useQuery } from '@tanstack/react-query';
import { getMyHistory } from '../../api/users-api';

export function useHistoryQuery(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['history', limit],
    queryFn: () => getMyHistory(limit),
    enabled
  });
}
