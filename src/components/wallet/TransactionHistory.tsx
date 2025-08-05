import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Swords,
  CalendarCheck,
  Video,
  TrendingDown,
  Gift,
} from 'lucide-react';

interface SPATransaction {
  id: string;
  user_id: string;
  points_earned: number;
  source_type: string;
  source_id?: string;
  description: string;
  created_at: string;
}

interface TransactionHistoryProps {
  userId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [transactions, setTransactions] = useState<SPATransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (!user?.id) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('spa_points_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTransactions((data as any[]) || []);
      } catch (error) {
        console.error('Failed to fetch SPA transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();

    // Set up real-time subscription
    const subscription = supabase
      .channel('spa-transactions-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spa_points_log',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const newTransaction = payload.new as SPATransaction;
          setTransactions(prev => [newTransaction, ...prev.slice(0, 49)]);
          // Invalidate user profile to refresh SPA balance
          queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  const filters = [
    { id: 'all', name: 'Tất cả', icon: <Filter className='h-4 w-4' /> },
    {
      id: 'tournament',
      name: 'Giải đấu',
      icon: <Trophy className='h-4 w-4' />,
    },
    {
      id: 'challenge',
      name: 'Thách đấu',
      icon: <Swords className='h-4 w-4' />,
    },
    {
      id: 'checkin',
      name: 'Check-in',
      icon: <CalendarCheck className='h-4 w-4' />,
    },
    { id: 'video', name: 'Video', icon: <Video className='h-4 w-4' /> },
    { id: 'registration', name: 'Đăng ký', icon: <Gift className='h-4 w-4' /> },
    {
      id: 'decay',
      name: 'Giảm điểm',
      icon: <TrendingDown className='h-4 w-4' />,
    },
  ];

  // Remove status filters since SPA transactions are always completed

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className='h-4 w-4 text-yellow-600' />;
      case 'challenge':
        return <Swords className='h-4 w-4 text-red-600' />;
      case 'checkin':
        return <CalendarCheck className='h-4 w-4 text-green-600' />;
      case 'video':
        return <Video className='h-4 w-4 text-blue-600' />;
      case 'registration':
        return <Gift className='h-4 w-4 text-purple-600' />;
      case 'decay':
        return <TrendingDown className='h-4 w-4 text-gray-600' />;
      default:
        return <Plus className='h-4 w-4 text-gray-600' />;
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'Giải đấu';
      case 'challenge':
        return 'Thách đấu';
      case 'checkin':
        return 'Check-in';
      case 'video':
        return 'Video';
      case 'registration':
        return 'Đăng ký';
      case 'decay':
        return 'Giảm điểm';
      default:
        return type;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'text-yellow-600 bg-yellow-100';
      case 'challenge':
        return 'text-red-600 bg-red-100';
      case 'checkin':
        return 'text-green-600 bg-green-100';
      case 'video':
        return 'text-blue-600 bg-blue-100';
      case 'registration':
        return 'text-purple-600 bg-purple-100';
      case 'decay':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPoints = (points: number) => {
    return `${points >= 0 ? '+' : ''}${points.toLocaleString('vi-VN')} SPA`;
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTypeFilter =
        selectedFilter === 'all' || transaction.source_type === selectedFilter;

      return matchesSearch && matchesTypeFilter;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const exportTransactions = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Thời gian,Loại,Mô tả,Điểm\n' +
      filteredTransactions
        .map(
          t =>
            `${new Date(t.created_at).toLocaleString('vi-VN')},${getTransactionTypeName(t.source_type)},${t.description},${t.points_earned}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'spa_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Filters and Search */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm giao dịch...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Button variant='outline' onClick={exportTransactions}>
              <Download className='h-4 w-4 mr-2' />
              Xuất báo cáo
            </Button>
          </div>

          <div className='flex flex-wrap gap-2 mt-4'>
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.icon}
                {filter.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SPA Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lịch sử SPA Points ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredTransactions.map(transaction => (
              <div
                key={transaction.id}
                className='flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow'
              >
                {/* Transaction Icon */}
                <div
                  className={`p-2 rounded-full ${getSourceColor(transaction.source_type)}`}
                >
                  {getTransactionIcon(transaction.source_type)}
                </div>

                {/* Transaction Details */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='font-medium'>
                      {getTransactionTypeName(transaction.source_type)}
                    </span>
                    {transaction.points_earned > 0 ? (
                      <Badge className='bg-green-100 text-green-800 text-xs'>
                        🏆 Nhận điểm
                      </Badge>
                    ) : (
                      <Badge className='bg-red-100 text-red-800 text-xs'>
                        📉 Mất điểm
                      </Badge>
                    )}
                  </div>

                  <p className='text-sm text-gray-600 mb-1'>
                    {transaction.description}
                  </p>

                  <div className='flex items-center gap-4 text-xs text-gray-500'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {new Date(transaction.created_at).toLocaleDateString(
                          'vi-VN'
                        )}{' '}
                        {new Date(transaction.created_at).toLocaleTimeString(
                          'vi-VN',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>
                    {transaction.source_id && (
                      <span>ID: {transaction.source_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className='text-right'>
                  <div
                    className={`text-lg font-bold ${
                      transaction.points_earned >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatPoints(transaction.points_earned)}
                  </div>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && !isLoading && (
              <div className='text-center py-8 text-gray-500'>
                <Trophy className='h-12 w-12 mx-auto mb-3 opacity-50' />
                <p>Chưa có giao dịch SPA nào</p>
                <p className='text-sm'>
                  Tham gia thách đấu hoặc giải đấu để bắt đầu kiếm SPA points!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
