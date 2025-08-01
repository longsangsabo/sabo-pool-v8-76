/**
 * Virtualized Tournament List Component
 * Optimizes rendering of large tournament lists using react-window
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tournament } from '@/types/tournament';
import { TournamentAdapter } from '@/utils/tournamentAdapter';
import { useLanguage } from '@/contexts/LanguageContext';
import { performanceMonitor } from '@/utils/performance';
import { EnhancedTournamentCard } from './EnhancedTournamentCard';

interface VirtualizedTournamentListProps {
  tournaments: Tournament[];
  onTournamentClick: (tournamentId: string) => void;
  onRegister: (tournamentId: string) => void;
  isRegistered: (tournamentId: string) => boolean;
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  height?: number;
}

// Enhanced Tournament List Item using new EnhancedTournamentCard
const TournamentListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    tournaments: Tournament[];
    onTournamentClick: (id: string) => void;
    onRegister: (id: string) => void;
    isRegistered: (id: string) => boolean;
    t: (key: string) => string;
  };
}>(({ index, style, data }) => {
  const { tournaments, onTournamentClick, onRegister, isRegistered } = data;
  const tournament = tournaments[index];

  if (!tournament) {
    return (
      <div style={style} className='p-2'>
        <Card className='h-full'>
          <CardContent className='p-4 space-y-3'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <div className='flex justify-between'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-24' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={style} className='p-2'>
      <EnhancedTournamentCard
        tournament={TournamentAdapter.toEnhanced(tournament)}
        onTournamentClick={onTournamentClick}
        onRegister={onRegister}
        isRegistered={isRegistered}
        className='h-full'
      />
    </div>
  );
});

TournamentListItem.displayName = 'TournamentListItem';

// Main Virtualized List Component
export const VirtualizedTournamentList = memo<VirtualizedTournamentListProps>(
  ({
    tournaments,
    onTournamentClick,
    onRegister,
    isRegistered,
    loading = false,
    hasNextPage = false,
    loadNextPage,
    height = 600,
  }) => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    // Memoized item data
    const itemData = useMemo(
      () => ({
        tournaments,
        onTournamentClick,
        onRegister,
        isRegistered,
        t,
      }),
      [tournaments, onTournamentClick, onRegister, isRegistered, t]
    );

    // Load more items for infinite scrolling
    const loadMoreItems = useCallback(async () => {
      if (isLoading || !loadNextPage) return;

      setIsLoading(true);
      try {
        await loadNextPage();
      } finally {
        setIsLoading(false);
      }
    }, [isLoading, loadNextPage]);

    // Check if item is loaded
    const isItemLoaded = useCallback(
      (index: number) => {
        return !!tournaments[index];
      },
      [tournaments]
    );

    // Calculate total item count (add buffer for loading)
    const itemCount = hasNextPage ? tournaments.length + 1 : tournaments.length;

    if (loading && tournaments.length === 0) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className='h-[280px]'>
              <CardContent className='p-4 space-y-3'>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-20 w-full' />
                <div className='flex justify-between'>
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-24' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className='h-full'>
        {loadNextPage ? (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={height}
                itemCount={itemCount}
                itemSize={320} // Height adjusted for EnhancedTournamentCard + padding
                itemData={itemData}
                onItemsRendered={onItemsRendered}
                overscanCount={2} // Render 2 extra items outside visible area
                className='tournament-list'
              >
                {TournamentListItem}
              </List>
            )}
          </InfiniteLoader>
        ) : (
          <List
            height={height}
            itemCount={tournaments.length}
            itemSize={320}
            itemData={itemData}
            overscanCount={2}
            className='tournament-list'
          >
            {TournamentListItem}
          </List>
        )}
      </div>
    );
  }
);

VirtualizedTournamentList.displayName = 'VirtualizedTournamentList';
