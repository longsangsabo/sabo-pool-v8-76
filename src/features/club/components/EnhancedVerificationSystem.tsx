import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  Eye,
  Star,
  Award,
  Shield,
  Users,
  Camera,
  FileText,
  Video,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';

interface VerificationRequest {
  id: string;
  player_name: string;
  current_rank: string;
  requested_rank: string;
  submission_type: 'video' | 'live_demo' | 'tournament_result';
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  submitted_at: string;
  evidence: {
    type: 'video' | 'image' | 'document';
    url: string;
    description: string;
  }[];
  reviewer?: string;
  review_notes?: string;
  elo_current: number;
  elo_required: number;
}

interface RankCriteria {
  rank: string;
  min_elo: number;
  requirements: string[];
  verification_method: string[];
  badge_color: string;
}

export const EnhancedVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showCriteria, setShowCriteria] = useState(false);

  // Mock data
  const verificationRequests: VerificationRequest[] = [
    {
      id: '1',
      player_name: 'Nguyễn Văn A',
      current_rank: 'Trung cấp',
      requested_rank: 'Cao cấp',
      submission_type: 'video',
      status: 'pending',
      submitted_at: '2024-01-20T10:00:00Z',
      evidence: [
        {
          type: 'video',
          url: 'https://example.com/video1.mp4',
          description: 'Video thể hiện kỹ thuật break shot và combo shots'
        },
        {
          type: 'image',
          url: 'https://example.com/score.jpg',
          description: 'Ảnh chụp kết quả trận đấu với người chơi cao cấp'
        }
      ],
      elo_current: 1650,
      elo_required: 1800
    },
    {
      id: '2',
      player_name: 'Trần Thị B',
      current_rank: 'Cao cấp',
      requested_rank: 'Chuyên nghiệp',
      submission_type: 'tournament_result',
      status: 'approved',
      submitted_at: '2024-01-18T14:30:00Z',
      evidence: [
        {
          type: 'document',
          url: 'https://example.com/tournament.pdf',
          description: 'Chứng nhận vô địch giải CLB tháng 12'
        }
      ],
      reviewer: 'Admin',
      review_notes: 'Thành tích thi đấu xuất sắc, đạt yêu cầu.',
      elo_current: 1920,
      elo_required: 1900
    },
    {
      id: '3',
      player_name: 'Lê Văn C',
      current_rank: 'Mới bắt đầu',
      requested_rank: 'Trung cấp',
      submission_type: 'live_demo',
      status: 'requires_review',
      submitted_at: '2024-01-19T16:00:00Z',
      evidence: [
        {
          type: 'video',
          url: 'https://example.com/demo.mp4',
          description: 'Video demo trực tiếp các kỹ thuật cơ bản'
        }
      ],
      reviewer: 'Expert 1',
      review_notes: 'Cần thể hiện thêm kỹ thuật side spin.',
      elo_current: 1420,
      elo_required: 1500
    }
  ];

  const rankCriteria: RankCriteria[] = [
    {
      rank: 'Mới bắt đầu',
      min_elo: 1000,
      requirements: ['Hiểu luật cơ bản', 'Biết cách cầm cơ', 'Có thể đánh thẳng'],
      verification_method: ['Tự đánh giá', 'Quiz cơ bản'],
      badge_color: 'bg-gray-500'
    },
    {
      rank: 'Trung cấp',
      min_elo: 1500,
      requirements: ['Break shot ổn định', 'Combo 2-3 bi', 'Hiểu về góc phản xạ'],
      verification_method: ['Video demo', 'Đấu với người cùng cấp'],
      badge_color: 'bg-blue-500'
    },
    {
      rank: 'Cao cấp',
      min_elo: 1800,
      requirements: ['Mass shot', 'Jump shot', 'Chiến thuật defensive'],
      verification_method: ['Video demo kỹ thuật', 'Thắng người cao cấp'],
      badge_color: 'bg-purple-500'
    },
    {
      rank: 'Chuyên nghiệp',
      min_elo: 1900,
      requirements: ['Kỹ thuật nâng cao', 'Thành tích thi đấu', 'Khả năng dạy học'],
      verification_method: ['Chứng nhận giải đấu', 'Đánh giá từ expert'],
      badge_color: 'bg-yellow-500'
    },
    {
      rank: 'Master',
      min_elo: 2000,
      requirements: ['Thành tích quốc gia', 'Kỹ thuật hoàn hảo', 'Đóng góp cộng đồng'],
      verification_method: ['Hồ sơ thi đấu chính thức', 'Đánh giá ủy ban'],
      badge_color: 'bg-red-500'
    }
  ];

  const getStatusBadge = (status: VerificationRequest['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Chờ duyệt', icon: Clock, color: 'text-orange-600' },
      approved: { variant: 'default' as const, text: 'Đã duyệt', icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, text: 'Từ chối', icon: XCircle, color: 'text-red-600' },
      requires_review: { variant: 'outline' as const, text: 'Cần xem lại', icon: Eye, color: 'text-blue-600' }
    };
    
    const { variant, text, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getSubmissionTypeBadge = (type: VerificationRequest['submission_type']) => {
    const variants = {
      video: { variant: 'default' as const, text: 'Video demo', icon: Video },
      live_demo: { variant: 'secondary' as const, text: 'Demo trực tiếp', icon: Camera },
      tournament_result: { variant: 'outline' as const, text: 'Kết quả thi đấu', icon: Award }
    };
    
    const { variant, text, icon: Icon } = variants[type];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const RankCriteriaCard = ({ criteria }: { criteria: RankCriteria }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-4 h-4 rounded-full ${criteria.badge_color}`}></div>
          <h4 className="font-semibold">{criteria.rank}</h4>
          <Badge variant="outline">Min: {criteria.min_elo} Elo</Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium mb-1">Yêu cầu kỹ thuật:</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              {criteria.requirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-1">Phương thức xác minh:</h5>
            <div className="flex flex-wrap gap-1">
              {criteria.verification_method.map((method, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const VerificationRequestCard = ({ request }: { request: VerificationRequest }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{request.player_name}</h4>
              <p className="text-sm text-muted-foreground">
                {request.current_rank} → {request.requested_rank}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {getStatusBadge(request.status)}
              {getSubmissionTypeBadge(request.submission_type)}
            </div>
          </div>

          {/* Elo Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Elo hiện tại: {request.elo_current}</span>
              <span>Yêu cầu: {request.elo_required}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  request.elo_current >= request.elo_required ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((request.elo_current / request.elo_required) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <h5 className="text-sm font-medium mb-2">Bằng chứng đính kèm:</h5>
            <div className="space-y-1">
              {request.evidence.map((evidence, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                  {evidence.type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                  {evidence.type === 'image' && <Camera className="h-4 w-4 text-green-500" />}
                  {evidence.type === 'document' && <FileText className="h-4 w-4 text-purple-500" />}
                  <span className="flex-1">{evidence.description}</span>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Xem
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Review Notes */}
          {request.review_notes && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Ghi chú từ {request.reviewer}:</span>
              </div>
              <p className="text-sm text-blue-800">{request.review_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {request.status === 'pending' && (
              <>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Duyệt
                </Button>
                <Button size="sm" variant="destructive" className="flex-1">
                  <XCircle className="h-3 w-3 mr-1" />
                  Từ chối
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Ghi chú
                </Button>
              </>
            )}
            {request.status === 'requires_review' && (
              <>
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Xem lại
                </Button>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Hoàn thành
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Gửi lúc: {new Date(request.submitted_at).toLocaleString('vi-VN')}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const pendingRequests = verificationRequests.filter(r => r.status === 'pending');
  const reviewRequests = verificationRequests.filter(r => r.status === 'requires_review');
  const completedRequests = verificationRequests.filter(r => ['approved', 'rejected'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hệ thống xác minh cấp độ</h2>
          <p className="text-muted-foreground">Quản lý và xét duyệt các yêu cầu nâng cấp trình độ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCriteria(!showCriteria)}>
            <Star className="h-4 w-4 mr-2" />
            {showCriteria ? 'Ẩn tiêu chuẩn' : 'Xem tiêu chuẩn'}
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Gửi yêu cầu
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cần xem lại</p>
                <p className="text-2xl font-bold text-blue-600">{reviewRequests.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{completedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng yêu cầu</p>
                <p className="text-2xl font-bold text-purple-600">{verificationRequests.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rank Criteria */}
      {showCriteria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Tiêu chuẩn xếp hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankCriteria.map((criteria, idx) => (
                <RankCriteriaCard key={idx} criteria={criteria} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Requests */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Chờ duyệt ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="review">Cần xem lại ({reviewRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Đã hoàn thành ({completedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4">
            {pendingRequests.map(request => (
              <VerificationRequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <div className="grid gap-4">
            {reviewRequests.map(request => (
              <VerificationRequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4">
            {completedRequests.map(request => (
              <VerificationRequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedVerificationSystem;
