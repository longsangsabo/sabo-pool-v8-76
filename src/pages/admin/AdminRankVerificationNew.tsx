import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  Star,
  Eye,
  MessageSquare,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  AlertTriangle,
  Award,
  Target,
  Users,
  TrendingUp,
  FileText,
  Camera,
  Video,
  User,
  Calendar,
  MapPin,
  Phone
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { toast } from 'sonner';

interface RankVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  currentRank: string;
  requestedRank: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  priority: 'high' | 'medium' | 'low';
  evidence: RankEvidence[];
  adminComments: AdminComment[];
  verificationScore: number;
  lastActivity: Date;
  location: string;
  contactInfo: string;
}

interface RankEvidence {
  id: string;
  type: 'tournament_result' | 'match_video' | 'certificate' | 'witness_statement';
  title: string;
  description: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  verified: boolean;
}

interface AdminComment {
  id: string;
  adminId: string;
  adminName: string;
  comment: string;
  timestamp: Date;
  action?: 'approve' | 'reject' | 'request_more_info';
}

const AdminRankVerificationNew = () => {
  const { t } = useTranslation();
  const [selectedRequest, setSelectedRequest] = useState<RankVerificationRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<RankEvidence | null>(null);

  // Mock data
  const [verificationRequests, setVerificationRequests] = useState<RankVerificationRequest[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Nguyễn Văn A',
      userAvatar: undefined,
      currentRank: 'Amateur',
      requestedRank: 'Professional',
      submittedAt: new Date('2025-08-01T10:00:00'),
      status: 'pending',
      priority: 'high',
      evidence: [
        {
          id: 'e1',
          type: 'tournament_result',
          title: 'Giải đấu cấp tỉnh 2025',
          description: 'Đạt giải nhì tại giải đấu billiards cấp tỉnh',
          uploadedAt: new Date('2025-08-01T09:00:00'),
          verified: false
        },
        {
          id: 'e2',
          type: 'match_video',
          title: 'Video trận đấu chung kết',
          description: 'Trận chung kết với tỷ số 5-2',
          fileUrl: '/videos/match1.mp4',
          thumbnailUrl: '/thumbnails/match1.jpg',
          uploadedAt: new Date('2025-08-01T09:15:00'),
          verified: false
        }
      ],
      adminComments: [],
      verificationScore: 75,
      lastActivity: new Date('2025-08-01T10:00:00'),
      location: 'TP. Hồ Chí Minh',
      contactInfo: '0961167717'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Trần Thị B',
      userAvatar: undefined,
      currentRank: 'Professional',
      requestedRank: 'Expert',
      submittedAt: new Date('2025-07-30T14:30:00'),
      status: 'under_review',
      priority: 'medium',
      evidence: [
        {
          id: 'e3',
          type: 'certificate',
          title: 'Chứng chỉ huấn luyện viên',
          description: 'Chứng chỉ huấn luyện viên billiards cấp quốc gia',
          fileUrl: '/certificates/cert1.pdf',
          uploadedAt: new Date('2025-07-30T14:00:00'),
          verified: true
        }
      ],
      adminComments: [
        {
          id: 'c1',
          adminId: 'admin1',
          adminName: 'Admin User',
          comment: 'Cần thêm video thực tế để xác thực kỹ năng',
          timestamp: new Date('2025-07-31T09:00:00'),
          action: 'request_more_info'
        }
      ],
      verificationScore: 85,
      lastActivity: new Date('2025-07-31T15:00:00'),
      location: 'Hà Nội',
      contactInfo: '0912345678'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Lê Văn C',
      userAvatar: undefined,
      currentRank: 'Beginner',
      requestedRank: 'Amateur',
      submittedAt: new Date('2025-07-28T11:20:00'),
      status: 'approved',
      priority: 'low',
      evidence: [
        {
          id: 'e4',
          type: 'witness_statement',
          title: 'Chứng nhận từ CLB',
          description: 'Xác nhận kỹ năng từ CLB Billiards Sài Gòn',
          uploadedAt: new Date('2025-07-28T11:00:00'),
          verified: true
        }
      ],
      adminComments: [
        {
          id: 'c2',
          adminId: 'admin1',
          adminName: 'Admin User',
          comment: 'Đã xác thực thành công. Cấp hạng Amateur.',
          timestamp: new Date('2025-07-29T10:00:00'),
          action: 'approve'
        }
      ],
      verificationScore: 90,
      lastActivity: new Date('2025-07-29T10:00:00'),
      location: 'TP. Hồ Chí Minh',
      contactInfo: '0987654321'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'tournament_result':
        return <Award className="h-4 w-4" />;
      case 'match_video':
        return <Video className="h-4 w-4" />;
      case 'certificate':
        return <FileText className="h-4 w-4" />;
      case 'witness_statement':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleApprove = (requestId: string) => {
    setVerificationRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const }
          : req
      )
    );
    toast.success('Rank verification approved!');
  };

  const handleReject = (requestId: string) => {
    setVerificationRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
    toast.success('Rank verification rejected!');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedRequest) return;

    const comment: AdminComment = {
      id: Date.now().toString(),
      adminId: 'current-admin',
      adminName: 'Current Admin',
      comment: newComment,
      timestamp: new Date()
    };

    setVerificationRequests(prev => 
      prev.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, adminComments: [...req.adminComments, comment] }
          : req
      )
    );

    setNewComment('');
    toast.success('Comment added successfully!');
  };

  const filteredRequests = verificationRequests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requestedRank.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    {
      title: t('rank_verification.pending_verifications'),
      value: verificationRequests.filter(r => r.status === 'pending').length.toString(),
      description: t('rank_verification.awaiting_review'),
      icon: Clock,
    },
    {
      title: 'Under Review',
      value: verificationRequests.filter(r => r.status === 'under_review').length.toString(),
      description: 'In progress',
      icon: Eye,
    },
    {
      title: 'Approved Today',
      value: verificationRequests.filter(r => 
        r.status === 'approved' && 
        r.lastActivity.toDateString() === new Date().toDateString()
      ).length.toString(),
      description: 'Today',
      icon: CheckCircle,
    },
    {
      title: 'Success Rate',
      value: `${Math.round((verificationRequests.filter(r => r.status === 'approved').length / verificationRequests.length) * 100)}%`,
      description: 'Overall approval',
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
        Bulk Import
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Manual Verify
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
            <AdminPageLayout
        title={t('rank_verification.title')}
        description={t('rank_verification.description')}
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

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or rank..."
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
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Requests List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRequest?.id === request.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedRequest(request)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.userAvatar} />
                          <AvatarFallback>
                            {request.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-medium">{request.userName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>{request.currentRank} → {request.requestedRank}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{request.submittedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(request.priority)}>
                          {request.priority} priority
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Score: {request.verificationScore}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Verification Score</span>
                        <span>{request.verificationScore}%</span>
                      </div>
                      <Progress value={request.verificationScore} className="h-2" />
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{request.evidence.length} evidence(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{request.adminComments.length} comment(s)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredRequests.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No requests found</h3>
                    <p className="text-muted-foreground">
                      No verification requests match your current filters.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Request Details */}
            <div className="space-y-6">
              {selectedRequest ? (
                <>
                  {/* Request Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Request Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedRequest.userAvatar} />
                            <AvatarFallback>
                              {selectedRequest.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedRequest.userName}</div>
                            <div className="text-sm text-muted-foreground">ID: {selectedRequest.userId}</div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current Rank:</span>
                            <Badge variant="outline">{selectedRequest.currentRank}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Requested Rank:</span>
                            <Badge>{selectedRequest.requestedRank}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Priority:</span>
                            <Badge className={getPriorityColor(selectedRequest.priority)}>
                              {selectedRequest.priority}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Score:</span>
                            <span className="font-medium">{selectedRequest.verificationScore}%</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedRequest.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <span>{selectedRequest.contactInfo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Submitted: {selectedRequest.submittedAt.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {selectedRequest.status === 'pending' && (
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={() => handleApprove(selectedRequest.id)}
                            className="flex-1"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleReject(selectedRequest.id)}
                            variant="destructive"
                            className="flex-1"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Evidence */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Evidence ({selectedRequest.evidence.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedRequest.evidence.map((evidence) => (
                          <div key={evidence.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                              {getEvidenceIcon(evidence.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{evidence.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {evidence.description}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {evidence.type.replace('_', ' ')}
                                </Badge>
                                {evidence.verified && (
                                  <Badge className="text-xs bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedEvidence(evidence);
                                setShowEvidenceModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Admin Comments ({selectedRequest.adminComments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {selectedRequest.adminComments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{comment.adminName}</span>
                              <span className="text-xs text-muted-foreground">
                                {comment.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                            {comment.action && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {comment.action.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <Button onClick={handleAddComment} size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Request</h3>
                    <p className="text-muted-foreground">
                      Choose a verification request to view details and take action.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Modal */}
        <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Evidence Details</DialogTitle>
              <DialogDescription>
                Review the submitted evidence for rank verification
              </DialogDescription>
            </DialogHeader>
            {selectedEvidence && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getEvidenceIcon(selectedEvidence.type)}
                  <div>
                    <h3 className="font-medium">{selectedEvidence.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedEvidence.description}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Evidence type: {selectedEvidence.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {selectedEvidence.uploadedAt.toLocaleString()}
                  </p>
                  {selectedEvidence.fileUrl && (
                    <Button className="mt-2" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminRankVerificationNew;
