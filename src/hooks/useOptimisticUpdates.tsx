import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type OptimisticOperation = 'delete' | 'update' | 'create' | 'restore';

interface OptimisticConfig {
  queryKeys: string[][];
  operation: OptimisticOperation;
  entityId: string;
  optimisticUpdate?: (oldData: any) => any;
  rollbackMessage?: string;
}

export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  const performOptimisticUpdate = async <T,>(
    config: OptimisticConfig,
    asyncOperation: () => Promise<T>
  ): Promise<T> => {
    const {
      queryKeys,
      operation,
      entityId,
      optimisticUpdate,
      rollbackMessage,
    } = config;

    // Store previous data for rollback
    const previousData: { [key: string]: any } = {};

    // Apply optimistic updates
    queryKeys.forEach(queryKey => {
      const key = JSON.stringify(queryKey);
      previousData[key] = queryClient.getQueryData(queryKey);

      if (optimisticUpdate && previousData[key]) {
        queryClient.setQueryData(queryKey, optimisticUpdate(previousData[key]));
      } else {
        // Default optimistic updates for common operations
        if (operation === 'delete' && previousData[key]) {
          if (Array.isArray(previousData[key])) {
            queryClient.setQueryData(
              queryKey,
              previousData[key].filter((item: any) => item.id !== entityId)
            );
          } else if (previousData[key].tournaments) {
            queryClient.setQueryData(queryKey, {
              ...previousData[key],
              tournaments: previousData[key].tournaments.filter(
                (item: any) => item.id !== entityId
              ),
            });
          }
        }
      }
    });

    try {
      // Perform the actual operation
      const result = await asyncOperation();

      // Invalidate and refetch to ensure consistency
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      return result;
    } catch (error) {
      // Rollback optimistic updates
      queryKeys.forEach(queryKey => {
        const key = JSON.stringify(queryKey);
        if (previousData[key] !== undefined) {
          queryClient.setQueryData(queryKey, previousData[key]);
        }
      });

      toast.error(
        rollbackMessage || 'Thao tác thất bại, đã khôi phục trạng thái trước đó'
      );
      throw error;
    }
  };

  const createStandardOptimisticDelete = (entityType: string) => {
    return (entityId: string, asyncDeleteFn: () => Promise<any>) => {
      return performOptimisticUpdate(
        {
          queryKeys: [[`${entityType}s`], [entityType, entityId]],
          operation: 'delete',
          entityId,
          rollbackMessage: `Không thể xóa ${entityType}`,
        },
        asyncDeleteFn
      );
    };
  };

  const createStandardOptimisticUpdate = (entityType: string) => {
    return (
      entityId: string,
      updates: any,
      asyncUpdateFn: () => Promise<any>
    ) => {
      return performOptimisticUpdate(
        {
          queryKeys: [[`${entityType}s`], [entityType, entityId]],
          operation: 'update',
          entityId,
          optimisticUpdate: (oldData: any) => {
            if (Array.isArray(oldData)) {
              return oldData.map(item =>
                item.id === entityId ? { ...item, ...updates } : item
              );
            } else if (oldData.tournaments) {
              return {
                ...oldData,
                tournaments: oldData.tournaments.map((item: any) =>
                  item.id === entityId ? { ...item, ...updates } : item
                ),
              };
            } else if (oldData.id === entityId) {
              return { ...oldData, ...updates };
            }
            return oldData;
          },
          rollbackMessage: `Không thể cập nhật ${entityType}`,
        },
        asyncUpdateFn
      );
    };
  };

  return {
    performOptimisticUpdate,
    optimisticDelete: createStandardOptimisticDelete('tournament'),
    optimisticUpdate: createStandardOptimisticUpdate('tournament'),
  };
};
