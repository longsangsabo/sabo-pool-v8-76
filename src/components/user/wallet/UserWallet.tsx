import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import WalletBalance from './WalletBalance';
import WalletOverview from './WalletOverview';
import TransactionHistory from './TransactionHistory';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Gift,
  Trophy,
  Target,
  Plus,
  Minus,
  History,
  RefreshCw,
} from 'lucide-react';

interface UserWalletProps {
  className?: string;
}

interface WalletData {
  balance: number;
  total_earned: number;
  total_spent: number;
  pending_amount: number;
  frozen_amount: number;
  monthly_earnings: number;
  monthly_spending: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const UserWallet = ({ className }: UserWalletProps) => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Fetch transaction summary
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, type, created_at')
        .eq('user_id', user?.id);

      if (transError) throw transError;

      // Calculate wallet metrics
      const totalEarned = transactions
        ?.filter(t => t.type === 'earning' || t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalSpent = transactions
        ?.filter(t => t.type === 'spending' || t.type === 'withdrawal')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      // Monthly calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTransactions = transactions?.filter(t => {
        const transDate = new Date(t.created_at);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
      }) || [];

      const monthlyEarnings = monthlyTransactions
        .filter(t => t.type === 'earning' || t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlySpending = monthlyTransactions
        .filter(t => t.type === 'spending' || t.type === 'withdrawal')  
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      setWalletData({
        balance: data?.wallet_balance || 0,
        total_earned: totalEarned,
        total_spent: totalSpent,
        pending_amount: 0, // Mock data
        frozen_amount: 0, // Mock data
        monthly_earnings: monthlyEarnings,
        monthly_spending: monthlySpending,
      });

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Không thể tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('wallet_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchWalletData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      // In real app, integrate with VNPay or other payment gateway
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: parseFloat(topUpAmount),
          type: 'deposit',
          description: 'Nạp tiền vào ví',
          status: 'completed'
        });

      if (error) throw error;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: (walletData?.balance || 0) + parseFloat(topUpAmount)
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('Nạp tiền thành công!');
      setShowTopUpModal(false);
      setTopUpAmount('');
      fetchWalletData();

    } catch (error) {
      console.error('Error topping up:', error);
      toast.error('Nạp tiền thất bại');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (parseFloat(withdrawAmount) > (walletData?.balance || 0)) {
      toast.error('Số dư không đủ');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: -parseFloat(withdrawAmount),
          type: 'withdrawal',
          description: 'Rút tiền từ ví',
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Yêu cầu rút tiền đã được gửi!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData();

    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Rút tiền thất bại');
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'topup',
      title: 'Nạp tiền',
      description: 'Thêm tiền vào ví',
      icon: <Plus className="h-5 w-5" />,
      action: () => setShowTopUpModal(true),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'withdraw',
      title: 'Rút tiền',
      description: 'Rút tiền về tài khoản',
      icon: <Minus className="h-5 w-5" />,
      action: () => setShowWithdrawModal(true),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'history',
      title: 'Lịch sử',
      description: 'Xem giao dịch',
      icon: <History className="h-5 w-5" />,
      action: () => {}, // Will be handled by tabs
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'refresh',
      title: 'Làm mới',
      description: 'Cập nhật số dư',
      icon: <RefreshCw className="h-5 w-5" />,
      action: fetchWalletData,
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Overview Cards */}
      {walletData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Số dư hiện tại</p>
                  <p className="text-2xl font-bold text-green-600">
                    {walletData.balance.toLocaleString()} ₫
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng thu nhập</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {walletData.total_earned.toLocaleString()} ₫
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-red-600">
                    {walletData.total_spent.toLocaleString()} ₫
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Thu nhập tháng</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {walletData.monthly_earnings.toLocaleString()} ₫
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.action}
                className={`h-auto p-4 flex flex-col items-center gap-2 text-white ${action.color}`}
              >
                {action.icon}
                <div className="text-center">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="earnings">Thu nhập</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <WalletOverview />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Thu nhập từ giải đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Giải đấu tháng này</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {(walletData?.monthly_earnings * 0.6).toLocaleString()} ₫
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tổng thu nhập giải đấu</span>
                    <Badge className="bg-green-100 text-green-800">
                      {(walletData?.total_earned * 0.6).toLocaleString()} ₫
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Thu nhập từ thách đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Thách đấu tháng này</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {(walletData?.monthly_earnings * 0.4).toLocaleString()} ₫
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tổng thu nhập thách đấu</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {(walletData?.total_earned * 0.4).toLocaleString()} ₫
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        title="Nạp tiền vào ví"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="topup-amount">Số tiền muốn nạp</Label>
            <Input
              id="topup-amount"
              type="number"
              placeholder="0"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[50000, 100000, 500000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setTopUpAmount(amount.toString())}
              >
                {amount.toLocaleString()} ₫
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTopUp}
              disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Nạp tiền
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTopUpModal(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Rút tiền từ ví"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="withdraw-amount">Số tiền muốn rút</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Số dư khả dụng: {walletData?.balance.toLocaleString()} ₫
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="flex-1"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Rút tiền
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawModal(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserWallet;
