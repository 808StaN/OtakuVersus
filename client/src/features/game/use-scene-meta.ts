import { useQuery } from '@tanstack/react-query';
import { getAnimeTitles, getDifficulties } from '../../api/scenes-api';

export function useDifficultiesQuery() {
  return useQuery({
    queryKey: ['scene-difficulties'],
    queryFn: getDifficulties
  });
}

export function useAnimeTitlesQuery() {
  return useQuery({
    queryKey: ['anime-titles'],
    queryFn: getAnimeTitles
  });
}
