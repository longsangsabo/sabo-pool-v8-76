import React from 'react';
import { Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechChallengeFabProps {
  onCreateChallenge: () => void;
  className?: string;
}

export const TechChallengeFab: React.FC<TechChallengeFabProps> = ({
  onCreateChallenge,
  className
}) => {
  return (
    <div className={cn("tech-challenge-fab", className)}>
      <button className="sabo-tech-fab-primary" onClick={onCreateChallenge}>
        <div className="fab-border"></div>
        <div className="fab-content">
          <Swords className="w-6 h-6" />
          <span className="fab-text">TẠO THÁCH ĐẤU</span>
        </div>
        <div className="fab-glow"></div>
      </button>
    </div>
  );
};