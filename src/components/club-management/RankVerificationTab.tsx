import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RankVerification {
  id: string;
  user_id: string;
  current_rank: string | null;
  requested_rank: string;
  status: string;
  application_date: string;
  test_scheduled_date: string | null;
  test_score: number | null;
  instructor_feedback: string | null;
  profiles: {
    full_name: string;
    phone: string;
  };
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  testing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: Clock,
  scheduled: Calendar,
  testing: Trophy,
  completed: CheckCircle,
  approved: Star,
  rejected: XCircle,
  cancelled: XCircle,
};

const updateVerificationSchema = z.object({
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
  test_score: z.coerce.number().min(0).max(100).optional(),
  practical_score: z.coerce.number().min(0).max(100).optional(),
  theory_score: z.coerce.number().min(0).max(100).optional(),
  instructor_feedback: z.string().optional(),
  club_notes: z.string().optional(),
});

interface RankVerificationTabProps {
  clubId: string;
}

const RankVerificationTab: React.FC<RankVerificationTabProps> = ({
  clubId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<RankVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] =
    useState<RankVerification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof updateVerificationSchema>>({
    resolver: zodResolver(updateVerificationSchema),
    defaultValues: {
      status: '',
      instructor_feedback: '',
      club_notes: '',
    },
  });

  const fetchVerifications = async () => {
    if (!clubId) return;

    try {
      const { data, error } = await supabase
        .from('rank_verifications')
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            phone
          )
        `
        )
        .eq('club_id', clubId)
        .order('application_date', { ascending: false });

      if (error) throw error;
      // Filter out any records with query errors and transform to proper RankVerification type
      const validVerifications =
        data
          ?.filter(verification => {
            if (
              !verification.profiles ||
              typeof verification.profiles !== 'object'
            )
              return false;
            if (
              'error' in (verification.profiles as any) ||
              verification.profiles === null ||
              Array.isArray(verification.profiles)
            )
              return false;
            return !!(verification.profiles as any)?.full_name;
          })
          .map(verification => ({
            ...verification,
            profiles: {
              full_name: (verification.profiles as any)?.full_name || '',
              phone: (verification.profiles as any)?.phone || '',
            },
          })) || [];
      setVerifications(validVerifications);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu xác thực',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [clubId]);

  const handleUpdateVerification = async (
    values: z.infer<typeof updateVerificationSchema>
  ) => {
    if (!selectedVerification) return;

    try {
      const updateData: any = {
        status: values.status,
        instructor_feedback: values.instructor_feedback,
        club_notes: values.club_notes,
      };

      if (values.test_score !== undefined) {
        updateData.test_score = values.test_score;
      }
      if (values.practical_score !== undefined) {
        updateData.practical_score = values.practical_score;
      }
      if (values.theory_score !== undefined) {
        updateData.theory_score = values.theory_score;
      }

      if (values.status === 'approved') {
        updateData.verification_date = new Date().toISOString();
        updateData.verified_by = user?.id;
      }

      const { error } = await supabase
        .from('rank_verifications')
        .update(updateData)
        .eq('id', selectedVerification.id);

      if (error) throw error;

      // Update user's verified rank if approved
      if (values.status === 'approved') {
        await supabase
          .from('profiles')
          .update({ verified_rank: selectedVerification.requested_rank })
          .eq('user_id', selectedVerification.user_id);
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái xác thực hạng',
      });

      setIsDialogOpen(false);
      form.reset();
      fetchVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (verification: RankVerification) => {
    setSelectedVerification(verification);
    form.reset({
      status: verification.status,
      test_score: verification.test_score || undefined,
      instructor_feedback: verification.instructor_feedback || '',
      club_notes: '',
    });
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return <Icon className='w-4 h-4' />;
  };

  const getStatusBadge = (status: string) => {
    const colorClass =
      statusColors[status as keyof typeof statusColors] ||
      'bg-gray-100 text-gray-800';
    return (
      <Badge variant='secondary' className={colorClass}>
        {getStatusIcon(status)}
        <span className='ml-1'>
          {status === 'pending' && 'Chờ xử lý'}
          {status === 'scheduled' && 'Đã lên lịch'}
          {status === 'testing' && 'Đang test'}
          {status === 'completed' && 'Hoàn thành'}
          {status === 'approved' && 'Đã duyệt'}
          {status === 'rejected' && 'Từ chối'}
          {status === 'cancelled' && 'Đã hủy'}
        </span>
      </Badge>
    );
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    thisMonth: verifications.filter(
      v => new Date(v.application_date).getMonth() === new Date().getMonth()
    ).length,
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
              <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
              <p className='text-2xl font-bold'>{stats.total}</p>
              <p className='text-sm text-muted-foreground'>Tổng yêu cầu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Clock className='w-8 h-8 mx-auto mb-2 text-blue-500' />
              <p className='text-2xl font-bold'>{stats.pending}</p>
              <p className='text-sm text-muted-foreground'>Chờ xử lý</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <CheckCircle className='w-8 h-8 mx-auto mb-2 text-green-500' />
              <p className='text-2xl font-bold'>{stats.approved}</p>
              <p className='text-sm text-muted-foreground'>Đã duyệt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Calendar className='w-8 h-8 mx-auto mb-2 text-purple-500' />
              <p className='text-2xl font-bold'>{stats.thisMonth}</p>
              <p className='text-sm text-muted-foreground'>Tháng này</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu xác thực hạng</CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className='text-center py-8'>
              <Trophy className='w-12 h-12 mx-auto mb-4 text-muted' />
              <p className='text-muted-foreground'>
                Chưa có yêu cầu xác thực hạng nào
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người chơi</TableHead>
                  <TableHead>Hạng hiện tại</TableHead>
                  <TableHead>Hạng yêu cầu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Điểm test</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map(verification => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {verification.profiles?.full_name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {verification.profiles?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {verification.current_rank || 'Chưa có'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='default'>
                        {verification.requested_rank}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(verification.status)}</TableCell>
                    <TableCell>
                      {new Date(
                        verification.application_date
                      ).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      {verification.test_score ? (
                        <Badge
                          variant={
                            verification.test_score >= 70
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {verification.test_score}/100
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={
                          isDialogOpen &&
                          selectedVerification?.id === verification.id
                        }
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleOpenDialog(verification)}
                          >
                            <FileText className='w-4 h-4 mr-1' />
                            Xử lý
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-2xl'>
                          <DialogHeader>
                            <DialogTitle>
                              Xử lý yêu cầu xác thực hạng
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit(
                                handleUpdateVerification
                              )}
                              className='space-y-4'
                            >
                              <div className='grid grid-cols-2 gap-4'>
                                <FormField
                                  control={form.control}
                                  name='status'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Trạng thái</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder='Chọn trạng thái' />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value='pending'>
                                            Chờ xử lý
                                          </SelectItem>
                                          <SelectItem value='scheduled'>
                                            Đã lên lịch
                                          </SelectItem>
                                          <SelectItem value='testing'>
                                            Đang test
                                          </SelectItem>
                                          <SelectItem value='completed'>
                                            Hoàn thành
                                          </SelectItem>
                                          <SelectItem value='approved'>
                                            Đã duyệt
                                          </SelectItem>
                                          <SelectItem value='rejected'>
                                            Từ chối
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name='test_score'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Điểm tổng kết</FormLabel>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          placeholder='0-100'
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='grid grid-cols-2 gap-4'>
                                <FormField
                                  control={form.control}
                                  name='practical_score'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Điểm thực hành</FormLabel>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          placeholder='0-100'
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name='theory_score'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Điểm lý thuyết</FormLabel>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          placeholder='0-100'
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name='instructor_feedback'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Nhận xét của giảng viên
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder='Nhận xét về kỹ năng và khả năng của học viên...'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name='club_notes'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ghi chú của club</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder='Ghi chú nội bộ của club...'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className='flex justify-end space-x-2'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  onClick={() => setIsDialogOpen(false)}
                                >
                                  Hủy
                                </Button>
                                <Button type='submit'>Cập nhật</Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
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

export default RankVerificationTab;
