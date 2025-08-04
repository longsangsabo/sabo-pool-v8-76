import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Target, 
  Swords,
  Trophy,
  Clock,
  Star,
  Play,
  Pause,
  Square,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  AlertTriangle,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Timer,
  Award,
  Zap,
  Shield,
  Flame
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { toast } from 'sonner';
import { useAdminChallenges, ChallengeWithProfiles, ChallengeStats } from '@/hooks/useAdminChallenges';
import { DatabaseTest } from '@/components/DatabaseTest';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar?: string;
  challengerRank: string;
  opponentId?: string;
  opponentName?: string;
  opponentAvatar?: string;
  opponentRank?: string;
  status: 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  type: 'friendly' | 'ranked' | 'tournament' | 'wager';
  gameFormat: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  betAmount?: number;
  location: string;
  scheduledAt?: Date;
  createdAt: Date;
  completedAt?: Date;
  winnerId?: string;
  score?: string;
  adminNotes: string[];
  priority: 'low' | 'medium' | 'high';
  isSponsored: boolean;
  viewCount: number;
  likeCount: number;
}

interface ChallengeDispute {
  id: string;
  challengeId: string;
  reportedBy: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

const AdminChallengesNew = () => {
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
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('AdminChallengesNew: Loading challenges...');
      try {
        const [challengesData, statsData] = await Promise.all([
          getAllChallenges(),
          getChallengeStats()
        ]);
        
        setAllChallenges(challengesData);
        setStats(statsData);
        console.log('AdminChallengesNew: Data loaded:', { challenges: challengesData.length, stats: statsData });
      } catch (error) {
        console.error('AdminChallengesNew: Error loading data:', error);
      }
    };
    
