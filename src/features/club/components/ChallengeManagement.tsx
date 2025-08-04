import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  Target, 
  Plus, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Swords,
  Zap,
  Star,
  Users,
  Award
} from 'lucide-react';

interface Challenge {
  id: string;
  challenger: string;
  challenged: string;
  type: 'ranked' | 'friendly' | 'tournament';
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  elo_stake: number;
  prize: number;
  created_at: string;
  scheduled_at?: string;
  result?: 'challenger_wins' | 'challenged_wins' | 'draw';
  score?: string;
}

export const ChallengeManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  // Mock data
  const challenges: Challenge[] = [
    {
      id: '1',
      challenger: 'Nguyễn Văn A',
      challenged: 'Trần Văn B',
      type: 'ranked',
      status: 'pending',
      elo_stake: 25,
      prize: 100000,
      created_at: '2024-01-15T10:00:00Z',
      scheduled_at: '2024-01-20T14:00:00Z'
    },
    {
      id: '2',
      challenger: 'Lê Thị C',
      challenged: 'Phạm Văn D',
      type: 'friendly',
      status: 'accepted',
      elo_stake: 0,
      prize: 50000,
      created_at: '2024-01-14T15:30:00Z',
      scheduled_at: '2024-01-18T16:00:00Z'
    },
    {
      id: '3',
      challenger: 'Hoàng Văn E',
      challenged: 'Đỗ Thị F',
      type: 'ranked',
      status: 'completed',
      elo_stake: 30,
      prize: 150000,
      created_at: '2024-01-10T09:00:00Z',
      result: 'challenger_wins',
      score: '5-3'
    }
  ];

  const getStatusBadge = (status: Challenge['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Chờ phản hồi', icon: Clock },
      accepted: { variant: 'default' as const, text: 'Đã chấp nhận', icon: CheckCircle2 },
      declined: { variant: 'destructive' as const, text: 'Từ chối', icon: XCircle },
      completed: { variant: 'default' as const, text: 'Hoàn thành', icon: Trophy },
      expired: { variant: 'outline' as const, text: 'Hết hạn', icon: XCircle }
    };
    
    const { variant, text, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getTypeBadge = (type: Challenge['type']) => {
    const variants = {
      ranked: { variant: 'default' as const, text: 'Xếp hạng', icon: Trophy },
      friendly: { variant: 'secondary' as const, text: 'Giao hữu', icon: Swords },
      tournament: { variant: 'destructive' as const, text: 'Giải đấu', icon: Award }
    };
    
    const { variant, text, icon: Icon } = variants[type];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const CreateChallengeForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tạo thử thách mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="challenged">Người được thách đấu</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đối thủ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player1">Nguyễn Văn A (Elo: 1850)</SelectItem>
                <SelectItem value="player2">Trần Văn B (Elo: 1720)</SelectItem>
                <SelectItem value="player3">Lê Thị C (Elo: 1960)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Loại thử thách</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ranked">Xếp hạng (có ảnh hưởng Elo)</SelectItem>
                <SelectItem value="friendly">Giao hữu (không ảnh hưởng Elo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="elo_stake">Điểm Elo đặt cược</Label>
            <Input type="number" placeholder="0-50" min="0" max="50" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prize">Giải thưởng (VNĐ)</Label>
            <Input type="number" placeholder="50,000 - 500,000" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Thời gian đấu (tùy chọn)</Label>
          <Input type="datetime-local" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateChallenge(false)}>
            Hủy
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Gửi thử thách
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ChallengeList = ({ challenges }: { challenges: Challenge[] }) => (
    <div className="space-y-4">
      {challenges.map((challenge) => (
        <Card key={challenge.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{challenge.challenger}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-semibold">{challenge.challenged}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getTypeBadge(challenge.type)}
                  {getStatusBadge(challenge.status)}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {challenge.elo_stake > 0 && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {challenge.elo_stake} Elo
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {challenge.prize.toLocaleString()} VNĐ
                  </div>
                  {challenge.scheduled_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(challenge.scheduled_at).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {challenge.result && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Kết quả:</span>
                    <Badge variant="default">
                      {challenge.result === 'challenger_wins' ? challenge.challenger : 
                       challenge.result === 'challenged_wins' ? challenge.challenged : 'Hòa'}
                    </Badge>
                    {challenge.score && (
                      <span className="text-sm text-muted-foreground">({challenge.score})</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {challenge.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline">
                      <XCircle className="h-4 w-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Chấp nhận
                    </Button>
                  </>
                )}
                {challenge.status === 'accepted' && (
                  <Button size="sm">
                    <Zap className="h-4 w-4 mr-1" />
                    Bắt đầu
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const activeChallenges = challenges.filter(c => ['pending', 'accepted'].includes(c.status));
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hệ thống thử thách</h2>
          <p className="text-muted-foreground">Quản lý và tham gia các thử thách billiards</p>
        </div>
        <Button onClick={() => setShowCreateChallenge(!showCreateChallenge)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo thử thách
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Thử thách chờ</p>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang diễn ra</p>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'accepted').length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng giải thưởng</p>
                <p className="text-lg font-bold">
                  {challenges.reduce((sum, c) => sum + c.prize, 0).toLocaleString()} VNĐ
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Challenge Form */}
      {showCreateChallenge && <CreateChallengeForm />}

      {/* Challenge Lists */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Thử thách hiện tại</TabsTrigger>
          <TabsTrigger value="completed">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <ChallengeList challenges={activeChallenges} />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <ChallengeList challenges={completedChallenges} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChallengeManagement;
