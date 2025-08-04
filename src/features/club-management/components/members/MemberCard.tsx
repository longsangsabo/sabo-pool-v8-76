import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserCheck } from 'lucide-react';
import { ClubMember } from '../../types/club.types';

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
            <AvatarImage src={member.profiles?.avatar_url} />
            <AvatarFallback>
              {getInitials(member.profiles.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">
                {member.profiles.full_name}
              </p>
              <Badge variant={member.profiles.verified_rank ? "default" : "secondary"}>
                {member.profiles.verified_rank || 'Chưa xác thực'}
              </Badge>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              <p>Thành viên từ: {new Date(member.join_date).toLocaleDateString('vi-VN')}</p>
              {member.last_visit && (
                <p>Lần cuối: {new Date(member.last_visit).toLocaleDateString('vi-VN')}</p>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              {onViewDetails && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(member.id)}
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Chi tiết
                </Button>
              )}
              {onMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMessage(member.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Nhắn tin
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
