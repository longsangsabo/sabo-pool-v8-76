import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserCheck } from 'lucide-react';
import { ClubMember } from '../../../types/member.types';

interface MemberCardProps {
  member: ClubMember;
  onViewDetails?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onViewDetails,
  onMessage
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.profile?.avatar_url} />
            <AvatarFallback>
              {getInitials(member.profile?.full_name || '')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">
                {member.profile?.full_name}
              </p>
              <Badge variant={member.profile?.verified_rank ? "default" : "secondary"}>
                {member.profile?.verified_rank || 'Chưa xác thực'}
              </Badge>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              <p>Thành viên từ: {new Date(member.joined_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          {onMessage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMessage(member.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Nhắn tin
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(member.id)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Chi tiết
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
