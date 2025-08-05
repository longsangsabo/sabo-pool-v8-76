// 🏆 COMPREHENSIVE ADMIN TOURNAMENT MANAGER
// Complete solution for tournament creation and management

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Users, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TournamentActions from '@/components/TournamentActions';

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  current_participants: number;
  tournament_type: string;
  entry_fee: number;
  prize_pool: number;
  registration_start: string;
  registration_end: string;
  start_date: string;
  end_date: string;
  game_format: string;
  created_by: string;
  is_public: boolean;
  management_status: string;
}

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  elo: number;
  skill_level: string;
  is_demo_user: boolean;
  created_at: string;
}

const AdminTournamentManager: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manage');
  const { toast } = useToast();

  // User Selection Templates
  const userSelectionTemplates = [
    { name: '8 Cao thủ', filter: 'advanced', count: 8 },
    { name: '16 Hỗn hợp', filter: 'mixed', count: 16 },
    { name: '32 Random', filter: 'random', count: 32 },
    { name: 'Điền đầy', filter: 'fill', count: -1 },
  ];

  // Initialize data
  useEffect(() => {
    loadTournaments();
    loadUsers();
  }, []);

  const loadTournaments = async () => {
    console.log('📊 Loading tournaments...');
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          id, name, status, max_participants, entry_fee, prize_pool,
          registration_start, registration_end, start_date, end_date,
          tournament_type, game_format, created_at, is_public, management_status, created_by
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate current participants for each tournament
      const tournamentsWithCounts = await Promise.all(
        (data || []).map(async tournament => {
          const { count } = await supabase
            .from('tournament_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id)
            .eq('registration_status', 'confirmed');

          return {
            ...tournament,
            current_participants: count || 0,
          };
        })
      );

      setTournaments(tournamentsWithCounts);
      console.log('✅ Loaded tournaments:', tournamentsWithCounts.length);
    } catch (error) {
      console.error('❌ Error loading tournaments:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách giải đấu',
        variant: 'destructive',
      });
    }
  };

  const loadUsers = async () => {
    console.log('👥 Loading users...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, full_name, email, phone, elo, skill_level, is_demo_user, created_at'
        )
        .order('full_name');

      if (error) throw error;

      // Type assertion to handle the data properly
      setUsers((data as any[]) || []);
      console.log('✅ Loaded users:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
        variant: 'destructive',
      });
    }
  };

  // 👥 USER SELECTION FUNCTIONS
  const selectUsersByTemplate = (template: any) => {
    console.log('🎯 Selecting users by template:', template);

    let filteredUsers: User[] = [];

    switch (template.filter) {
      case 'advanced':
        filteredUsers = users.filter(
          user => (user.elo || 0) >= 1600 && !user.is_demo_user
        );
        break;

      case 'mixed':
        const advanced = users
          .filter(u => (u.elo || 0) >= 1600 && !u.is_demo_user)
          .slice(0, 4);
        const intermediate = users
          .filter(
            u => (u.elo || 0) >= 1200 && (u.elo || 0) < 1600 && !u.is_demo_user
          )
          .slice(0, 8);
        const beginner = users
          .filter(u => (u.elo || 0) < 1200 && !u.is_demo_user)
          .slice(0, 4);
        filteredUsers = [...advanced, ...intermediate, ...beginner];
        break;

      case 'random':
        filteredUsers = users.filter(u => !u.is_demo_user);
        // Shuffle array
        for (let i = filteredUsers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filteredUsers[i], filteredUsers[j]] = [
            filteredUsers[j],
            filteredUsers[i],
          ];
        }
        break;

      case 'fill':
        if (selectedTournament) {
          const remaining =
            selectedTournament.max_participants -
            selectedTournament.current_participants;
          filteredUsers = users
            .filter(u => !u.is_demo_user)
            .slice(0, remaining);
        }
        break;
    }

    const count =
      template.count === -1
        ? filteredUsers.length
        : Math.min(template.count, filteredUsers.length);
    const selectedIds = filteredUsers
      .slice(0, count)
      .map(u => u.user_id || u.id);

    setSelectedUsers(selectedIds);

    console.log(`✅ Selected ${selectedIds.length} users`);
    toast({
      title: 'Đã chọn',
      description: `${selectedIds.length} người dùng được chọn`,
    });
  };

  const selectByEloRange = (minElo: number, maxElo: number) => {
    console.log(`🎯 Selecting users by ELO range: ${minElo}-${maxElo}`);
    const filtered = users.filter(
      user =>
        (user.elo || 0) >= minElo &&
        (user.elo || 0) <= maxElo &&
        !user.is_demo_user
    );
    setSelectedUsers(filtered.map(u => u.user_id || u.id));

    toast({
      title: 'Đã chọn',
      description: `${filtered.length} người dùng với ELO ${minElo}-${maxElo}`,
    });
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 🎯 ADD USERS TO TOURNAMENT WITH QUICK START OPTION
  const addUsersToTournament = async () => {
    // Kiểm tra đã chọn giải đấu chưa
    if (!selectedTournament) {
      toast({
        title: 'Chưa chọn giải đấu',
        description: 'Vui lòng chọn giải đấu trước khi thêm người chơi',
        variant: 'destructive',
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: 'Chưa chọn người chơi',
        description: 'Vui lòng chọn ít nhất 1 người chơi',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check capacity
      const totalAfterAdd =
        selectedTournament.current_participants + selectedUsers.length;
      if (totalAfterAdd > selectedTournament.max_participants) {
        toast({
          title: 'Vượt quá sức chứa',
          description: `Chỉ có thể thêm ${selectedTournament.max_participants - selectedTournament.current_participants} người`,
          variant: 'destructive',
        });
        return;
      }

      // Check existing registrations
      const { data: existingRegs } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('tournament_id', selectedTournament.id)
        .in('user_id', selectedUsers);

      const existingUserIds = existingRegs?.map(reg => reg.user_id) || [];
      const newUserIds = selectedUsers.filter(
        id => !existingUserIds.includes(id)
      );

      if (newUserIds.length === 0) {
        toast({
          title: 'Thông báo',
          description: 'Tất cả người dùng đã tham gia giải đấu',
        });
        return;
      }

      // Create registrations
      const registrations = newUserIds.map((userId, index) => ({
        tournament_id: selectedTournament.id,
        user_id: userId,
        registration_status: 'confirmed',
        payment_status: selectedTournament.entry_fee > 0 ? 'paid' : 'unpaid',
        seed_number: selectedTournament.current_participants + index + 1,
        registration_date: new Date().toISOString(),
      }));

      console.log('📤 Inserting registrations:', registrations);

      const { error } = await supabase
        .from('tournament_registrations')
        .insert(registrations);

      if (error) {
        console.error('❌ Registration error:', error);
        throw error;
      }

      console.log('✅ Users added successfully');

      // Update tournament participant count
      const updatedParticipantCount =
        selectedTournament.current_participants + newUserIds.length;
      await supabase
        .from('tournaments')
        .update({
          current_participants: updatedParticipantCount,
        })
        .eq('id', selectedTournament.id);

      toast({
        title: 'Thành công!',
        description: `Đã thêm ${newUserIds.length} người vào giải đấu`,
      });

      setSelectedUsers([]);
      await loadTournaments();

      // Update selected tournament with new count
      setSelectedTournament({
        ...selectedTournament,
        current_participants: updatedParticipantCount,
      });
    } catch (error) {
      console.error('Error adding users:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm người dùng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed duplicate handleQuickStart - now using TournamentActions component

  // 🔧 ADVANCED OPERATIONS
  const autoBalanceSkills = () => {
    if (selectedUsers.length === 0) return;

    console.log('⚖️ Auto-balancing skills for selected users');

    const selectedUserData = users.filter(u =>
      selectedUsers.includes(u.user_id || u.id)
    );
    const sortedByElo = selectedUserData.sort(
      (a, b) => (b.elo || 0) - (a.elo || 0)
    );

    // Snake draft style balancing
    const balanced: User[] = [];
    let ascending = true;

    while (sortedByElo.length > 0) {
      if (ascending) {
        balanced.push(sortedByElo.shift()!);
      } else {
        balanced.push(sortedByElo.pop()!);
      }
      ascending = !ascending;
    }

    setSelectedUsers(balanced.map(u => u.user_id || u.id));

    console.log('✅ Skills balanced');
    toast({
      title: 'Đã cân bằng',
      description: 'Thứ tự người chơi đã được tối ưu hóa theo skill',
    });
  };

  // Calculate stats for selected users
  const getSelectionStats = () => {
    if (selectedUsers.length === 0) return null;

    const selectedUserData = users.filter(u =>
      selectedUsers.includes(u.user_id || u.id)
    );
    const avgElo =
      selectedUserData.reduce((sum, u) => sum + (u.elo || 0), 0) /
      selectedUserData.length;
    const skillDistribution = {
      advanced: selectedUserData.filter(u => (u.elo || 0) >= 1600).length,
      intermediate: selectedUserData.filter(
        u => (u.elo || 0) >= 1200 && (u.elo || 0) < 1600
      ).length,
      beginner: selectedUserData.filter(u => (u.elo || 0) < 1200).length,
    };

    return { avgElo: Math.round(avgElo), skillDistribution };
  };

  const stats = getSelectionStats();

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          🏆 Admin Tournament Manager
        </h1>
        <p className='text-muted-foreground'>
          Tạo và quản lý giải đấu toàn diện với quyền admin
        </p>
      </div>

      <div className='space-y-6'>
        {/* Tournament Selector */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              🏆 Chọn giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTournament ? (
              // Hiển thị giải đấu đã chọn
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-semibold text-blue-900'>
                      {selectedTournament.name}
                    </h4>
                    <div className='text-sm text-blue-700 mt-1'>
                      👥 {selectedTournament.current_participants}/
                      {selectedTournament.max_participants} người •
                      <Badge variant='secondary' className='ml-2'>
                        {selectedTournament.status}
                      </Badge>
                    </div>
                    <div className='text-xs text-blue-600 mt-1'>
                      💰 Phí:{' '}
                      {selectedTournament.entry_fee?.toLocaleString('vi-VN') ||
                        0}{' '}
                      VNĐ • 🎮 {selectedTournament.tournament_type}
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSelectedTournament(null)}
                    className='text-blue-700 border-blue-300'
                  >
                    Đổi giải đấu
                  </Button>
                </div>
              </div>
            ) : (
              // Dropdown chọn giải đấu
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Chọn giải đấu để thêm người chơi:
                </Label>
                <Select
                  onValueChange={tournamentId => {
                    const tournament = tournaments.find(
                      t => t.id === tournamentId
                    );
                    setSelectedTournament(tournament || null);
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='-- Chọn giải đấu --' />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments
                      .filter(
                        t =>
                          t.status === 'registration_open' ||
                          t.status === 'upcoming'
                      )
                      .map(tournament => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          <div className='flex items-center justify-between w-full'>
                            <span className='font-medium'>
                              {tournament.name}
                            </span>
                            <span className='text-xs text-gray-500 ml-2'>
                              {tournament.current_participants}/
                              {tournament.max_participants}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {tournaments.filter(
                  t =>
                    t.status === 'registration_open' || t.status === 'upcoming'
                ).length === 0 && (
                  <p className='text-sm text-gray-500 mt-2'>
                    ⚠️ Không có giải đấu nào đang mở đăng ký
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Templates */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Thêm nhanh người chơi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
              {userSelectionTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant='outline'
                  size='sm'
                  onClick={() => selectUsersByTemplate(template)}
                  className='flex items-center gap-2'
                >
                  {template.name}
                </Button>
              ))}
            </div>

            {/* ELO Range Selection */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => selectByEloRange(1600, 9999)}
              >
                🏆 Cao thủ (1600+)
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => selectByEloRange(1200, 1599)}
              >
                🎯 Trung bình (1200-1599)
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => selectByEloRange(0, 1199)}
              >
                🌱 Mới (0-1199)
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setSelectedUsers(users.map(u => u.user_id || u.id))
                }
              >
                ✅ Chọn tất cả
              </Button>
            </div>

            {/* Selection Preview */}
            {selectedUsers.length > 0 && stats && (
              <div className='bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='font-medium text-primary'>
                    📋 Preview: {selectedUsers.length} người được chọn
                  </h4>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSelectedUsers([])}
                    className='text-primary'
                  >
                    Xóa chọn
                  </Button>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary'>
                  <div>ELO TB: {stats.avgElo}</div>
                  <div>Cao thủ: {stats.skillDistribution.advanced}</div>
                  <div>TB: {stats.skillDistribution.intermediate}</div>
                  <div>Mới: {stats.skillDistribution.beginner}</div>
                </div>
              </div>
            )}

            {/* Add Button */}
            <div className='space-y-3'>
              <div className='flex gap-3'>
                <Button
                  onClick={addUsersToTournament}
                  disabled={
                    !selectedTournament || selectedUsers.length === 0 || loading
                  }
                  className={`flex-1 ${
                    !selectedTournament
                      ? 'bg-gray-400'
                      : selectedUsers.length === 0
                        ? 'bg-gray-500'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading
                    ? 'Đang thêm...'
                    : !selectedTournament
                      ? '❌ Chưa chọn giải đấu'
                      : selectedUsers.length === 0
                        ? '❌ Chưa chọn người chơi'
                        : `➕ Thêm ${selectedUsers.length} người vào "${selectedTournament.name}"`}
                </Button>
                <Button
                  variant='outline'
                  onClick={autoBalanceSkills}
                  disabled={selectedUsers.length === 0}
                >
                  <Scale className='h-4 w-4 mr-2' />
                  Cân bằng
                </Button>
              </div>

              {/* Quick Start Actions using TournamentActions component */}
              {selectedTournament && (
                <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <h4 className='font-medium text-green-800 mb-3'>
                    🚀 Bắt đầu giải đấu
                  </h4>
                  <TournamentActions
                    tournamentId={selectedTournament.id}
                    tournamentName={selectedTournament.name}
                    tournamentStatus={selectedTournament.status}
                    managementStatus={
                      selectedTournament.management_status || 'manual'
                    }
                    onTournamentStarted={() => {
                      console.log('Tournament started:', selectedTournament.id);
                      loadTournaments();
                      setSelectedTournament(null);
                    }}
                    className='w-full'
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='max-h-96 overflow-y-auto space-y-2'>
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg flex items-center justify-between transition-colors ${
                    selectedUsers.includes(user.user_id || user.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <Checkbox
                      checked={selectedUsers.includes(user.user_id || user.id)}
                      onCheckedChange={checked => {
                        const userId = user.user_id || user.id;
                        if (checked) {
                          setSelectedUsers([...selectedUsers, userId]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter(id => id !== userId)
                          );
                        }
                      }}
                    />
                    <div>
                      <h4 className='font-medium'>{user.full_name}</h4>
                      <div className='text-sm text-muted-foreground'>
                        ELO: {user.elo || 'N/A'} • Skill:{' '}
                        {user.skill_level || 'Unranked'} • 📱 {user.phone}
                        {user.is_demo_user && (
                          <Badge variant='secondary' className='ml-2'>
                            Demo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTournamentManager;
