import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Clock,
  Plus,
  Download,
  Upload,
  TrendingUp,
  CheckCircle,
  Timer,
  Eye,
  Trash2,
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { toast } from 'sonner';
import { useAdminChallenges, ChallengeWithProfiles, ChallengeStats } from '@/hooks/useAdminChallenges';
import { DatabaseTest } from '@/components/DatabaseTest';

function AdminChallengesNewContent() {
  const { t } = useTranslation();
  
  // Admin Challenges Hook
  const {
    challenges,
    loading,
    error,
    getAllChallenges,
    createChallenge,
    updateChallengeStatus,
    deleteChallenge,
    getChallengeStats,
    expireOldChallenges,
    refetchChallenges
  } = useAdminChallenges();

  // State
  const [allChallenges, setAllChallenges] = useState<ChallengeWithProfiles[]>([]);
  const [stats, setStats] = useState<ChallengeStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
    total_bet_amount: 0,
    avg_bet_amount: 0,
    completion_rate: 0
  });
  
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithProfiles | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('AdminChallengesNew: Starting to fetch challenges...');
      try {
        const [challengesData, statsData] = await Promise.all([
          getAllChallenges(),
          getChallengeStats()
        ]);
        
        console.log('AdminChallengesNew: Challenges fetched, count:', challengesData.length);
        setAllChallenges(challengesData);
        setStats(statsData);
      } catch (error) {
        console.error('AdminChallengesNew: Error fetching challenges:', error);
      }
    };
    
    loadData();
  }, [getAllChallenges, getChallengeStats]);

  // Update when challenges change
  useEffect(() => {
    console.log('AdminChallengesNew: Challenges updated:', allChallenges.length, allChallenges);
  }, [allChallenges]);

  // Update when loading state changes
  useEffect(() => {
    console.log('AdminChallengesNew: Loading state:', loading);
  }, [loading]);

  // Update when stats change
  useEffect(() => {
    if (stats.total > 0) {
      console.log('AdminChallengesNew: Loading stats...');
      console.log('AdminChallengesNew: Stats loaded:', stats);
    }
  }, [stats]);

  const handleCreateChallenge = async () => {
    // TODO: Implement create challenge logic with form values
    toast.success('Challenge creation coming soon!');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Database Test Component */}
      <DatabaseTest />

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng thách đấu</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đang chờ</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoàn thành</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tỷ lệ hoàn thành</p>
                <p className="text-3xl font-bold">{stats.completion_rate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="accepted">Đã chấp nhận</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => expireOldChallenges()} variant="outline">
              <Timer className="h-4 w-4 mr-2" />
              Hết hạn cũ
            </Button>
            <Button onClick={() => refetchChallenges()} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo thách đấu
            </Button>
          </div>
        </div>

        {/* Challenges Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-muted-foreground">Đang tải...</div>
              </div>
            ) : allChallenges.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium">Không có thách đấu nào</div>
                <div className="text-muted-foreground">Chưa có thách đấu nào được tạo hoặc chưa load được data từ database</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4">Thách đấu</th>
                      <th className="text-left p-4">Challenger</th>
                      <th className="text-left p-4">Opponent</th>
                      <th className="text-left p-4">Bet Points</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allChallenges
                      .filter(challenge => 
                        filter === 'all' || challenge.status === filter
                      )
                      .filter(challenge => 
                        searchTerm === '' || 
                        challenge.challenger?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        challenge.opponent?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((challenge) => (
                        <tr key={challenge.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">Race to {challenge.race_to}</div>
                              {challenge.message && (
                                <div className="text-sm text-muted-foreground">{challenge.message}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {challenge.challenger?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{challenge.challenger?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {challenge.challenger?.verified_rank || 'No rank'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {challenge.opponent?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{challenge.opponent?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {challenge.opponent?.verified_rank || 'No rank'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{challenge.bet_points} SPA</div>
                          </td>
                          <td className="p-4">
                            <Badge className={
                              challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              challenge.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              challenge.status === 'completed' ? 'bg-green-100 text-green-800' :
                              challenge.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              challenge.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                              ''
                            }>
                              {challenge.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-muted-foreground">
                              {new Date(challenge.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setSelectedChallenge(challenge)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteChallenge(challenge.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Challenge Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo thách đấu mới</DialogTitle>
            <DialogDescription>
              Tạo thách đấu giữa hai người chơi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Challenger ID</Label>
              <Input placeholder="Enter challenger user ID" />
            </div>
            <div>
              <Label>Opponent ID</Label>
              <Input placeholder="Enter opponent user ID" />
            </div>
            <div>
              <Label>Bet Points</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select bet amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 SPA</SelectItem>
                  <SelectItem value="200">200 SPA</SelectItem>
                  <SelectItem value="300">300 SPA</SelectItem>
                  <SelectItem value="400">400 SPA</SelectItem>
                  <SelectItem value="500">500 SPA</SelectItem>
                  <SelectItem value="600">600 SPA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Race To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select race to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Race to 5</SelectItem>
                  <SelectItem value="8">Race to 8</SelectItem>
                  <SelectItem value="10">Race to 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message (Optional)</Label>
              <Textarea placeholder="Challenge message..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateChallenge}>
                Tạo thách đấu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminChallengesNew() {
  return (
    <AdminCoreProvider>
      <AdminPageLayout 
        title="Challenge Management"
        subtitle="Manage and monitor user challenges in the system"
      >
        <AdminChallengesNewContent />
      </AdminPageLayout>
    </AdminCoreProvider>
  );
}
