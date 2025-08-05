import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  History,
  Crown,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  ArrowUpRight,
  Settings,
} from 'lucide-react';
import { WalletOverview } from '@/components/wallet/WalletOverview';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { MembershipUpgradeTab } from '@/components/wallet/MembershipUpgradeTab';
import { PaymentModal } from '@/components/wallet/PaymentModal';
import { TransferModal } from '@/components/wallet/TransferModal';

interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  pendingAmount: number;
  currentPlan: string;
  transactions: any[];
}

const WalletPage: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    type: 'deposit' as 'deposit' | 'withdraw' | 'membership',
    amount: 0,
  });

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchWalletData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setWalletData({
          balance: 1250000,
          totalEarned: 3500000,
          totalSpent: 2250000,
          pendingAmount: 50000,
          currentPlan: 'premium',
          transactions: [],
        });
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleDeposit = () => {
    setPaymentConfig({ type: 'deposit', amount: 0 });
    setShowPaymentModal(true);
  };

  const handleWithdraw = () => {
    setPaymentConfig({ type: 'withdraw', amount: walletData?.balance || 0 });
    setShowPaymentModal(true);
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const handleMembershipUpgrade = (planId: string) => {
    const planPrices = {
      premium: 99000,
      pro: 199000,
    };
    setPaymentConfig({
      type: 'membership',
      amount: planPrices[planId as keyof typeof planPrices] || 0,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    // ...removed console.log('Payment successful:', transactionId)
    // Refresh wallet data
    setShowPaymentModal(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Show error notification
  };

  const handleTransferSuccess = (
    recipientId: string,
    amount: number,
    message: string
  ) => {
    // ...removed console.log('Transfer successful:', { recipientId, amount, message })
    // Refresh wallet data
    setShowTransferModal(false);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Không thể tải dữ liệu ví
          </h2>
          <p className='text-gray-600 mb-4'>Vui lòng thử lại sau.</p>
          <Button onClick={() => window.location.reload()}>Tải lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Ví điện tử</h1>
              <p className='text-gray-600 mt-1'>
                Quản lý tài khoản và giao dịch của bạn
              </p>
            </div>
            <Button variant='outline'>
              <Settings className='h-4 w-4 mr-2' />
              Cài đặt
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <Wallet className='h-4 w-4' />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value='history' className='flex items-center gap-2'>
              <History className='h-4 w-4' />
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value='membership' className='flex items-center gap-2'>
              <Crown className='h-4 w-4' />
              Thành viên
            </TabsTrigger>
            <TabsTrigger value='analytics' className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Thống kê
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <WalletOverview
              balance={walletData.balance}
              totalEarned={walletData.totalEarned}
              totalSpent={walletData.totalSpent}
              pendingAmount={walletData.pendingAmount}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onTransfer={handleTransfer}
            />
          </TabsContent>

          <TabsContent value='history' className='space-y-6'>
            <TransactionHistory userId='current-user' />
          </TabsContent>

          <TabsContent value='membership' className='space-y-6'>
            <MembershipUpgradeTab
              currentPlan={walletData.currentPlan}
              onUpgrade={handleMembershipUpgrade}
            />
          </TabsContent>

          <TabsContent value='analytics' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* Monthly Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Tháng này</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Thu nhập</span>
                      <div className='flex items-center gap-1 text-green-600'>
                        <TrendingUp className='h-4 w-4' />
                        <span className='font-medium'>+450,000 VNĐ</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Chi tiêu</span>
                      <div className='flex items-center gap-1 text-red-600'>
                        <TrendingDown className='h-4 w-4' />
                        <span className='font-medium'>-280,000 VNĐ</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Cân bằng</span>
                      <span className='font-medium text-blue-600'>
                        +170,000 VNĐ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Win Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Tỷ lệ thắng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600 mb-2'>
                      68%
                    </div>
                    <div className='text-sm text-gray-600'>
                      24/35 trận thắng
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2 mt-3'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '68%' }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Thu nhập TB/trận</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-blue-600 mb-2'>
                      18,750 VNĐ
                    </div>
                    <div className='text-sm text-gray-600'>Từ 35 trận đấu</div>
                    <div className='flex items-center justify-center gap-1 text-green-600 mt-2'>
                      <TrendingUp className='h-4 w-4' />
                      <span className='text-sm'>+12% so với tháng trước</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Opponents */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Đối thủ hàng đầu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>player2</span>
                      <Badge
                        variant='outline'
                        className='bg-green-100 text-green-800'
                      >
                        +120,000 VNĐ
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>pool_master</span>
                      <Badge
                        variant='outline'
                        className='bg-red-100 text-red-800'
                      >
                        -80,000 VNĐ
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>champion</span>
                      <Badge
                        variant='outline'
                        className='bg-green-100 text-green-800'
                      >
                        +95,000 VNĐ
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Card>
              <CardHeader>
                <CardTitle>Biểu đồ thu nhập</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-gray-500'>
                  <div className='text-center'>
                    <TrendingUp className='h-12 w-12 mx-auto mb-2 opacity-50' />
                    <p>Biểu đồ sẽ được hiển thị ở đây</p>
                    <p className='text-sm'>Tích hợp với thư viện biểu đồ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={paymentConfig.amount}
        type={paymentConfig.type}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        currentBalance={walletData.balance}
        onTransfer={handleTransferSuccess}
      />
    </div>
  );
};

export default WalletPage;
