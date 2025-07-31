import React from 'react';
import { TechHeader } from '@/components/ui/sabo-tech-global';
import { cn } from '@/lib/utils';

interface TechTournamentHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const TechTournamentHeader: React.FC<TechTournamentHeaderProps> = ({
  title = "GIẢI ĐẤU BILLIARDS",
  subtitle = "SABO ARENA CHAMPIONSHIP",
  className
}) => {
  return (
    <div className={cn("sabo-tech-tournament-header", className)}>
      <div className="tech-header-border"></div>
      <div className="tournament-title-section">
        <h1 className="tech-tournament-title">{title}</h1>
        <div className="tournament-subtitle">{subtitle}</div>
      </div>
      <div className="tech-header-circuit"></div>
    </div>
  );
};