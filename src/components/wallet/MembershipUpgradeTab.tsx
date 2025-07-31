import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Star,
  Check,
  X,
  Zap,
  Shield,
  Gift,
  Users,
  Trophy,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: 'month' | 'year';
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  popular?: boolean;
  recommended?: boolean;
}

interface MembershipUpgradeTabProps {
  currentPlan: string;
  onUpgrade: (planId: string) => void;
}

export const MembershipUpgradeTab: React.FC<MembershipUpgradeTabProps> = ({
  currentPlan,
  onUpgrade,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'month' | 'year'>(
    'month'
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: MembershipPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      duration: 'month',
      features: [
        { name: 'Thách đấu cơ bản (5 lần/tháng)', included: true },
        { name: 'Tham gia giải đấu miễn phí', included: true },
        { name: 'Xem bảng xếp hạng', included: true },
        { name: 'Chat với bạn bè', included: true },
        { name: 'Thách đấu không giới hạn', included: false },
        { name: 'Ưu tiên đặt bàn', included: false },
        { name: 'Tham gia giải đấu VIP', included: false },
        { name: 'Hỗ trợ ưu tiên', included: false },
        { name: 'Quà tặng hàng tháng', included: false },
        { name: 'Phân tích trận đấu nâng cao', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: selectedDuration === 'month' ? 99000 : 990000,
      originalPrice: selectedDuration === 'month' ? 129000 : 1290000,
      duration: selectedDuration,
      popular: true,
      features: [
        { name: 'Thách đấu không giới hạn', included: true, highlight: true },
        { name: 'Ưu tiên đặt bàn', included: true, highlight: true },
        { name: 'Tham gia giải đấu VIP', included: true },
        { name: 'Hỗ trợ ưu tiên', included: true },
        { name: 'Quà tặng hàng tháng', included: true },
        { name: 'Phân tích trận đấu nâng cao', included: true },
        { name: 'Thách đấu cơ bản (5 lần/tháng)', included: true },
        { name: 'Tham gia giải đấu miễn phí', included: true },
        { name: 'Xem bảng xếp hạng', included: true },
        { name: 'Chat với bạn bè', included: true },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: selectedDuration === 'month' ? 199000 : 1990000,
      originalPrice: selectedDuration === 'month' ? 259000 : 2590000,
      duration: selectedDuration,
      recommended: true,
      features: [
        { name: 'Tất cả tính năng Premium', included: true, highlight: true },
        { name: 'Giải đấu riêng tư', included: true, highlight: true },
        { name: 'Huấn luyện viên cá nhân', included: true, highlight: true },
        { name: 'Phân tích AI nâng cao', included: true },
        { name: 'Quà tặng hàng tuần', included: true },
        { name: 'Hỗ trợ 24/7', included: true },
        { name: 'Thách đấu không giới hạn', included: true },
        { name: 'Ưu tiên đặt bàn', included: true },
        { name: 'Tham gia giải đấu VIP', included: true },
        { name: 'Hỗ trợ ưu tiên', included: true },
      ],
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const calculateSavings = (plan: MembershipPlan) => {
    if (!plan.originalPrice) return 0;
    return plan.originalPrice - plan.price;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Users className='h-6 w-6' />;
      case 'premium':
        return <Star className='h-6 w-6' />;
      case 'pro':
        return <Crown className='h-6 w-6' />;
      default:
        return <Users className='h-6 w-6' />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-gray-200';
      case 'premium':
        return 'border-blue-500';
      case 'pro':
        return 'border-purple-500';
      default:
        return 'border-gray-200';
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'bg-gray-50';
      case 'premium':
        return 'bg-gradient-to-br from-blue-50 to-blue-100';
      case 'pro':
        return 'bg-gradient-to-br from-purple-50 to-purple-100';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5' />
            Gói hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border'>
            <div className='flex items-center gap-3'>
              {getPlanIcon(currentPlan)}
              <div>
                <div className='font-medium text-lg'>
                  {plans.find(p => p.id === currentPlan)?.name || 'Free'}
                </div>
                <div className='text-sm text-gray-600'>
                  Gói {currentPlan === 'free' ? 'miễn phí' : 'trả phí'}
                </div>
              </div>
            </div>
            <Badge variant='outline' className='bg-green-100 text-green-800'>
              Đang sử dụng
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Duration Selector */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center gap-4'>
            <span className='text-sm font-medium text-gray-700'>
              Chọn thời hạn:
            </span>
            <div className='flex bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() => setSelectedDuration('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDuration === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hàng tháng
              </button>
              <button
                onClick={() => setSelectedDuration('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDuration === 'year'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hàng năm
                <Badge className='ml-2 bg-green-100 text-green-800 text-xs'>
                  Tiết kiệm 20%
                </Badge>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {plans.map(plan => (
          <Card
            key={plan.id}
            className={`relative ${getPlanColor(plan.id)} ${
              plan.popular ? 'ring-2 ring-blue-500' : ''
            } ${plan.recommended ? 'ring-2 ring-purple-500' : ''}`}
          >
            {plan.popular && (
              <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                <Badge className='bg-blue-500 text-white'>
                  <Star className='h-3 w-3 mr-1' />
                  Phổ biến
                </Badge>
              </div>
            )}

            {plan.recommended && (
              <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                <Badge className='bg-purple-500 text-white'>
                  <Sparkles className='h-3 w-3 mr-1' />
                  Khuyến nghị
                </Badge>
              </div>
            )}

            <CardHeader className={`text-center ${getPlanGradient(plan.id)}`}>
              <div className='flex items-center justify-center gap-2 mb-2'>
                {getPlanIcon(plan.id)}
                <CardTitle className='text-xl'>{plan.name}</CardTitle>
              </div>

              <div className='space-y-2'>
                {plan.price === 0 ? (
                  <div className='text-2xl font-bold text-gray-900'>
                    Miễn phí
                  </div>
                ) : (
                  <div>
                    <div className='text-2xl font-bold text-gray-900'>
                      {formatCurrency(plan.price)}
                    </div>
                    {plan.originalPrice && (
                      <div className='flex items-center justify-center gap-2'>
                        <span className='text-sm text-gray-500 line-through'>
                          {formatCurrency(plan.originalPrice)}
                        </span>
                        <Badge className='bg-green-100 text-green-800 text-xs'>
                          Tiết kiệm {formatCurrency(calculateSavings(plan))}
                        </Badge>
                      </div>
                    )}
                    <div className='text-sm text-gray-600'>
                      / {plan.duration === 'month' ? 'tháng' : 'năm'}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className='pt-6'>
              <div className='space-y-3 mb-6'>
                {plan.features.map((feature, index) => (
                  <div key={index} className='flex items-start gap-3'>
                    <div
                      className={`p-1 rounded-full ${
                        feature.included
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {feature.included ? (
                        <Check className='h-3 w-3' />
                      ) : (
                        <X className='h-3 w-3' />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.included
                          ? feature.highlight
                            ? 'font-medium text-gray-900'
                            : 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => onUpgrade(plan.id)}
                disabled={plan.id === currentPlan}
                className={`w-full ${
                  plan.id === currentPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.id === 'premium'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : plan.id === 'pro'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {plan.id === currentPlan ? 'Đang sử dụng' : 'Nâng cấp ngay'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Gift className='h-5 w-5' />
            Lợi ích khi nâng cấp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Target className='h-6 w-6 text-blue-600' />
              </div>
              <h3 className='font-medium mb-2'>Thách đấu không giới hạn</h3>
              <p className='text-sm text-gray-600'>
                Thách đấu bất cứ lúc nào mà không bị giới hạn số lần
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Trophy className='h-6 w-6 text-green-600' />
              </div>
              <h3 className='font-medium mb-2'>Giải đấu VIP</h3>
              <p className='text-sm text-gray-600'>
                Tham gia các giải đấu đặc biệt với phần thưởng hấp dẫn
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Shield className='h-6 w-6 text-purple-600' />
              </div>
              <h3 className='font-medium mb-2'>Hỗ trợ ưu tiên</h3>
              <p className='text-sm text-gray-600'>
                Được hỗ trợ nhanh chóng và ưu tiên khi gặp vấn đề
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Zap className='h-6 w-6 text-yellow-600' />
              </div>
              <h3 className='font-medium mb-2'>Tính năng nâng cao</h3>
              <p className='text-sm text-gray-600'>
                Truy cập các tính năng phân tích và thống kê chi tiết
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
