import { useQuery } from '@tanstack/react-query';
import { BaseEntityService } from '@/services/BaseEntityService';

export const useSoftDeleteStats = () => {
  return useQuery({
    queryKey: ['soft-delete-stats'],
    queryFn: () => BaseEntityService.getSoftDeleteStats('tournaments'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export interface SoftDeleteStatsData {
  tournaments: {
    total: number;
    visible: number;
    deleted: number;
    hidden: number;
  };
  profiles: {
    total: number;
    visible: number;
    deleted: number;
    hidden: number;
  };
  challenges: {
    total: number;
    visible: number;
    deleted: number;
    hidden: number;
  };
  [key: string]: {
    total: number;
    visible: number;
    deleted: number;
    hidden: number;
  };
}
