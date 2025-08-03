import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { getRankInfo } from '@/utils/rankDefinitions';

interface RankInfoProps {
  rank: string;
  showDescription?: boolean;
  showRequirements?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const RankInfo: React.FC<RankInfoProps> = ({
  rank,
  showDescription = false,
  showRequirements = false,
  variant = 'default',
  className = '',
}) => {
  const rankInfo = getRankInfo(rank);

  if (variant === 'compact') {
    return (
      <Badge variant='secondary' className={className}>
        {rankInfo.name}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <h3 className='font-semibold mb-2'>{rankInfo.name}</h3>
        <p className='text-muted-foreground mb-3'>{rankInfo.description}</p>
        <div>
          <h4 className='font-medium mb-2'>Yêu cầu kiểm tra:</h4>
          <ul className='space-y-1'>
            {rankInfo.requirements.map((req, index) => (
              <li key={index} className='flex items-center text-sm'>
                <CheckCircle className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className='font-medium'>{rankInfo.name}</div>
      {showDescription && (
        <div className='text-sm text-muted-foreground mt-1'>
          {rankInfo.description}
        </div>
      )}
      {showRequirements && (
        <div className='mt-2'>
          <div className='text-sm font-medium mb-1'>Yêu cầu:</div>
          <ul className='text-xs space-y-1'>
            {rankInfo.requirements.map((req, index) => (
              <li key={index} className='flex items-center'>
                <CheckCircle className='w-3 h-3 text-green-500 mr-1 flex-shrink-0' />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RankInfo;
