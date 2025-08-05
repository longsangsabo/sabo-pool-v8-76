import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Trophy,
  Users,
  Calendar,
  Star,
  Plus,
  Activity,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClubTournaments } from '@/hooks/useClubTournaments';

interface TournamentManagementProps {
  clubId: string;
}

export const TournamentManagementNew: React.FC<TournamentManagementProps> = ({
  clubId,
}) => {
  const {
    tournaments,
    loading,
    error,
    createTournament,
    updateTournament,
    deleteTournament,
    getTournamentStats,
  } = useClubTournaments(clubId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);

  const [newTournamentData, setNewTournamentData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    max_participants: 16,
    entry_fee: 0,
    prize_pool: 0,
    tournament_type: 'single_elimination' as const,
    status: 'upcoming' as const,
  });

  const stats = getTournamentStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang diễn ra';
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handleCreateTournament = async () => {
    try {
      await createTournament({
        ...newTournamentData,
        club_id: clubId,
        created_by: '', // Will be set in hook
      });
      setShowCreateDialog(false);
      setNewTournamentData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        max_participants: 16,
        entry_fee: 0,
        prize_pool: 0,
        tournament_type: 'single_elimination',
        status: 'upcoming',
      });
      toast.success('Tạo giải đấu thành công!');
    } catch (error) {
      toast.error('Lỗi khi tạo giải đấu');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa giải đấu này?')) {
      try {
        await deleteTournament(tournamentId);
        toast.success('Xóa giải đấu thành công!');
      } catch (error) {
        toast.error('Lỗi khi xóa giải đấu');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-500'>Lỗi: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            Quản lý giải đấu ({tournaments.length})
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2'>
                <Plus className='w-4 h-4' />
                Tạo giải đấu mới
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle>Tạo giải đấu mới</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='name'>Tên giải đấu</Label>
                  <Input
                    id='name'
                    value={newTournamentData.name}
                    onChange={e =>
                      setNewTournamentData({
                        ...newTournamentData,
                        name: e.target.value,
                      })
                    }
                    placeholder='Tên giải đấu'
                  />
                </div>
                <div>
                  <Label htmlFor='description'>Mô tả</Label>
                  <Textarea
                    id='description'
                    value={newTournamentData.description}
                    onChange={e =>
                      setNewTournamentData({
                        ...newTournamentData,
                        description: e.target.value,
                      })
                    }
                    placeholder='Mô tả giải đấu'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='start_date'>Ngày bắt đầu</Label>
                    <Input
                      id='start_date'
                      type='date'
                      value={newTournamentData.start_date}
                      onChange={e =>
                        setNewTournamentData({
                          ...newTournamentData,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='end_date'>Ngày kết thúc</Label>
                    <Input
                      id='end_date'
                      type='date'
                      value={newTournamentData.end_date}
                      onChange={e =>
                        setNewTournamentData({
                          ...newTournamentData,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='max_participants'>Số người tối đa</Label>
                    <Input
                      id='max_participants'
                      type='number'
                      value={newTournamentData.max_participants}
                      onChange={e =>
                        setNewTournamentData({
                          ...newTournamentData,
                          max_participants: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='entry_fee'>Phí tham gia</Label>
                    <Input
                      id='entry_fee'
                      type='number'
                      value={newTournamentData.entry_fee}
                      onChange={e =>
                        setNewTournamentData({
                          ...newTournamentData,
                          entry_fee: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='prize_pool'>Giải thưởng</Label>
                  <Input
                    id='prize_pool'
                    type='number'
                    value={newTournamentData.prize_pool}
                    onChange={e =>
                      setNewTournamentData({
                        ...newTournamentData,
                        prize_pool: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='tournament_type'>Loại giải</Label>
                  <Select
                    value={newTournamentData.tournament_type}
                    onValueChange={(value: any) =>
                      setNewTournamentData({
                        ...newTournamentData,
                        tournament_type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='single_elimination'>
                        Loại trực tiếp
                      </SelectItem>
                      <SelectItem value='double_elimination'>
                        Loại kép
                      </SelectItem>
                      <SelectItem value='round_robin'>Vòng tròn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTournament} className='w-full'>
                  Tạo giải đấu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Quick Stats */}
        <div className='grid gap-4 md:grid-cols-4'>
          <div className='flex items-center gap-3 p-4 bg-green-50 rounded-lg'>
            <Activity className='w-8 h-8 text-green-600' />
            <div>
              <h4 className='font-semibold text-green-800'>
                {stats.activeTournaments}
              </h4>
              <p className='text-sm text-green-600'>Đang diễn ra</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg'>
            <Calendar className='w-8 h-8 text-blue-600' />
            <div>
              <h4 className='font-semibold text-blue-800'>
                {stats.upcomingTournaments}
              </h4>
              <p className='text-sm text-blue-600'>Sắp diễn ra</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-4 bg-purple-50 rounded-lg'>
            <Users className='w-8 h-8 text-purple-600' />
            <div>
              <h4 className='font-semibold text-purple-800'>
                {stats.totalParticipants}
              </h4>
              <p className='text-sm text-purple-600'>Tổng người chơi</p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-4 bg-yellow-50 rounded-lg'>
            <Star className='w-8 h-8 text-yellow-600' />
            <div>
              <h4 className='font-semibold text-yellow-800'>
                {stats.totalPrizePool.toLocaleString()}đ
              </h4>
              <p className='text-sm text-yellow-600'>Tổng giải thưởng</p>
            </div>
          </div>
        </div>

        {/* Tournament List */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Danh sách giải đấu</h3>
          {tournaments.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              Chưa có giải đấu nào. Tạo giải đấu mới để bắt đầu!
            </div>
          ) : (
            tournaments.map(tournament => (
              <Card key={tournament.id}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='space-y-3 flex-1'>
                      <div className='flex items-center gap-2'>
                        <h4 className='text-lg font-semibold'>
                          {tournament.name}
                        </h4>
                        <Badge className={getStatusColor(tournament.status)}>
                          {getStatusText(tournament.status)}
                        </Badge>
                      </div>

                      {tournament.description && (
                        <p className='text-muted-foreground'>
                          {tournament.description}
                        </p>
                      )}

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                          <Users className='w-4 h-4' />
                          <span>
                            {tournament.participants_count || 0}/
                            {tournament.max_participants}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4' />
                          <span>
                            {new Date(tournament.start_date).toLocaleDateString(
                              'vi-VN'
                            )}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Star className='w-4 h-4' />
                          <span>
                            {tournament.entry_fee?.toLocaleString() || 0}đ
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Trophy className='w-4 h-4' />
                          <span>
                            {tournament.prize_pool?.toLocaleString() || 0}đ
                          </span>
                        </div>
                      </div>

                      {tournament.status === 'active' && (
                        <div className='space-y-2'>
                          <div className='flex justify-between text-sm'>
                            <span>Tiến độ</span>
                            <span>65%</span>
                          </div>
                          <Progress value={65} className='h-2' />
                        </div>
                      )}
                    </div>

                    <div className='flex items-center gap-2 ml-4'>
                      <Button size='sm' variant='outline'>
                        <Eye className='h-4 w-4 mr-1' />
                        Xem
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditingTournament(tournament)}
                      >
                        <Edit className='h-4 w-4 mr-1' />
                        Sửa
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDeleteTournament(tournament.id)}
                      >
                        <Trash2 className='h-4 w-4 mr-1' />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
