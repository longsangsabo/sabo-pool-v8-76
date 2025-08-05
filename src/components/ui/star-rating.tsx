import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={index}
            type='button'
            onClick={() => handleStarClick(starValue)}
            disabled={readonly}
            className={cn(
              'transition-colors',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