    loadData();
  }, [getAllChallenges, getChallengeStats]);

  // Update when challenges change
  useEffect(() => {
    if (challenges) {
      console.log('AdminChallengesNew: Challenges updated:', challenges.length);
    }
  }, [challenges]);

  // Update when loading state changes
  useEffect(() => {
    console.log('AdminChallengesNew: Loading state:', loading);
  }, [loading]);

  // Update when stats change
  useEffect(() => {
    if (stats) {
      console.log('AdminChallengesNew: Stats updated:', stats);
    }
  }, [stats]);
  const [selectedDispute, setSelectedDispute] = useState<ChallengeDispute | null>(null);
  const [newAdminNote, setNewAdminNote] = useState('');

  // Mock data
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Championship Qualifier Challenge',
      description: 'Seeking strong opponent for championship preparation',
      challengerId: 'user1',
      challengerName: 'Nguyễn Văn A',
      challengerRank: 'Professional',
      opponentId: 'user2',
      opponentName: 'Trần Thị B',
      opponentRank: 'Expert',
      status: 'in_progress',
      type: 'ranked',
      gameFormat: '9_ball',
      betAmount: 500000,
      location: 'CLB Billiards Sài Gòn',
      scheduledAt: new Date('2025-08-05T19:00:00'),
      createdAt: new Date('2025-08-01T10:00:00'),
      adminNotes: ['High-profile match', 'Monitor closely'],
      priority: 'high',
      isSponsored: true,
      viewCount: 1250,
      likeCount: 89
    },
    {
      id: '2',
      title: 'Friendly 8-Ball Match',
      description: 'Looking for casual game, beginners welcome',
      challengerId: 'user3',
      challengerName: 'Lê Văn C',
      challengerRank: 'Amateur',
      status: 'open',
      type: 'friendly',
      gameFormat: '8_ball',
      location: 'TP. Hồ Chí Minh',
      createdAt: new Date('2025-08-02T14:30:00'),
      adminNotes: [],
      priority: 'low',
      isSponsored: false,
      viewCount: 45,
      likeCount: 3
    },
    {
      id: '3',
      title: 'High Stakes Tournament Prep',
      description: 'Training match before major tournament',
      challengerId: 'user4',
      challengerName: 'Phạm Thị D',
      challengerRank: 'Expert',
      opponentId: 'user5',
      opponentName: 'Hoàng Văn E',
      opponentRank: 'Professional',
      status: 'completed',
      type: 'wager',
      gameFormat: '10_ball',
      betAmount: 1000000,
      location: 'Hà Nội Billiards Center',
      scheduledAt: new Date('2025-07-30T20:00:00'),
      createdAt: new Date('2025-07-28T09:00:00'),
      completedAt: new Date('2025-07-30T22:30:00'),
      winnerId: 'user4',
      score: '7-5',
      adminNotes: ['Verified winner', 'Payment processed'],
      priority: 'medium',
      isSponsored: false,
      viewCount: 892,
      likeCount: 67
    },
    {
      id: '4',
      title: 'Disputed Match Resolution',
      description: 'Match outcome under dispute review',
      challengerId: 'user6',
      challengerName: 'Vũ Thị F',
      challengerRank: 'Amateur',
      opponentId: 'user7',
      opponentName: 'Đặng Văn G',
      opponentRank: 'Professional',
      status: 'disputed',
      type: 'ranked',
      gameFormat: 'straight_pool',
      betAmount: 200000,
      location: 'CLB Billiards Hà Nội',
      scheduledAt: new Date('2025-08-01T18:00:00'),
      createdAt: new Date('2025-07-31T11:00:00'),
      completedAt: new Date('2025-08-01T20:15:00'),
      score: '10-8',
      adminNotes: ['Dispute reported', 'Under investigation', 'Evidence requested'],
      priority: 'high',
      isSponsored: false,
      viewCount: 234,
      likeCount: 12
    }
  ]);

  const [disputes, setDisputes] = useState<ChallengeDispute[]>([
    {
      id: 'd1',
      challengeId: '4',
      reportedBy: 'user6',
      reason: 'Unfair play',
      description: 'Opponent was coaching during the match which is against rules',
      status: 'investigating',
      createdAt: new Date('2025-08-01T21:00:00')
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Target className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <Trophy className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'friendly':
        return 'bg-green-100 text-green-800';
      case 'ranked':
        return 'bg-blue-100 text-blue-800';
      case 'tournament':
        return 'bg-purple-100 text-purple-800';
      case 'wager':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = (challengeId: string, newStatus: string) => {
    setChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, status: newStatus as Challenge['status'] }
          : challenge
      )
    );
    toast.success(`Challenge status updated to ${newStatus}!`);
  };

  const handleAddAdminNote = () => {
    if (!newAdminNote.trim() || !selectedChallenge) return;

    setChallenges(prev => 
      prev.map(challenge => 
        challenge.id === selectedChallenge.id 
          ? { ...challenge, adminNotes: [...challenge.adminNotes, newAdminNote] }
          : challenge
      )
    );

    setNewAdminNote('');
    toast.success('Admin note added successfully!');
  };

  const handleToggleSponsored = (challengeId: string) => {
    setChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, isSponsored: !challenge.isSponsored }
          : challenge
      )
    );
    toast.success('Sponsored status updated!');
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesFilter = filter === 'all' || challenge.status === filter;
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.challengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (challenge.opponentName && challenge.opponentName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = [
    {
      title: 'Active Challenges',
      value: challenges.filter(c => ['open', 'accepted', 'in_progress'].includes(c.status)).length.toString(),
      description: 'Currently active',
      icon: Target,
    },
    {
      title: 'Disputed Matches',
      value: challenges.filter(c => c.status === 'disputed').length.toString(),
      description: 'Need attention',
      icon: AlertTriangle,
    },
    {
      title: 'Total Wager Value',
      value: `${challenges.filter(c => c.betAmount).reduce((sum, c) => sum + (c.betAmount || 0), 0).toLocaleString()}đ`,
      description: 'In active bets',
      icon: DollarSign,
    },
    {
      title: 'Completion Rate',
      value: `${Math.round((challenges.filter(c => c.status === 'completed').length / challenges.length) * 100)}%`,
      description: 'Success rate',
      icon: TrendingUp,
    },
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Bulk Actions
      </Button>
      <Button 
        onClick={() => setShowCreateModal(true)}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Challenge
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('challenges.title')}
        description={t('challenges.description')}
        actions={pageActions}
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList>
              <TabsTrigger value="challenges">{t('challenges.all_challenges')}</TabsTrigger>
              <TabsTrigger value="disputes">{t('challenges.disputes')}</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search challenges, players..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Challenges</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Challenges Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Challenges List */}
                <div className="lg:col-span-2 space-y-4">
                  {filteredChallenges.map((challenge) => (
                    <Card key={challenge.id} className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChallenge?.id === challenge.id ? 'ring-2 ring-primary' : ''
                    }`} onClick={() => setSelectedChallenge(challenge)}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{challenge.title}</h3>
                                {challenge.isSponsored && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Sponsored
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {challenge.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusColor(challenge.status)}>
                                {getStatusIcon(challenge.status)}
                                <span className="ml-1 capitalize">{challenge.status.replace('_', ' ')}</span>
                              </Badge>
                              <Badge variant="outline" className={getPriorityColor(challenge.priority)}>
                                {challenge.priority} priority
                              </Badge>
                            </div>
                          </div>

                          {/* Players */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={challenge.challengerAvatar} />
                                <AvatarFallback>
                                  {challenge.challengerName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{challenge.challengerName}</div>
                                <Badge variant="outline" className="text-xs">{challenge.challengerRank}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">Challenger</div>
                            </div>

                            {challenge.opponentId && (
                              <>
                                <div className="flex justify-center">
                                  <Swords className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={challenge.opponentAvatar} />
                                    <AvatarFallback>
                                      {challenge.opponentName?.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{challenge.opponentName}</div>
                                    <Badge variant="outline" className="text-xs">{challenge.opponentRank}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Opponent</div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Challenge Details */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <Badge variant="outline" className={getTypeColor(challenge.type)}>
                                {challenge.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              <span>{challenge.gameFormat.replace('_', ' ')}</span>
                            </div>
                            {challenge.betAmount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{challenge.betAmount.toLocaleString()}đ</span>
                              </div>
                            )}
                          </div>

                          {/* Location & Time */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{challenge.location}</span>
                            </div>
                            {challenge.scheduledAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{challenge.scheduledAt.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Engagement */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{challenge.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{challenge.likeCount}</span>
                            </div>
                            {challenge.adminNotes.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{challenge.adminNotes.length} note(s)</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          {challenge.status === 'disputed' && (
                            <div className="pt-2 border-t">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDisputeModal(true);
                                }}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Handle Dispute
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredChallenges.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No challenges found</h3>
                        <p className="text-muted-foreground">
                          No challenges match your current filters.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Challenge Details Panel */}
                <div className="space-y-6">
                  {selectedChallenge ? (
                    <>
                      {/* Challenge Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5" />
                            Challenge Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <div className="mt-1">
                                <Select 
                                  value={selectedChallenge.status} 
                                  onValueChange={(value) => handleUpdateStatus(selectedChallenge.id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="disputed">Disputed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Sponsored Status</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Switch
                                  checked={selectedChallenge.isSponsored}
                                  onCheckedChange={() => handleToggleSponsored(selectedChallenge.id)}
                                />
                                <Label className="text-sm">
                                  {selectedChallenge.isSponsored ? 'Sponsored' : 'Regular'}
                                </Label>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Type:</span>
                                <Badge className={getTypeColor(selectedChallenge.type)}>
                                  {selectedChallenge.type}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Game Format:</span>
                                <span className="text-sm font-medium">
                                  {selectedChallenge.gameFormat.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Priority:</span>
                                <Badge className={getPriorityColor(selectedChallenge.priority)}>
                                  {selectedChallenge.priority}
                                </Badge>
                              </div>
                              {selectedChallenge.betAmount && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Wager:</span>
                                  <span className="text-sm font-medium">
                                    {selectedChallenge.betAmount.toLocaleString()}đ
                                  </span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Views:</span>
                                <span className="text-sm">{selectedChallenge.viewCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Likes:</span>
                                <span className="text-sm">{selectedChallenge.likeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Created:</span>
                                <span className="text-sm">{selectedChallenge.createdAt.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Admin Notes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Admin Notes ({selectedChallenge.adminNotes.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {selectedChallenge.adminNotes.map((note, index) => (
                              <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                                {note}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3">
                            <Textarea
                              placeholder="Add admin note..."
                              value={newAdminNote}
                              onChange={(e) => setNewAdminNote(e.target.value)}
                              rows={3}
                            />
                            <Button onClick={handleAddAdminNote} size="sm" className="w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a Challenge</h3>
                        <p className="text-muted-foreground">
                          Choose a challenge to view details and manage settings.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Challenge Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="p-4 border rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Dispute #{dispute.id}</div>
                              <div className="text-sm text-muted-foreground">
                                Challenge: {challenges.find(c => c.id === dispute.challengeId)?.title}
                              </div>
                            </div>
                            <Badge className={getStatusColor(dispute.status)}>
                              {dispute.status}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Reason: {dispute.reason}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {dispute.description}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Reported: {dispute.createdAt.toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Investigate
                              </Button>
                              <Button size="sm">
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                    <p className="text-muted-foreground">
                      Challenge analytics and insights will be displayed here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">System Settings</h3>
                    <p className="text-muted-foreground">
                      Challenge system configuration options will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
  return (
    <AdminCoreProvider>
      <AdminPageLayout 
        title="Challenge Management"
        subtitle="Manage and monitor user challenges in the system"
      >
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
                    <div className="text-muted-foreground">Chưa có thách đấu nào được tạo</div>
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
                  <Button onClick={() => setShowCreateModal(false)}>
                    Tạo thách đấu
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminChallengesNew;
