import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface TableBadgeProps {
  tableNumber: number;
  tableName?: string | null;
  tableStatus?: string;
  matchStatus?: string;
  className?: string;
}

export const TableBadge: React.FC<TableBadgeProps> = ({
  tableNumber,
  tableName,
  tableStatus = 'available',
  matchStatus = 'scheduled',
  className = '',
}) => {
  // Determine badge variant and color based on table and match status
  const getBadgeVariant = () => {
    if (matchStatus === 'completed') {
      return 'outline';
    }
    if (matchStatus === 'in_progress' || matchStatus === 'ongoing') {
      return 'default'; // Primary color for active matches
    }
    if (tableStatus === 'occupied' || matchStatus === 'ready') {
      return 'secondary'; // Assigned but not started
    }
    return 'outline'; // Default for scheduled
  };

  const getStatusColor = () => {
    if (matchStatus === 'completed') {
      return 'text-green-500';
    }
    if (matchStatus === 'in_progress' || matchStatus === 'ongoing') {
      return 'text-blue-500'; // Active/in progress
    }
    if (tableStatus === 'occupied' || matchStatus === 'ready') {
      return 'text-orange-500'; // Ready to start
    }
    return 'text-gray-500'; // Scheduled
  };

  const getStatusIcon = () => {
    return <Circle className={`h-2 w-2 ${getStatusColor()} fill-current`} />;
  };

  return (
    <Badge
      variant={getBadgeVariant()}
      className={`flex items-center gap-1.5 text-xs font-medium ${className}`}
    >
      {getStatusIcon()}
      <span>Bàn {tableNumber}</span>
      {tableName && (
        <span className='text-muted-foreground'>({tableName})</span>
      )}
    </Badge>
  );
};
