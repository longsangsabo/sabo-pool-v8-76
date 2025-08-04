import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Trophy, 
  DollarSign, 
  Calendar,
  MapPin,
  Play,
  Pause,
  Square,
  CheckCircle,
  UserPlus,
  Eye,
  Settings,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { useAdminTournaments, AdminTournamentData, TournamentStats, TournamentRegistration } from '@/hooks/useAdminTournaments';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';

const AdminTournamentsNew = () => {
  const { t } = useTranslation();
  const {
    tournaments,
    loading,
    error,
    createTournament,
    updateTournament,
    deleteTournament,
    updateTournamentStatus,
    getTournamentStats,
    getTournamentRegistrations,
    cancelRegistration
  } = useAdminTournaments();

  const { users, isLoading: usersLoading } = useAdminUsers();

  const [stats, setStats] = useState<TournamentStats>({
    total: 0,
    upcoming: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    total_participants: 0,
    total_revenue: 0,
    avg_participants_per_tournament: 0
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [tournamentRegistrations, setTournamentRegistrations] = useState<TournamentRegistration[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [formData, setFormData] = useState<AdminTournamentData>({
    name: '',
    description: '',
    tournament_type: 'single_elimination',
    game_format: '8_ball',
    max_participants: 16,
    entry_fee: 0,
    prize_pool: 0,
    first_prize: 0,
    second_prize: 0,
    third_prize: 0,
    registration_start: '',
    registration_end: '',
    start_date: '',
    end_date: '',
    venue_address: '',
    city: '',
    district: '',
    club_id: ''
  });

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getTournamentStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    if (!loading) {
      loadStats();
    }
  }, [loading, getTournamentStats, tournaments]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tournament_type: 'single_elimination',
      game_format: '8_ball',
      max_participants: 16,
      entry_fee: 0,
      prize_pool: 0,
      first_prize: 0,
      second_prize: 0,
      third_prize: 0,
      registration_start: '',
      registration_end: '',
      start_date: '',
      end_date: '',
      venue_address: '',
      city: '',
      district: '',
      club_id: ''
    });
  };

  const handleCreateTournament = async () => {
    try {
      await createTournament(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const handleEditTournament = async () => {
    if (!editingTournament) return;

    try {
      await updateTournament(editingTournament.id, formData);
      setIsEditDialogOpen(false);
      setEditingTournament(null);
      resetForm();
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giải đấu này?')) {
      try {
        await deleteTournament(id);
      } catch (error) {
        console.error('Error deleting tournament:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateTournamentStatus(id, status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openEditDialog = (tournament: any) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name || '',
      description: tournament.description || '',
      tournament_type: tournament.tournament_type || 'single_elimination',
      game_format: tournament.game_format || '8_ball',
      max_participants: tournament.max_participants || 16,
      entry_fee: tournament.entry_fee || 0,
      prize_pool: tournament.prize_pool || 0,
      first_prize: tournament.first_prize || 0,
      second_prize: tournament.second_prize || 0,
      third_prize: tournament.third_prize || 0,
      registration_start: tournament.registration_start || '',
      registration_end: tournament.registration_end || '',
      start_date: tournament.tournament_start || '',
      end_date: tournament.tournament_end || '',
      venue_address: tournament.venue_address || '',
      city: '',
      district: '',
      club_id: tournament.club_id || ''
    });
    setIsEditDialogOpen(true);
  };

  // New function to view participants
  const openParticipantsDialog = async (tournament: any) => {
    setSelectedTournament(tournament);
    try {
      const registrations = await getTournamentRegistrations(tournament.id);
      setTournamentRegistrations(registrations);
      setIsParticipantsDialogOpen(true);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Lỗi khi tải danh sách người tham gia');
    }
  };

  // Quick status change function
  const handleQuickStatusChange = async (tournamentId: string, newStatus: string) => {
    try {
      await updateTournamentStatus(tournamentId, newStatus as any);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Add users to tournament function
  const handleAddUsersToTournament = async () => {
    if (!selectedTournament || selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người chơi');
      return;
    }

    try {
      // Insert multiple registrations
      const registrations = selectedUsers.map(userId => ({
        tournament_id: selectedTournament.id,
        user_id: userId,
        status: 'confirmed',
        payment_status: 'pending',
        registration_date: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('tournament_registrations')
        .insert(registrations);

      if (error) throw error;

      toast.success(`Đã thêm ${selectedUsers.length} người chơi vào giải đấu`);
      
      // Refresh participants list
      const updatedRegistrations = await getTournamentRegistrations(selectedTournament.id);
      setTournamentRegistrations(updatedRegistrations);
      
      // Reset form
      setSelectedUsers([]);
      setUserSearchQuery('');
      setIsAddUserDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding users to tournament:', error);
      toast.error('Lỗi khi thêm người chơi: ' + error.message);
    }
  };

  // Open add user dialog
  const openAddUserDialog = () => {
    
    if (usersLoading) {
      toast.error('Đang tải danh sách người dùng, vui lòng chờ...');
      return;
    }
    
    if (users.length === 0) {
      toast.error('Không có dữ liệu người dùng để thêm');
      return;
    }
    
    setIsAddUserDialogOpen(true);
    setSelectedUsers([]);
    setUserSearchQuery('');
  };

  // Add missing function for user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users for search
  const filteredUsers = users.filter(user => {
    const searchLower = userSearchQuery.toLowerCase();
    const alreadyRegistered = tournamentRegistrations.some(reg => reg.user_id === user.user_id);
    
    return !alreadyRegistered && (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(userSearchQuery) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'registration_open': { variant: 'default' as const, label: 'Đang mở đăng ký', icon: Play },
      'registration_closed': { variant: 'secondary' as const, label: 'Đóng đăng ký', icon: Pause },
      'ongoing': { variant: 'default' as const, label: 'Đang diễn ra', icon: Play },
      'completed': { variant: 'outline' as const, label: 'Hoàn thành', icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, label: 'Đã hủy', icon: Square }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.registration_open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return 'N/A';
    }
  };

  if (error) {
    return (
      <AdminPageLayout title="Quản lý Giải đấu">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Có lỗi xảy ra khi tải dữ liệu</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title={t('tournaments.title')}
      description={t('tournaments.description')}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            {/* Remove title and description since they're in AdminPageLayout */}
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t('tournaments.create_tournament')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo giải đấu mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin để tạo giải đấu mới
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Tên giải đấu *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nhập tên giải đấu"
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">{t('tournaments.tournament_name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t('tournaments.tournament_name_placeholder')}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">{t('tournaments.tournament_description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={t('tournaments.tournament_description_placeholder')}
                  />
                </div>                <div>
                  <Label htmlFor="tournament_type">Loại giải đấu</Label>
                  <Select value={formData.tournament_type} onValueChange={(value: any) => setFormData({...formData, tournament_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_elimination">Loại trực tiếp</SelectItem>
                      <SelectItem value="double_elimination">Loại kép</SelectItem>
                      <SelectItem value="round_robin">Vòng tròn</SelectItem>
                      <SelectItem value="swiss">Swiss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="game_format">Thể thức</Label>
                  <Select value={formData.game_format} onValueChange={(value: any) => setFormData({...formData, game_format: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8_ball">8-Ball</SelectItem>
                      <SelectItem value="9_ball">9-Ball</SelectItem>
                      <SelectItem value="10_ball">10-Ball</SelectItem>
                      <SelectItem value="straight_pool">Straight Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="max_participants">{t('tournaments.max_participants')}</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="entry_fee">{t('tournaments.entry_fee')}</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({...formData, entry_fee: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prize_pool">Tổng giải thưởng (VND)</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({...formData, prize_pool: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="first_prize">Giải nhất (VND)</Label>
                  <Input
                    id="first_prize"
                    type="number"
                    value={formData.first_prize}
                    onChange={(e) => setFormData({...formData, first_prize: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="registration_start">Bắt đầu đăng ký</Label>
                  <Input
                    id="registration_start"
                    type="datetime-local"
                    value={formData.registration_start}
                    onChange={(e) => setFormData({...formData, registration_start: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="registration_end">Kết thúc đăng ký</Label>
                  <Input
                    id="registration_end"
                    type="datetime-local"
                    value={formData.registration_end}
                    onChange={(e) => setFormData({...formData, registration_end: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="start_date">Ngày bắt đầu giải</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Ngày kết thúc giải</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="venue_address">Địa chỉ tổ chức</Label>
                  <Input
                    id="venue_address"
                    value={formData.venue_address}
                    onChange={(e) => setFormData({...formData, venue_address: e.target.value})}
                    placeholder="Địa chỉ chi tiết"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">Thành phố</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Thành phố"
                  />
                </div>
                
                <div>
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    placeholder="Quận/Huyện"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateTournament} disabled={!formData.name.trim()}>
                  Tạo giải đấu
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giải đấu</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.upcoming} sắp diễn ra
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Đang mở đăng ký hoặc thi đấu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người tham gia</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_participants}</div>
              <p className="text-xs text-muted-foreground">
                TB: {stats.avg_participants_per_tournament}/giải
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Từ lệ phí tham gia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tournaments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách giải đấu</CardTitle>
            <CardDescription>
              Quản lý tất cả giải đấu trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Đang tải...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên giải</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thể thức</TableHead>
                    <TableHead>Người tham gia</TableHead>
                    <TableHead>Lệ phí</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tournament.name}</div>
                          {tournament.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {tournament.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tournament.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tournament.game_format?.replace('_', '-').toUpperCase()}</div>
                          <div className="text-muted-foreground">
                            {tournament.tournament_type?.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{tournament.current_participants || 0}/{tournament.max_participants}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(tournament.entry_fee || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(tournament.tournament_start)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">
                            {tournament.venue_address || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openParticipantsDialog(tournament)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(tournament)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(tournament.id, 'registration_open')}>
                                <Play className="h-4 w-4 mr-2" />
                                Mở đăng ký
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(tournament.id, 'registration_closed')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Đóng đăng ký
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(tournament.id, 'ongoing')}>
                                <Play className="h-4 w-4 mr-2" />
                                Bắt đầu giải
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(tournament.id, 'completed')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Hoàn thành
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteTournament(tournament.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa giải đấu
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tournaments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Chưa có giải đấu nào</p>
                          <p className="text-sm">Tạo giải đấu đầu tiên của bạn</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa giải đấu</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin giải đấu
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit_name">Tên giải đấu *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên giải đấu"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_description">Mô tả</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả về giải đấu"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_tournament_type">Loại giải đấu</Label>
                <Select value={formData.tournament_type} onValueChange={(value: any) => setFormData({...formData, tournament_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Loại trực tiếp</SelectItem>
                    <SelectItem value="double_elimination">Loại kép</SelectItem>
                    <SelectItem value="round_robin">Vòng tròn</SelectItem>
                    <SelectItem value="swiss">Swiss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_game_format">Thể thức</Label>
                <Select value={formData.game_format} onValueChange={(value: any) => setFormData({...formData, game_format: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8_ball">8-Ball</SelectItem>
                    <SelectItem value="9_ball">9-Ball</SelectItem>
                    <SelectItem value="10_ball">10-Ball</SelectItem>
                    <SelectItem value="straight_pool">Straight Pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_max_participants">Số người tối đa</Label>
                <Input
                  id="edit_max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_entry_fee">Lệ phí tham gia (VND)</Label>
                <Input
                  id="edit_entry_fee"
                  type="number"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData({...formData, entry_fee: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleEditTournament} disabled={!formData.name.trim()}>
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Participants Dialog */}
        <Dialog open={isParticipantsDialogOpen} onOpenChange={setIsParticipantsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Người tham gia: {selectedTournament?.name}
              </DialogTitle>
              <DialogDescription>
                Quản lý danh sách người tham gia giải đấu
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Participants Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {tournamentRegistrations.filter(r => r.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Đã xác nhận</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {tournamentRegistrations.filter(r => r.status === 'pending' || r.status === 'registered').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Chờ xử lý</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {selectedTournament?.max_participants - tournamentRegistrations.filter(r => r.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Còn lại</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add User Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Danh sách người tham gia</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsAddUserDialogOpen(true);
                    }}
                  >
                    Test Dialog
                  </Button>
                  <Button 
                    onClick={() => {
                      openAddUserDialog();
                    }}
                    disabled={usersLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {usersLoading ? 'Đang tải...' : 'Thêm người chơi'} {isAddUserDialogOpen && '(OPEN)'}
                  </Button>
                </div>
              </div>

              {/* Participants Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>ELO</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="font-medium">
                          {registration.user?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>{registration.user?.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {registration.user?.verified_rank || 'Chưa xác định'}
                          </Badge>
                        </TableCell>
                        <TableCell>{registration.user?.elo || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={registration.status === 'confirmed' ? 'default' : 
                                   registration.status === 'cancelled' ? 'destructive' : 'secondary'}
                          >
                            {registration.status === 'confirmed' ? 'Đã xác nhận' :
                             registration.status === 'cancelled' ? 'Đã hủy' :
                             registration.status === 'pending' ? 'Chờ xử lý' : 'Đã đăng ký'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {registration.registration_date ? 
                            formatDate(registration.registration_date) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {registration.status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelRegistration(registration.id)}
                            >
                              Hủy
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {tournamentRegistrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Chưa có người tham gia</p>
                            <p className="text-sm">Thêm người chơi đầu tiên</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsParticipantsDialogOpen(false)}>
                Đóng
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Xuất danh sách
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User to Tournament Dialog */}
        <Dialog 
          open={isAddUserDialogOpen} 
          onOpenChange={(open) => {
            setIsAddUserDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Thêm người chơi vào: {selectedTournament?.name}
              </DialogTitle>
              <DialogDescription>
                Chọn người chơi để thêm vào giải đấu
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search Box */}
              <div>
                <Label htmlFor="user_search">Tìm kiếm người chơi</Label>
                <Input
                  id="user_search"
                  placeholder="Tìm theo tên, số điện thoại hoặc email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>

              {/* Selected Users Summary */}
              {selectedUsers.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Đã chọn {selectedUsers.length} người chơi
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedUsers.map(userId => {
                      const user = users.find(u => u.user_id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="text-xs">
                          {user?.full_name || 'N/A'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Users Table */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.user_id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>ELO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Đang tải...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Không tìm thấy người chơi</p>
                            <p className="text-sm">Thử thay đổi từ khóa tìm kiếm</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.slice(0, 50).map((user) => (
                        <TableRow 
                          key={user.user_id}
                          className={selectedUsers.includes(user.user_id) ? 'bg-blue-50' : ''}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.user_id)}
                              onChange={() => toggleUserSelection(user.user_id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.full_name || 'N/A'}
                          </TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.verified_rank || 'Chưa xác định'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.elo || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination note */}
              {filteredUsers.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Hiển thị 50 kết quả đầu tiên. Sử dụng tìm kiếm để thu hẹp danh sách.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleAddUsersToTournament} 
                disabled={selectedUsers.length === 0}
              >
                Thêm {selectedUsers.length} người chơi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageLayout>
  );
};

export default AdminTournamentsNew;
