import React from 'react';
import { cn } from '@/lib/utils';
import { getTrustScoreInfo, formatTrustScore } from '@/utils/trust-score';

interface TrustScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Trust Score Badge Component with color coding
 * 🟢 Uy tín cao (≥80%) - Dark green
 * 🔵 Khá tốt (60-79%) - Blue
 * 🟡 Trung bình (40-59%) - Yellow
 * 🔴 Cần cải thiện (<40%) - Red
 */
export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const trustInfo = getTrustScoreInfo(score);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        trustInfo.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      <span>{formatTrustScore(score)}</span>
      {showLabel && <span className='font-medium'>{trustInfo.label}</span>}
    </div>
  );
};

/**
 * Compact trust score display for lists/tables
 */
export const TrustScoreCompact: React.FC<{
  score: number;
  className?: string;
}> = ({ score, className }) => {
  const trustInfo = getTrustScoreInfo(score);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        trustInfo.badgeClass,
        className
      )}
    >
      {formatTrustScore(score)}
    </span>
  );
};

/**
 * Trust score with progress bar
 */
export const TrustScoreProgress: React.FC<{
  score: number;
  showPercentage?: boolean;
  className?: string;
}> = ({ score, showPercentage = true, className }) => {
  const trustInfo = getTrustScoreInfo(score);

  return (
    <div className={cn('space-y-1', className)}>
      <div className='flex justify-between items-center'>
        <span className='text-sm font-medium text-foreground'>
          {trustInfo.label}
        </span>
        {showPercentage && (
          <span className='text-sm font-semibold text-foreground'>
            {formatTrustScore(score)}
          </span>
        )}
      </div>
      <div className='w-full bg-muted rounded-full h-2'>
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            trustInfo.bgColor
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};
