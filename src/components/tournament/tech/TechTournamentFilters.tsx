import React from 'react';
import { TechInput, TechButton } from '@/components/ui/sabo-tech-global';
import { Search, Filter, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechTournamentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onCreateTournament?: () => void;
  className?: string;
}

export const TechTournamentFilters: React.FC<TechTournamentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onCreateTournament,
  className
}) => {
  const filterOptions = [
    { value: 'all', label: 'TẤT CẢ' },
    { value: 'registration_open', label: 'ĐANG MỞ ĐK' },
    { value: 'ongoing', label: 'ĐANG DIỄN RA' },
    { value: 'completed', label: 'ĐÃ KẾT THÚC' }
  ];

  return (
    <div className={cn("tech-tournament-filters", className)}>
      <div className="tech-filter-container">
        <div className="sabo-tech-input">
          <div className="tech-input-border"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tech-blue w-4 h-4" />
            <input 
              className="tech-input-field pl-10" 
              placeholder="TÌM KIẾM GIẢI ĐẤU..."
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="tech-filter-buttons">
          {filterOptions.map((option) => (
            <TechButton
              key={option.value}
              variant={statusFilter === option.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onStatusChange(option.value)}
            >
              {option.label}
            </TechButton>
          ))}
        </div>

        {onCreateTournament && (
          <div className="tech-action-buttons">
            <TechButton
              variant="success"
              onClick={onCreateTournament}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              TẠO GIẢI ĐẤU
            </TechButton>
          </div>
        )}
      </div>
    </div>
  );
};