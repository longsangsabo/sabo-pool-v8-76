import { useState, useRef } from 'react';
import { X, Heart, Zap, MapPin, Trophy, Star } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface Opponent {
  id: string;
  name: string;
  age: number;
  avatar: string;
  coverImage?: string;
  ranking: string;
  location: string;
  wins: number;
  losses: number;
  winRate: number;
  isOnline: boolean;
  distance: number;
  bio: string;
  recentAchievements: string[];
}

interface SwipeCardProps {
  opponent: Opponent;
  onSwipe: (direction: 'left' | 'right' | 'up', opponent: Opponent) => void;
  isTop?: boolean;
}

const SwipeCard = ({ opponent, onSwipe, isTop = false }: SwipeCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;

    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction, opponent);
    } else if (info.offset.y < -threshold) {
      onSwipe('up', opponent);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing ${
        isTop ? 'z-10' : 'z-0'
      }`}
      style={{ x, rotate, opacity }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
    >
      <div className='w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden'>
        {/* Background Image */}
        <div className='h-3/4 relative'>
          <img
            src={opponent.coverImage || opponent.avatar}
            className='w-full h-full object-cover'
            alt={opponent.name}
          />

          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent' />

          {/* Online Status */}
          {opponent.isOnline && (
            <div className='absolute top-4 right-4'>
              <div className='w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse'></div>
            </div>
          )}

          {/* Distance */}
          <div className='absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full'>
            <div className='flex items-center space-x-1 text-white text-sm'>
              <MapPin className='w-3 h-3' />
              <span>{opponent.distance}km</span>
            </div>
          </div>

          {/* Player Info Overlay */}
          <div className='absolute bottom-4 left-4 right-4 text-white'>
            <div className='flex items-end justify-between'>
              <div>
                <h2 className='text-3xl font-bold'>
                  {opponent.name}, {opponent.age}
                </h2>
                <div className='flex items-center space-x-2 mt-2'>
                  <div className='bg-yellow-500 px-3 py-1 rounded-full'>
                    <span className='text-sm font-bold text-black'>
                      {opponent.ranking}
                    </span>
                  </div>
                  <span className='text-sm opacity-90'>
                    {opponent.location}
                  </span>
                </div>
                <p className='text-sm opacity-80 mt-2 line-clamp-2'>
                  {opponent.bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className='h-1/4 p-4 flex justify-between items-center bg-white'>
          <div className='text-center'>
            <div className='text-lg font-bold text-green-600'>
              {opponent.wins}
            </div>
            <div className='text-xs text-gray-500'>Thắng</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-red-600'>
              {opponent.losses}
            </div>
            <div className='text-xs text-gray-500'>Thua</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-blue-600'>
              {opponent.winRate}%
            </div>
            <div className='text-xs text-gray-500'>Tỷ lệ thắng</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-bold text-purple-600'>
              {opponent.recentAchievements.length}
            </div>
            <div className='text-xs text-gray-500'>Thành tích</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
