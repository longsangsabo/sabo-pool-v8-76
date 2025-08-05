import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SectionHeaderProps {
  icon: string;
  title: string;
  count?: number;
  subtitle?: string;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  count,
  subtitle,
  action,
}) => {
  return (
    <div className='flex items-center justify-between mb-4'>
      <div className='flex items-center gap-3'>
        <span className='text-2xl'>{icon}</span>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-bold text-foreground'>{title}</h3>
            {count !== undefined && (
              <Badge variant='secondary' className='font-mono'>
                {count}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className='text-sm text-muted-foreground'>{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className='flex-shrink-0'>{action}</div>}
    </div>
  );
};

export default SectionHeader;
