import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { List, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { usePayment } from '@/hooks/usePayment';
import { UserProfile } from '@/types/common';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  type: 'standard' | 'premium' | 'vip';
}

const plans: MembershipPlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Nâng cấp trải nghiệm của bạn với nhiều quyền lợi hơn.',
    price: 50000,
    features: [
      'Truy cập đầy đủ tính năng cơ bản',
      'Nhận thông báo ưu đãi',
      'Hỗ trợ khách hàng ưu tiên',
    ],
    type: 'standard',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Trải nghiệm tốt nhất với quyền lợi cao cấp.',
    price: 100000,
    features: [
      'Tất cả quyền lợi Standard',
      'Ưu đãi độc quyền',
      'Tham gia sự kiện đặc biệt',
      'Hỗ trợ 24/7',
    ],
    type: 'premium',
  },
];

const PaymentMembershipPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getProfile } = useProfile();
  const { depositFunds } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    if (!selectedPlan || !profile) return;

    setIsProcessing(true);
    try {
      const paymentData = {
        amount: selectedPlan.price,
        description: `Membership upgrade to ${selectedPlan.name}`,
        returnUrl: window.location.origin + '/payment-result',
        userId: profile.user_id || profile.id,
      };

      await depositFunds(paymentData.amount, paymentData.description);

      toast({
        title: 'Thanh toán thành công',
        description: `Đã nâng cấp tài khoản lên ${selectedPlan.name}`,
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

  <div className='container py-8'>
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='text-2xl font-bold'>Nâng Cấp Tài Khoản</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Membership Plan Selection */}
        <div>
          <Label htmlFor='plan'>Chọn Gói</Label>
          <Select
            onValueChange={value => {
              const plan = plans.find(p => p.id === value);
              setSelectedPlan(plan || null);
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Chọn gói thành viên' />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price.toLocaleString()} VNĐ
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Plan Details */}
        {selectedPlan && (
          <div className='border rounded-md p-4'>
            <h3 className='text-lg font-semibold'>{selectedPlan.name}</h3>
            <p className='text-gray-500'>{selectedPlan.description}</p>
            <ul className='list-none space-y-2 mt-2'>
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  {feature}
                </li>
              ))}
            </ul>
            <div className='mt-4 font-bold text-xl'>
              Giá: {selectedPlan.price.toLocaleString()} VNĐ
            </div>
          </div>
        )}

        {/* Payment Button */}
        <Button
          className='w-full'
          onClick={handlePayment}
          disabled={!selectedPlan || isProcessing}
        >
          {isProcessing ? (
            <>
              Đang Xử Lý...
              <Loader2 className='ml-2 h-4 w-4 animate-spin' />
            </>
          ) : (
            'Thanh Toán'
          )}
        </Button>
      </CardContent>
    </Card>
  </div>;
};

export default PaymentMembershipPage;
