import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Download,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  membershipType: string;
  lastVisit?: string;
  avatar?: string;
}

interface MemberListProps {
  clubId: string;
}

export const MemberList: React.FC<MemberListProps> = ({ clubId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // TODO: Fetch real data from API
  const members: Member[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      email: 'a@example.com',
      joinDate: '2024-01-15',
      status: 'active',
      membershipType: 'VIP',
      lastVisit: '2024-08-03',
      avatar: null,
    },
    {
      id: '2', 
      name: 'Trần Thị B',
      phone: '0987654321',
      email: 'b@example.com',
      joinDate: '2024-02-20',
      status: 'active',
      membershipType: 'Standard',
      lastVisit: '2024-08-02',
      avatar: null,
    },
    {
      id: '3',
      name: 'Lê Văn C',
      phone: '0555666777',
      joinDate: '2024-03-10',
      status: 'inactive',
      membershipType: 'Basic',
      lastVisit: '2024-07-15',
      avatar: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'suspended': return 'Bị đình chỉ';
      default: return 'Không xác định';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quản lý thành viên</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm thành viên
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="suspended">Bị đình chỉ</option>
          </select>
        </div>

        {/* Members Grid */}
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || undefined} />
                    <AvatarFallback>
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      <Badge className={`${getStatusColor(member.status)} text-white`}>
                        {getStatusText(member.status)}
                      </Badge>
                      <Badge variant="outline">
                        {member.membershipType}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Tham gia: {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    
                    {member.lastVisit && (
                      <div className="text-xs text-muted-foreground">
                        Lần cuối: {new Date(member.lastVisit).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Không tìm thấy thành viên nào phù hợp
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
