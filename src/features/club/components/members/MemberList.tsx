import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { useClubMembers } from '../../hooks/useClubMembers';
import { Loading } from '../common/Loading';
import { Error } from '../common/Error';
import { Empty } from '../common/Empty';

interface MemberListProps {
  clubId: string;
}

export const MemberList: React.FC<MemberListProps> = ({ clubId }) => {
  const { members, loading, error, fetchMembers } = useClubMembers();
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchMembers(clubId);
  }, [clubId, fetchMembers]);

  const filteredMembers = React.useMemo(() => {
    return members.filter(member => 
      member.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Error message={error.message} retry={() => fetchMembers(clubId)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Thành viên CLB
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredMembers.length === 0 ? (
          <Empty message="Không tìm thấy thành viên" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onViewDetails={(id) => console.log('View details', id)}
                onMessage={(id) => console.log('Message', id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
