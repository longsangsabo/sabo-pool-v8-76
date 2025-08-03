import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { List, UserPlus, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useClubs } from '@/hooks/useClubs';
import { usePayment } from '@/hooks/usePayment';
import { Club, UserProfile } from '@/types/common';

const PaymentClubMembershipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { getProfile } = useProfile();
  const { clubs } = useClubs();
  const { depositFunds } = usePayment();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: number;
    type: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin cá nhân.',
          variant: 'destructive',
        });
      }
    };

    fetchProfile();
  }, [getProfile, toast]);

  const handlePayment = async () => {
    if (!selectedPlan || !profile || !selectedClub) return;

    setIsProcessing(true);
    try {
      const paymentData = {
        amount: selectedPlan.price,
        description: `Membership payment for ${selectedClub.name} - ${selectedPlan.name}`,
        returnUrl: window.location.origin + '/payment-result',
        userId: profile.user_id || profile.id,
      };

      await depositFunds(paymentData.amount, paymentData.description);

      toast({
        title: 'Thanh toán thành công',
        description: `Đã đăng ký thành viên ${selectedClub.name}`,
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Lỗi thanh toán',
        description: 'Có lỗi xảy ra khi xử lý thanh toán.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12'>
      <div className='relative py-3 sm:max-w-xl sm:mx-auto'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl'></div>
        <div className='relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20'>
          <div className='max-w-md mx-auto'>
            <div>
              <h1 className='text-2xl font-semibold'>Đăng ký thành viên CLB</h1>
            </div>
            <div className='divide-y divide-gray-200'>
              <div className='py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7'>
                <div className='space-y-2'>
                  <Label htmlFor='club'>Chọn Câu Lạc Bộ</Label>
                  <Select
                    onValueChange={value => {
                      const club = clubs?.find(club => club.id === value);
                      setSelectedClub(
                        club
                          ? {
                              ...club,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            }
                          : null
                      );
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn CLB' />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs?.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='plan'>Chọn Gói Hội Viên</Label>
                  <Select
                    onValueChange={value => {
                      const [name, price, type] = value.split('||');
                      setSelectedPlan({
                        name,
                        price: parseFloat(price),
                        type,
                      });
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn gói hội viên' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Basic||100000||basic'>
                        Gói Cơ Bản - 100.000 VND
                      </SelectItem>
                      <SelectItem value='Premium||200000||premium'>
                        Gói Cao Cấp - 200.000 VND
                      </SelectItem>
                      <SelectItem value='VIP||500000||vip'>
                        Gói VIP - 500.000 VND
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Thông tin thanh toán</Label>
                  <Card>
                    <CardHeader>
                      <CardTitle>Chi tiết</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-1'>
                        <p>
                          Câu lạc bộ:{' '}
                          <span className='font-semibold'>
                            {selectedClub?.name || 'Chưa chọn'}
                          </span>
                        </p>
                        <p>
                          Gói hội viên:{' '}
                          <span className='font-semibold'>
                            {selectedPlan?.name || 'Chưa chọn'}
                          </span>
                        </p>
                        <p>
                          Tổng tiền:{' '}
                          <span className='font-semibold'>
                            {selectedPlan?.price.toLocaleString('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }) || '0 VND'}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className='pt-4 flex items-center space-x-4'>
                <Button
                  variant='outline'
                  className='ml-auto w-32'
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
                <Button
                  className='bg-gradient-to-r from-blue-400 to-blue-600 text-white w-32'
                  onClick={handlePayment}
                  disabled={isProcessing || !selectedPlan || !selectedClub}
                >
                  {isProcessing ? (
                    <>
                      Đang xử lý...
                      <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                    </>
                  ) : (
                    'Thanh toán'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentClubMembershipPage;
