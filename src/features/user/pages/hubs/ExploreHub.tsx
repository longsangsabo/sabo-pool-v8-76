import React from 'react';
import { MainLayout } from '@/components/MainLayout';

/**
 * ExploreHub - User exploration and discovery hub
 * Browse clubs, tournaments, players, and content discovery
 */
const ExploreHub: React.FC = () => {
  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-6'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Explore Hub</h1>
              <p className='text-muted-foreground'>
                Discover clubs, tournaments, players, and exciting content
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className='w-full max-w-md'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search clubs, tournaments, players...'
                className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <button className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                🔍
              </button>
            </div>
          </div>

          {/* Quick Categories */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border bg-card p-6 cursor-pointer hover:shadow-md transition-shadow'>
              <div className='text-2xl mb-2'>🏢</div>
              <h3 className='font-semibold'>Clubs</h3>
              <p className='text-sm text-muted-foreground'>
                Find and join clubs
              </p>
            </div>

            <div className='rounded-lg border bg-card p-6 cursor-pointer hover:shadow-md transition-shadow'>
              <div className='text-2xl mb-2'>🏆</div>
              <h3 className='font-semibold'>Tournaments</h3>
              <p className='text-sm text-muted-foreground'>
                Browse competitions
              </p>
            </div>

            <div className='rounded-lg border bg-card p-6 cursor-pointer hover:shadow-md transition-shadow'>
              <div className='text-2xl mb-2'>👥</div>
              <h3 className='font-semibold'>Players</h3>
              <p className='text-sm text-muted-foreground'>
                Connect with players
              </p>
            </div>

            <div className='rounded-lg border bg-card p-6 cursor-pointer hover:shadow-md transition-shadow'>
              <div className='text-2xl mb-2'>⚡</div>
              <h3 className='font-semibold'>Quick Match</h3>
              <p className='text-sm text-muted-foreground'>
                Find instant games
              </p>
            </div>
          </div>

          {/* Featured Content */}
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Featured Clubs */}
            <div className='rounded-lg border bg-card p-6'>
              <h2 className='text-lg font-semibold mb-4'>Featured Clubs</h2>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 border rounded'>
                  <div>
                    <h3 className='font-medium'>Elite Pool Club</h3>
                    <p className='text-sm text-muted-foreground'>
                      125 members • Premium
                    </p>
                  </div>
                  <button className='px-3 py-1 bg-primary text-primary-foreground rounded text-sm'>
                    Join
                  </button>
                </div>
                <div className='flex items-center justify-between p-3 border rounded'>
                  <div>
                    <h3 className='font-medium'>City Champions</h3>
                    <p className='text-sm text-muted-foreground'>
                      89 members • Open
                    </p>
                  </div>
                  <button className='px-3 py-1 bg-primary text-primary-foreground rounded text-sm'>
                    Join
                  </button>
                </div>
                <div className='text-center pt-2'>
                  <button className='text-sm text-primary hover:underline'>
                    View all clubs →
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Tournaments */}
            <div className='rounded-lg border bg-card p-6'>
              <h2 className='text-lg font-semibold mb-4'>
                Upcoming Tournaments
              </h2>
              <div className='space-y-3'>
                <div className='p-3 border rounded'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-medium'>Weekend Championship</h3>
                    <span className='text-sm bg-green-100 text-green-800 px-2 py-1 rounded'>
                      Open
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Starts in 2 days • 32 players max • $500 prize
                  </p>
                </div>
                <div className='p-3 border rounded'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-medium'>Rookie League</h3>
                    <span className='text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                      Beginner
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Starts in 5 days • 16 players max • Free entry
                  </p>
                </div>
                <div className='text-center pt-2'>
                  <button className='text-sm text-primary hover:underline'>
                    View all tournaments →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Top Players */}
          <div className='rounded-lg border bg-card p-6'>
            <h2 className='text-lg font-semibold mb-4'>
              Top Players This Week
            </h2>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {[1, 2, 3, 4].map(rank => (
                <div
                  key={rank}
                  className='flex items-center space-x-3 p-3 border rounded'
                >
                  <div className='text-lg font-bold text-primary'>#{rank}</div>
                  <div className='flex-1'>
                    <h3 className='font-medium'>Player {rank}</h3>
                    <p className='text-sm text-muted-foreground'>
                      Rating: {2000 - rank * 50}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExploreHub;
