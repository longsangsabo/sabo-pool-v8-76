import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Check, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Mock data for verification requests
const mockVerifications = [
  {
    id: '1',
    profiles: {
      avatar_url: '/avatars/user1.jpg',
      display_name: 'Nguyễn Văn A',
      full_name: 'Nguyễn Văn A'
    },
    current_rank: 'Trung cấp',
    requested_rank: 'Cao cấp',
    created_at: '2025-01-15T10:30:00Z',
    status: 'pending',
    evidence_description: 'Đã tham gia nhiều giải đấu và có thành tích tốt'
  },
  {
    id: '2',
    profiles: {
      avatar_url: '/avatars/user2.jpg',
      display_name: 'Trần Thị B',
      full_name: 'Trần Thị B'
    },
    current_rank: 'Cơ bản',
    requested_rank: 'Trung cấp',
    created_at: '2025-01-14T15:20:00Z',
    status: 'pending',
    evidence_description: 'Đã hoàn thành khóa học và có chứng chỉ'
  }
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const VerificationManagement = ({ clubId }: { clubId: string }) => {
  const [verifications] = React.useState(mockVerifications);
  const [selectedVerification, setSelectedVerification] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const selectedVerificationData = verifications.find(v => v.id === selectedVerification);

  const handleApprove = async (id: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Approved verification:', id, 'with notes:', notes);
    setSelectedVerification(null);
    setNotes('');
    setLoading(false);
  };

  const handleReject = async (id: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Rejected verification:', id, 'with notes:', notes);
    setSelectedVerification(null);
    setNotes('');
    setLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Yêu cầu xác thực cấp độ ({verifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifications.map((verification) => (
              <Card key={verification.id} className="p-4 border-l-4 border-l-orange-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={verification.profiles.avatar_url} />
                      <AvatarFallback className="bg-primary/10">
                        {verification.profiles.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{verification.profiles.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-blue-50">
                          Hiện tại: {verification.current_rank}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className="bg-green-100 text-green-800">
                          Yêu cầu: {verification.requested_rank}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {formatDate(verification.created_at)}
                        </p>
                      </div>
                      {verification.evidence_description && (
                        <p className="text-sm mt-2 text-gray-600 italic">
                          "{verification.evidence_description}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:bg-green-50 hover:border-green-300"
                      onClick={() => setSelectedVerification(verification.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:border-red-300"
                      onClick={() => setSelectedVerification(verification.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {verifications.length === 0 && (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Không có yêu cầu xác thực nào</p>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Xác thực yêu cầu của {selectedVerificationData?.profiles.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVerificationData && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-2">
                  <div><strong>Cấp độ hiện tại:</strong> {selectedVerificationData.current_rank}</div>
                  <div><strong>Cấp độ yêu cầu:</strong> {selectedVerificationData.requested_rank}</div>
                  <div><strong>Lý do:</strong> {selectedVerificationData.evidence_description}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Ghi chú (tùy chọn):</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thêm ghi chú về quyết định của bạn..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedVerification(null)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => selectedVerification && handleReject(selectedVerification)}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Từ chối'}
            </Button>
            <Button
              onClick={() => selectedVerification && handleApprove(selectedVerification)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Đang xử lý...' : 'Duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
