import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, RefreshCw, Table, Settings } from 'lucide-react';

interface ClubTable {
  id: string;
  table_number: number;
  table_name: string | null;
  status: string;
  current_match_id: string | null;
  last_used_at: string | null;
}

interface ClubTableManagerProps {
  onTablesInitialized?: () => void;
}

const ClubTableManager = ({ onTablesInitialized }: ClubTableManagerProps) => {
  const { user } = useAuth();
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [tableCount, setTableCount] = useState(8);
  const [clubId, setClubId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchClubId();
    }
  }, [user]);

  useEffect(() => {
    if (clubId) {
      fetchTables();
    }
  }, [clubId]);

  const fetchClubId = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setClubId(data.id);
      }
    } catch (error) {
      console.error('Error fetching club ID:', error);
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      // Temporarily disable table fetching until types are updated
      console.log(
        'Table fetching temporarily disabled until database types are updated'
      );
      setTables([]);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Không thể tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  const initializeTables = async () => {
    if (!clubId) {
      toast.error('Không tìm thấy thông tin câu lạc bộ');
      return;
    }

    setInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'initialize_tables',
            club_id: clubId,
            table_count: tableCount,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success(`Đã khởi tạo ${tableCount} bàn thành công!`);
        await fetchTables();
        onTablesInitialized?.();
      } else {
        throw new Error(data.error || 'Failed to initialize tables');
      }
    } catch (error) {
      console.error('Error initializing tables:', error);
      toast.error('Không thể khởi tạo bàn');
    } finally {
      setInitializing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: '✅', variant: 'default' as const, tooltip: 'Trống' },
      occupied: {
        label: '🔴',
        variant: 'destructive' as const,
        tooltip: 'Đang sử dụng',
      },
      maintenance: {
        label: '🔧',
        variant: 'secondary' as const,
        tooltip: 'Bảo trì',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: '❔',
      variant: 'outline' as const,
      tooltip: status,
    };

    return (
      <Badge
        variant={config.variant}
        className='text-xs px-1 py-0 h-5 min-w-[20px] flex items-center justify-center'
        title={config.tooltip}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Table className='w-5 h-5' />
          Quản lý Bàn Billiards
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {tables.length === 0 ? (
          <div className='text-center py-8 space-y-4'>
            <Table className='w-16 h-16 mx-auto text-muted-foreground' />
            <div>
              <h3 className='text-lg font-semibold'>
                Chưa có bàn nào được khởi tạo
              </h3>
              <p className='text-muted-foreground'>
                Khởi tạo bàn để có thể tự động phân bàn cho các trận đấu
              </p>
            </div>

            <div className='max-w-xs mx-auto space-y-4'>
              <div>
                <Label htmlFor='tableCount'>Số lượng bàn</Label>
                <Input
                  id='tableCount'
                  type='number'
                  min='1'
                  max='50'
                  value={tableCount}
                  onChange={e => setTableCount(parseInt(e.target.value) || 1)}
                  className='mt-1'
                />
              </div>

              <Button
                onClick={initializeTables}
                disabled={initializing}
                className='w-full'
              >
                {initializing ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <Plus className='w-4 h-4 mr-2' />
                    Khởi tạo {tableCount} bàn
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Compact stats header */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg'>
              <div className='text-center'>
                <div className='text-lg font-bold text-primary'>
                  {tables.length}
                </div>
                <div className='text-xs text-muted-foreground'>Tổng số bàn</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-green-600'>
                  {tables.filter(t => t.status === 'available').length}
                </div>
                <div className='text-xs text-muted-foreground'>Bàn trống</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-red-600'>
                  {tables.filter(t => t.status === 'occupied').length}
                </div>
                <div className='text-xs text-muted-foreground'>Đang đấu</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-bold text-yellow-600'>
                  {tables.filter(t => t.status === 'maintenance').length}
                </div>
                <div className='text-xs text-muted-foreground'>Bảo trì</div>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <h3 className='text-base font-semibold'>Danh sách bàn</h3>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchTables}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className='w-4 h-4 animate-spin' />
                ) : (
                  <RefreshCw className='w-4 h-4' />
                )}
              </Button>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2'>
              {tables.map(table => (
                <Card key={table.id} className='ultra-compact-table-card'>
                  <CardContent className='p-2'>
                    {/* Compact header with table number and status */}
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-semibold text-sm'>
                        Bàn {table.table_number}
                      </span>
                      {getStatusBadge(table.status)}
                    </div>

                    {/* Compact info using icons */}
                    <div className='space-y-0.5 text-xs text-muted-foreground'>
                      {table.table_name && (
                        <div className='truncate' title={table.table_name}>
                          📋 {table.table_name}
                        </div>
                      )}

                      {table.current_match_id && (
                        <div className='text-primary font-medium'>
                          🎯 Đang đấu
                        </div>
                      )}

                      {table.last_used_at && (
                        <div
                          className='truncate'
                          title={`Sử dụng lần cuối: ${new Date(table.last_used_at).toLocaleString('vi-VN')}`}
                        >
                          🕙{' '}
                          {new Date(table.last_used_at).toLocaleDateString(
                            'vi-VN',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                      )}

                      {!table.last_used_at && table.status === 'available' && (
                        <div className='text-green-600'>✅ Sẵn sàng</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubTableManager;
