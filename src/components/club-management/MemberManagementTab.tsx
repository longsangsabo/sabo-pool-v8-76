import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Clock,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClubMember {
  id: string;
  user_id: string;
  membership_type: string;
  membership_number: string | null;
  join_date: string;
  status: string;
  total_visits: number;
  last_visit: string | null;
  total_hours_played: number;
  membership_fee: number;
  outstanding_balance: number;
  profiles: {
    full_name: string;
    phone: string;
    verified_rank: string | null;
  };
}

const addMemberSchema = z.object({
  user_id: z.string().min(1, 'Vui lòng chọn thành viên'),
  membership_type: z.string().min(1, 'Vui lòng chọn loại thành viên'),
  membership_fee: z.coerce.number().min(0, 'Phí thành viên phải >= 0'),
});

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

interface MemberManagementTabProps {
  clubId: string;
}

const MemberManagementTab: React.FC<MemberManagementTabProps> = ({
  clubId,
}) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      membership_type: 'regular',
      membership_fee: 0,
    },
  });

  const fetchMembers = async () => {
    if (!clubId) return;

    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            phone,
            verified_rank
          )
        `
        )
        .eq('club_id', clubId)
        .order('join_date', { ascending: false });

      if (error) throw error;
      // Filter out any records with query errors and transform to proper ClubMember type
      const validMembers =
        data
          ?.filter(member => {
            if (!member.profiles || typeof member.profiles !== 'object')
              return false;
            if (
              'error' in (member.profiles as any) ||
              member.profiles === null ||
              Array.isArray(member.profiles)
            )
              return false;
            return !!(member.profiles as any)?.full_name;
          })
          .map(member => ({
            ...member,
            profiles: {
              full_name: (member.profiles as any)?.full_name || '',
              phone: (member.profiles as any)?.phone || '',
              verified_rank: (member.profiles as any)?.verified_rank || '',
            },
          })) || [];
      setMembers(validMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách thành viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Get users who are not already members of this club
      const { data: existingMembers } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, verified_rank')
        .not('user_id', 'in', `(${existingUserIds.join(',')})`);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchAvailableUsers();
    }
  }, [isAddDialogOpen, clubId]);

  const handleAddMember = async (values: z.infer<typeof addMemberSchema>) => {
    try {
      const membershipNumber = `CLB${clubId.slice(-6).toUpperCase()}${Date.now().toString().slice(-4)}`;

      const { error } = await supabase.from('club_members').insert({
        club_id: clubId,
        user_id: values.user_id,
        membership_type: values.membership_type,
        membership_number: membershipNumber,
        membership_fee: values.membership_fee,
        status: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã thêm thành viên mới',
      });

      setIsAddDialogOpen(false);
      form.reset();
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm thành viên',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMemberStatus = async (
    memberId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái thành viên',
      });

      fetchMembers();
    } catch (error) {
      console.error('Error updating member status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const filteredMembers = members.filter(
    member =>
      member.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.membership_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.profiles?.phone?.includes(searchTerm)
  );

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    thisMonth: members.filter(
      m => new Date(m.join_date).getMonth() === new Date().getMonth()
    ).length,
    totalRevenue: members.reduce((sum, m) => sum + m.membership_fee, 0),
  };

  const getStatusBadge = (status: string) => {
    const colorClass =
      statusColors[status as keyof typeof statusColors] ||
      'bg-gray-100 text-gray-800';
    return (
      <Badge variant='secondary' className={colorClass}>
        {status === 'active' && 'Hoạt động'}
        {status === 'inactive' && 'Không hoạt động'}
        {status === 'suspended' && 'Tạm ngưng'}
        {status === 'expired' && 'Hết hạn'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='pt-6'>
                <div className='animate-pulse'>
                  <div className='h-8 bg-gray-200 rounded mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Users className='w-8 h-8 mx-auto mb-2 text-blue-500' />
              <p className='text-2xl font-bold'>{stats.total}</p>
              <p className='text-sm text-muted-foreground'>Tổng thành viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <UserCheck className='w-8 h-8 mx-auto mb-2 text-green-500' />
              <p className='text-2xl font-bold'>{stats.active}</p>
              <p className='text-sm text-muted-foreground'>Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Calendar className='w-8 h-8 mx-auto mb-2 text-purple-500' />
              <p className='text-2xl font-bold'>{stats.thisMonth}</p>
              <p className='text-sm text-muted-foreground'>
                Tham gia tháng này
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='w-8 h-8 mx-auto mb-2 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold'>
                ₫
              </div>
              <p className='text-2xl font-bold'>
                {stats.totalRevenue.toLocaleString('vi-VN')}
              </p>
              <p className='text-sm text-muted-foreground'>
                Doanh thu thành viên
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add Member */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <CardTitle>Quản lý thành viên</CardTitle>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Tìm kiếm thành viên...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 w-full sm:w-64'
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm thành viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm thành viên mới</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleAddMember)}
                      className='space-y-4'
                    >
                      <FormField
                        control={form.control}
                        name='user_id'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chọn người dùng</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Chọn người dùng' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableUsers.map(user => (
                                  <SelectItem
                                    key={user.user_id}
                                    value={user.user_id}
                                  >
                                    {user.full_name} ({user.phone})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='membership_type'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại thành viên</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Chọn loại thành viên' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='regular'>Thường</SelectItem>
                                <SelectItem value='vip'>VIP</SelectItem>
                                <SelectItem value='premium'>Premium</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='membership_fee'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phí thành viên (VND)</FormLabel>
                            <FormControl>
                              <Input type='number' placeholder='0' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='flex justify-end space-x-2'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          Hủy
                        </Button>
                        <Button type='submit'>Thêm thành viên</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className='text-center py-8'>
              <Users className='w-12 h-12 mx-auto mb-4 text-muted' />
              <p className='text-muted-foreground'>
                {searchTerm
                  ? 'Không tìm thấy thành viên phù hợp'
                  : 'Chưa có thành viên nào'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Mã thành viên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Hạng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead>Lần cuối</TableHead>
                  <TableHead>Phí</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {member.profiles?.full_name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {member.profiles?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {member.membership_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {member.membership_type === 'regular' && 'Thường'}
                        {member.membership_type === 'vip' && 'VIP'}
                        {member.membership_type === 'premium' && 'Premium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.profiles?.verified_rank ? (
                        <Badge variant='default'>
                          {member.profiles.verified_rank}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      {new Date(member.join_date).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      {member.last_visit
                        ? new Date(member.last_visit).toLocaleDateString(
                            'vi-VN'
                          )
                        : 'Chưa có'}
                    </TableCell>
                    <TableCell>
                      {member.membership_fee.toLocaleString('vi-VN')} ₫
                    </TableCell>
                    <TableCell>
                      <div className='flex space-x-1'>
                        {member.status === 'active' ? (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleUpdateMemberStatus(member.id, 'suspended')
                            }
                          >
                            <UserX className='w-4 h-4' />
                          </Button>
                        ) : (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleUpdateMemberStatus(member.id, 'active')
                            }
                          >
                            <UserCheck className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberManagementTab;
