import React from 'react';
import { TechCard } from '@/components/ui/sabo-tech-global';
import { Swords, Clock, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechChallengesHeaderProps {
  liveChallengesCount?: number;
  className?: string;
}

export const TechChallengesHeader: React.FC<TechChallengesHeaderProps> = ({
  liveChallengesCount = 0,
  className
}) => {
  return (
    <div className={cn("sabo-tech-challenges-header", className)}>
      <div className="tech-header-border"></div>
      <div className="challenges-title-section">
        <h1 className="tech-challenges-title">THÁCH ĐẤU</h1>
        <div className="challenges-subtitle">SABO ARENA BATTLEGROUND</div>
      </div>
      <div className="live-challenges-indicator">
        <div className="live-dot"></div>
        <span className="live-count">{liveChallengesCount} ĐANG DIỄN RA</span>
      </div>
    </div>
  );
};