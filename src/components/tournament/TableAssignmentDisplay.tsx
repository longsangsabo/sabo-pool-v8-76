import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClubTable {
  id: string;
  table_number: number;
  table_name: string;
  status: string;
  current_match_id?: string;
  last_used_at?: string;
  tournament_matches?: {
    id: string;
    round_number: number;
    match_number: number;
    status: string;
    player1_id: string;
    player2_id: string;
    tournament_id: string;
    player1?: { full_name: string; display_name: string };
    player2?: { full_name: string; display_name: string };
    tournaments?: { name: string };
  } | null;
}

interface TableAssignmentDisplayProps {
  clubId: string;
  tournamentId?: string;
  showManagement?: boolean;
}

const TableAssignmentDisplay: React.FC<TableAssignmentDisplayProps> = ({
  clubId,
  tournamentId,
  showManagement = false,
}) => {
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);

  // Fetch table status with match information
  const fetchTableStatus = async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_tables')
        .select(
          `
          *,
          tournament_matches!current_match_id (
            id,
            round_number,
            match_number,
            status,
            player1_id,
            player2_id,
            tournament_id,
            tournaments(name)
          )
        `
        )
        .eq('club_id', clubId)
        .order('table_number');

      if (error) throw error;

      setTables((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching table status:', error);
      toast.error('Lỗi khi tải trạng thái bàn chơi');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available matches for assignment
  const fetchAvailableMatches = async () => {
    if (!tournamentId) return;

    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          round_number,
          match_number,
          status,
          player1_id,
          player2_id,
          assigned_table_id
        `
        )
        .eq('tournament_id', tournamentId)
        .eq('status', 'scheduled')
        .is('assigned_table_id', null)
        .not('player1_id', 'is', null)
        .not('player2_id', 'is', null);

      if (error) throw error;

      setAvailableMatches(data || []);
    } catch (error) {
      console.error('Error fetching available matches:', error);
    }
  };

  // Initialize club tables
  const initializeTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'initialize_tables',
            club_id: clubId,
          },
        }
      );

      if (error) throw error;

      toast.success(data.message);
      await fetchTableStatus();
    } catch (error) {
      console.error('Error initializing tables:', error);
      toast.error('Lỗi khi khởi tạo bàn chơi');
    } finally {
      setLoading(false);
    }
  };

  // Auto assign tables
  const autoAssignTables = async () => {
    if (!tournamentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'auto_assign_tables',
            tournament_id: tournamentId,
          },
        }
      );

      if (error) throw error;

      toast.success(
        `Đã tự động phân bàn cho ${data.assignments_made} trận đấu`
      );
      await fetchTableStatus();
      await fetchAvailableMatches();
    } catch (error) {
      console.error('Error auto-assigning tables:', error);
      toast.error('Lỗi khi tự động phân bàn');
    } finally {
      setLoading(false);
    }
  };

  // Manual table assignment
  const manualAssignTable = async () => {
    if (!selectedMatch || !selectedTable) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'manual_assign_table',
            match_id: selectedMatch,
            table_id: selectedTable,
          },
        }
      );

      if (error) throw error;

      toast.success(data.message);
      await fetchTableStatus();
      await fetchAvailableMatches();
      setSelectedMatch('');
      setSelectedTable('');
    } catch (error) {
      console.error('Error manually assigning table:', error);
      toast.error('Lỗi khi phân bàn thủ công');
    } finally {
      setLoading(false);
    }
  };

  // Release table
  const releaseTable = async (matchId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'release_table',
            match_id: matchId,
          },
        }
      );

      if (error) throw error;

      toast.success('Đã giải phóng bàn chơi');
      await fetchTableStatus();
    } catch (error) {
      console.error('Error releasing table:', error);
      toast.error('Lỗi khi giải phóng bàn');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchTableStatus();
    if (tournamentId) {
      fetchAvailableMatches();
    }
  }, [clubId, tournamentId]);

  useEffect(() => {
    if (!clubId) return;

    // Subscribe to table status changes
    const channel = supabase
      .channel(`club-tables-${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_tables',
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          fetchTableStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'occupied':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'maintenance':
        return <AlertCircle className='h-4 w-4 text-orange-500' />;
      case 'reserved':
        return <Clock className='h-4 w-4 text-blue-500' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đang sử dụng';
      case 'maintenance':
        return 'Bảo trì';
      case 'reserved':
        return 'Đã đặt';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              Quản lý Bàn Chơi
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchTableStatus}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>
              {showManagement && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={initializeTables}
                    disabled={loading}
                  >
                    <Settings className='h-4 w-4 mr-1' />
                    Khởi tạo bàn
                  </Button>
                  {tournamentId && (
                    <Button
                      size='sm'
                      onClick={autoAssignTables}
                      disabled={loading}
                    >
                      <Calendar className='h-4 w-4 mr-1' />
                      Tự động phân bàn
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table Statistics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='text-center p-3 bg-muted/50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Tổng số bàn</p>
              <p className='text-2xl font-bold'>{tables.length}</p>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Bàn trống</p>
              <p className='text-2xl font-bold text-green-600'>
                {tables.filter(t => t.status === 'available').length}
              </p>
            </div>
            <div className='text-center p-3 bg-red-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Đang sử dụng</p>
              <p className='text-2xl font-bold text-red-600'>
                {tables.filter(t => t.status === 'occupied').length}
              </p>
            </div>
            <div className='text-center p-3 bg-orange-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Bảo trì</p>
              <p className='text-2xl font-bold text-orange-600'>
                {tables.filter(t => t.status === 'maintenance').length}
              </p>
            </div>
          </div>

          {/* Manual Assignment */}
          {showManagement && tournamentId && availableMatches.length > 0 && (
            <div className='p-4 bg-blue-50 rounded-lg mb-6'>
              <h3 className='font-medium mb-3'>Phân bàn thủ công</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn trận đấu...' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMatches.map(match => (
                      <SelectItem key={match.id} value={match.id}>
                        Vòng {match.round_number} - Trận {match.match_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn bàn...' />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter(t => t.status === 'available')
                      .map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.table_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={manualAssignTable}
                  disabled={!selectedMatch || !selectedTable || loading}
                >
                  Phân bàn
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
        {tables.map(table => (
          <Card
            key={table.id}
            className={`border-2 ${getStatusColor(table.status)}`}
          >
            <CardContent className='p-4'>
              <div className='text-center space-y-2'>
                <div className='flex items-center justify-center gap-2'>
                  {getStatusIcon(table.status)}
                  <span className='font-bold text-lg'>{table.table_name}</span>
                </div>

                <Badge
                  variant='outline'
                  className={getStatusColor(table.status)}
                >
                  {getStatusText(table.status)}
                </Badge>

                {table.tournament_matches && (
                  <div className='text-xs space-y-1'>
                    <p className='font-medium'>
                      Vòng {table.tournament_matches.round_number} - Trận{' '}
                      {table.tournament_matches.match_number}
                    </p>
                    {table.tournament_matches.tournaments && (
                      <p className='text-xs text-blue-600 font-medium'>
                        📝 {table.tournament_matches.tournaments.name}
                      </p>
                    )}
                    <p className='text-muted-foreground'>
                      {table.tournament_matches.player1?.full_name || 'TBD'} vs{' '}
                      {table.tournament_matches.player2?.full_name || 'TBD'}
                    </p>
                    {showManagement && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          releaseTable(table.tournament_matches!.id)
                        }
                        className='mt-2'
                      >
                        Giải phóng
                      </Button>
                    )}
                  </div>
                )}

                {table.last_used_at && (
                  <p className='text-xs text-muted-foreground'>
                    Sử dụng lần cuối:{' '}
                    {new Date(table.last_used_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && !loading && (
        <Card>
          <CardContent className='text-center py-8'>
            <p className='text-muted-foreground mb-4'>
              Chưa có bàn chơi nào được khởi tạo
            </p>
            {showManagement && (
              <Button onClick={initializeTables}>
                <Settings className='h-4 w-4 mr-2' />
                Khởi tạo bàn chơi
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TableAssignmentDisplay;
