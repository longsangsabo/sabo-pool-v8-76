import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Award } from 'lucide-react';

interface RankHistoryItem {
  id: string;
  old_rank: string;
  new_rank: string;
  old_points: number;
  new_points: number;
  reason: string;
  created_at: string;
}

const RankHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<RankHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRankHistory();
    }
  }, [user]);

  const fetchRankHistory = async () => {
    try {
      // Use mock data since ranking_history table doesn't exist
      const mockHistory = [
        {
          id: '1',
          old_rank: 'I',
          new_rank: 'H+',
          old_points: 1200,
          new_points: 1350,
          reason: 'Won tournament match',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          old_rank: 'K+',
          new_rank: 'I',
          old_points: 1000,
          new_points: 1200,
          reason: 'Challenge victory',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching rank history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    if (rank?.startsWith('E'))
      return 'bg-purple-100 text-purple-800 border-purple-200';
    if (rank?.startsWith('F')) return 'bg-red-100 text-red-800 border-red-200';
    if (rank?.startsWith('G'))
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank?.startsWith('H'))
      return 'bg-green-100 text-green-800 border-green-200';
    if (rank?.startsWith('I'))
      return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rank?.startsWith('K'))
      return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-gray-100 text-gray-800';
  };

  const isRankUp = (oldRank: string, newRank: string) => {
    const rankOrder = [
      'K',
      'K+',
      'I',
      'I+',
      'H',
      'H+',
      'G',
      'G+',
      'F',
      'F+',
      'E',
      'E+',
    ];
    return rankOrder.indexOf(newRank) > rankOrder.indexOf(oldRank);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Lịch sử hạng mùa trước
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Lịch sử hạng mùa trước
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className='space-y-4'>
            {history.map(item => (
              <div
                key={item.id}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Badge className={getRankColor(item.old_rank)}>
                      {item.old_rank}
                    </Badge>
                    <span className='text-gray-400'>→</span>
                    <Badge className={getRankColor(item.new_rank)}>
                      {item.new_rank}
                    </Badge>
                  </div>

                  <div className='flex items-center text-sm text-gray-600'>
                    {isRankUp(item.old_rank, item.new_rank) ? (
                      <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                    ) : (
                      <TrendingUp className='w-4 h-4 text-red-500 mr-1 rotate-180' />
                    )}
                    <span>
                      {item.old_points} → {item.new_points} điểm
                    </span>
                  </div>
                </div>

                <div className='text-right'>
                  <div className='flex items-center text-xs text-gray-500 mb-1'>
                    <Calendar className='w-3 h-3 mr-1' />
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </div>
                  {item.reason && (
                    <p className='text-xs text-gray-600 max-w-xs truncate'>
                      {item.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8'>
            <Award className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500 font-medium'>
              Chưa có lịch sử thay đổi hạng
            </p>
            <p className='text-sm text-gray-400 mt-1'>
              Lịch sử thăng/hạ hạng sẽ được hiển thị tại đây
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankHistory;
