import { useQuery } from '@tanstack/react-query';
import { getAnimeTitles } from '../../api/scenes-api';

export function useAnimeTitlesQuery() {
  return useQuery({
    queryKey: ['anime-titles'],
    queryFn: getAnimeTitles
  });
}
