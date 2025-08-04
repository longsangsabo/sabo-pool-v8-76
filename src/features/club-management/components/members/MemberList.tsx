import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { MemberFilters } from './MemberFilters';
import { useClubMembers } from '../../hooks/useClubMembers';

interface MemberListProps {
  clubId: string;
}

export const MemberList: React.FC<MemberListProps> = ({ clubId }) => {
  const { members, loading, error } = useClubMembers(clubId);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    return members.filter(member => 
      member.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Danh sách thành viên ({members.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành viên..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onViewDetails={(id) => window.open(`/players/${id}`, '_blank')}
              onMessage={(id) => window.open(`/messages/new?userId=${id}`, '_blank')}
            />
          ))}
        </div>
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy thành viên nào
          </div>
        )}
      </CardContent>
    </Card>
  );
};
