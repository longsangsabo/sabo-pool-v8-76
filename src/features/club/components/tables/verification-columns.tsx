import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';

// Define the data type
export type RankVerification = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rank_name: string;
  rank_level: number;
  created_at: string;
  evidence_urls: string[];
};

// Define table columns
export const columns: ColumnDef<RankVerification>[] = [
  {
    accessorKey: 'user',
    header: 'Người chơi',
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className='flex items-center gap-3'>
          <Avatar>
            <AvatarImage src={data.user_avatar} />
            <AvatarFallback>
              {data.user_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium'>{data.user_name}</p>
            <p className='text-xs text-muted-foreground'>
              ID: {data.user_id.substring(0, 8)}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'rank_name',
    header: 'Cấp độ yêu cầu',
    cell: ({ row }) => {
      const level = row.original.rank_level;
      const name = row.original.rank_name;

      let badgeClass = 'bg-gray-200 text-gray-800';
      if (level >= 7) badgeClass = 'bg-yellow-200 text-yellow-800';
      if (level >= 10) badgeClass = 'bg-blue-200 text-blue-800';
      if (level >= 13) badgeClass = 'bg-purple-200 text-purple-800';

      return <Badge className={badgeClass}>{name}</Badge>;
    },
  },
  {
    accessorKey: 'evidence',
    header: 'Bằng chứng',
    cell: ({ row }) => {
      const evidence = row.original.evidence_urls || [];
      return (
        <div className='flex gap-2'>
          {evidence.map((url, index) => (
            <Button
              key={index}
              size='sm'
              variant='outline'
              onClick={() => window.open(url, '_blank')}
            >
              Xem #{index + 1}
            </Button>
          ))}
          {evidence.length === 0 && (
            <span className='text-sm text-muted-foreground'>Không có</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Ngày yêu cầu',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return <span>{date.toLocaleDateString('vi-VN')}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Hành động',
    cell: ({ row }) => {
      return (
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='default'
            className='bg-green-600 hover:bg-green-700'
            // In a real implementation, this would call approveRankClaim
            onClick={() => console.log('Approve rank claim', row.original.id)}
          >
            Xác nhận
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='text-red-600 border-red-600 hover:bg-red-50'
            // In a real implementation, this would call rejectRankClaim
            onClick={() => console.log('Reject rank claim', row.original.id)}
          >
            Từ chối
          </Button>
        </div>
      );
    },
  },
];
