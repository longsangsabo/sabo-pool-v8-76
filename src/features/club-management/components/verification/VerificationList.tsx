import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Check, X } from 'lucide-react';
import { useRankVerification } from '../../hooks/useRankVerification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '../../utils/clubHelpers';

export const VerificationList = ({ clubId }: { clubId: string }) => {
  const { verifications, loading, handleVerification } = useRankVerification(clubId);
  const [selectedVerification, setSelectedVerification] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  const handleApprove = async (id: string) => {
    const success = await handleVerification(id, 'approved', notes);
    if (success) {
      setSelectedVerification(null);
      setNotes('');
    }
  };

  const handleReject = async (id: string) => {
    const success = await handleVerification(id, 'rejected', notes);
    if (success) {
      setSelectedVerification(null);
      setNotes('');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Yêu cầu xác thực ({verifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifications.map((verification) => (
              <Card key={verification.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={verification.profiles.avatar_url} />
                      <AvatarFallback>
                        {verification.profiles.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{verification.profiles.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          Hiện tại: {verification.current_rank || 'Chưa xác thực'}
                        </Badge>
                        <Badge>Yêu cầu: {verification.requested_rank}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ngày yêu cầu: {formatDate(verification.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => setSelectedVerification(verification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setSelectedVerification(verification.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {verifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có yêu cầu xác thực nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xác thực</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Ghi chú (tùy chọn)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedVerification(null)}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              onClick={() => selectedVerification && handleApprove(selectedVerification)}
              className="bg-green-600 hover:bg-green-700"
            >
              Xác nhận
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVerification && handleReject(selectedVerification)}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
