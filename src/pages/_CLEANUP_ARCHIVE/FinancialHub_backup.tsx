import React, { Suspense, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, Wallet, CreditCard, Crown, History, DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Target, Gift, Settings } from 'lucide-react';
import { useFinancials } from '@/hooks/useFinancials';
import { useChallengeBetting } from '@/hooks/useChallengeBetting';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Lazy load financial components
const PaymentPage = React.lazy(() => import('@/pages/PaymentPage'));
const MembershipPage = React.lazy(() => import('@/pages/MembershipPage'));

// Loading component
const TabLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Đang tải...</span>
  </div>
);

// Enhanced Financial Overview component with real wallet integration
const EnhancedFinancialOverview = () => {
  const { user } = useAuth();
  const { wallet, transactions, loading } = useFinancials();
  const { getBettingStats } = useChallengeBetting();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    balance: 0,
    totalEarnings: 0,
    totalSpent: 0,
    pendingEarnings: 0,
    monthlySpending: 0,
    membershipExpiry: null
  });

  useEffect(() => {
    if (wallet) {
      setStats({
        balance: wallet.balance || 0,
        totalEarnings: wallet.total_earnings || 0,
        totalSpent: wallet.total_spent || 0,
        pendingEarnings: wallet.pending_earnings || 0,
        monthlySpending: wallet.monthly_spending || 0,
        membershipExpiry: wallet.membership_expiry
      });
    }
  }, [wallet]);

  const statCards = [
    { title: 'Số dư hiện tại', value: `${stats.balance.toLocaleString()}đ`, icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-50' },
    { title: 'Tổng thu nhập', value: `${stats.totalEarnings.toLocaleString()}đ`, icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { title: 'Pending earnings', value: `${stats.pendingEarnings.toLocaleString()}đ`, icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { title: 'Chi tiêu tháng này', value: `${stats.monthlySpending.toLocaleString()}đ`, icon: CreditCard, color: 'text-purple-500', bgColor: 'bg-purple-50' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu tài chính...</span>
      </div>
    );
  }

  const bettingStats = getBettingStats();
  const recentTransactions = transactions.slice(0, 5);
  
  // Calculate this month's earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const monthlyEarnings = transactions
    .filter(t => 
      new Date(t.created_at) >= startOfMonth && 
      ['challenge_win', 'bet_win', 'tournament_win'].includes(t.transaction_type) &&
      t.amount > 0
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Balance Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Số dư tài khoản</h3>
              <p className="text-3xl font-bold text-green-600">
                {wallet?.balance?.toLocaleString() || 0} VND
              </p>
              <p className="text-sm text-muted-foreground">Cập nhật realtime</p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nạp tiền</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-green-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                +{monthlyEarnings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Thu nhập tháng này</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{bettingStats.activeBets}</div>
              <div className="text-sm text-muted-foreground">Cược đang hoạt động</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-yellow-500">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{bettingStats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Tỷ lệ thắng cược</div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-purple-500">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                bettingStats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {bettingStats.netProfit >= 0 ? '+' : ''}{bettingStats.netProfit.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Lợi nhuận cược</div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <History className="h-4 w-4 mr-2" />
            Giao dịch gần đây
          </h4>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <Card key={transaction.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {transaction.description || 'Giao dịch'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} VND
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Challenge Betting component with integrated hooks
const ChallengeBetting = () => {
  const { 
    userBets, 
    bettableChallenges, 
    loading, 
    placeBet, 
    cancelBet 
  } = useChallengeBetting();
  
  const [betAmount, setBetAmount] = React.useState('');
  const [selectedChallenge, setSelectedChallenge] = React.useState<string | null>(null);
  const [placingBet, setPlacingBet] = React.useState(false);

  const handlePlaceBet = async (challengeId: string, bettedOn: string) => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      return;
    }

    try {
      setPlacingBet(true);
      const success = await placeBet(challengeId, bettedOn, parseFloat(betAmount));
      
      if (success) {
        setBetAmount('');
        setSelectedChallenge(null);
      }
    } finally {
      setPlacingBet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu cược...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Challenges for Betting */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Challenge có thể cược</h3>
          </div>
          
          {bettableChallenges.length > 0 ? (
            <div className="space-y-4">
              {bettableChallenges.map((challenge) => (
                <Card key={challenge.id} className="p-4 border-l-4 border-green-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">
                          {challenge.challenger?.username} vs {challenge.opponent?.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {challenge.challenge_type} • Tiền cược: {challenge.bet_amount?.toLocaleString()} VND
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {challenge.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {new Date(challenge.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    
                    {selectedChallenge === challenge.id ? (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Số tiền cược (VND)</label>
                          <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="Nhập số tiền..."
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handlePlaceBet(challenge.id, challenge.challenger.id)}
                            disabled={placingBet}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {placingBet ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <TrendingUp className="h-4 w-4 mr-2" />
                            )}
                            Cược {challenge.challenger?.username}
                          </Button>
                          <Button
                            onClick={() => handlePlaceBet(challenge.id, challenge.opponent.id)}
                            disabled={placingBet}
                            variant="outline"
                            className="flex-1"
                          >
                            {placingBet ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-2" />
                            )}
                            Cược {challenge.opponent?.username}
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedChallenge(null)}
                          className="w-full"
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedChallenge(challenge.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Đặt cược
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Hiện tại không có challenge nào để cược</p>
            </div>
          )}
        </div>
      </Card>

      {/* User's Betting History */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Lịch sử cược của bạn</h3>
          </div>
          
          {userBets.length > 0 ? (
            <div className="space-y-3">
              {userBets.map((bet) => (
                <Card key={bet.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {bet.challenge?.challenger?.username} vs {bet.challenge?.opponent?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cược: {bet.bet_amount.toLocaleString()} VND
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={
                            bet.status === 'won' ? 'default' :
                            bet.status === 'lost' ? 'destructive' :
                            bet.status === 'cancelled' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {bet.status === 'won' ? 'Thắng' : 
                           bet.status === 'lost' ? 'Thua' : 
                           bet.status === 'cancelled' ? 'Đã hủy' : 
                           'Chờ kết quả'}
                        </Badge>
                        {bet.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelBet(bet.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Hủy cược
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {bet.payout > 0 && (
                        <div className={`font-bold ${
                          bet.status === 'won' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {bet.status === 'won' ? '+' : ''}{bet.payout.toLocaleString()} VND
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {new Date(bet.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Bạn chưa đặt cược challenge nào</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
const TransactionHistory = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <History className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Lịch sử giao dịch</h3>
      </div>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
          Tất cả
        </button>
        <button className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">
          Nạp tiền
        </button>
        <button className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">
          Rút tiền
        </button>
        <button className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80">
          Thắng/Thua
        </button>
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {[
          { type: 'win', desc: 'Thắng Challenge vs Player123', amount: '+100,000', time: '14:30', color: 'green' },
          { type: 'fee', desc: 'Phí Tournament Spring Cup', amount: '-50,000', time: '10:15', color: 'red' },
          { type: 'deposit', desc: 'Nạp tiền VNPay', amount: '+500,000', time: 'Hôm qua', color: 'green' },
          { type: 'win', desc: 'Thắng Tournament Round 1', amount: '+75,000', time: '2 ngày trước', color: 'green' },
          { type: 'membership', desc: 'Gia hạn gói Pro', amount: '-200,000', time: '3 ngày trước', color: 'red' },
          { type: 'withdraw', desc: 'Rút tiền về ngân hàng', amount: '-300,000', time: '1 tuần trước', color: 'red' },
        ].map((transaction, index) => (
          <Card key={index} className="p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.color === 'green' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'win' && <DollarSign className="h-4 w-4 text-green-600" />}
                  {transaction.type === 'deposit' && <CreditCard className="h-4 w-4 text-green-600" />}
                  {(transaction.type === 'fee' || transaction.type === 'withdraw' || transaction.type === 'membership') && 
                    <DollarSign className="h-4 w-4 text-red-600" />}
                </div>
                <div>
                  <div className="font-medium">{transaction.desc}</div>
                  <div className="text-sm text-muted-foreground">{transaction.time}</div>
                </div>
              </div>
              <div className={`text-sm font-medium ${
                transaction.color === 'green' ? 'text-green-500' : 'text-red-500'
              }`}>
                {transaction.amount} VND
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </Card>
);

// Quick Actions component
const QuickActions = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold">Hành động nhanh</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-green-500" />
            <div>
              <div className="font-medium">Nạp tiền</div>
              <div className="text-sm text-muted-foreground">Nạp tiền vào tài khoản</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3">
            <Wallet className="h-6 w-6 text-blue-500" />
            <div>
              <div className="font-medium">Rút tiền</div>
              <div className="text-sm text-muted-foreground">Rút tiền về ngân hàng</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-purple-500" />
            <div>
              <div className="font-medium">Nâng cấp hội viên</div>
              <div className="text-sm text-muted-foreground">Xem các gói hội viên</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-gray-500" />
            <div>
              <div className="font-medium">Xem lịch sử</div>
              <div className="text-sm text-muted-foreground">Chi tiết giao dịch</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Card>
);

const FinancialHub: React.FC = () => {
  return (
    <div className="compact-container compact-layout desktop-high-density">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="compact-title">Financial Hub</h1>
          <p className="compact-subtitle">
            Quản lý tài chính, thanh toán và gói hội viên của bạn
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-9 md:h-10">
          <TabsTrigger value="overview" className="compact-nav-item flex items-center space-x-1">
            <Wallet className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline responsive-text-xs">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="betting" className="compact-nav-item flex items-center space-x-1">
            <Target className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline responsive-text-xs">Cược</span>
          </TabsTrigger>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Ví</span>
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Hội viên</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Hành động</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview" className="mt-6">
          <FinancialOverview />
        </TabsContent>

        <TabsContent value="betting" className="mt-6">
          <ChallengeBetting />
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <Suspense fallback={<TabLoadingSpinner />}>
            <PaymentPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="membership" className="mt-6">
          <Suspense fallback={<TabLoadingSpinner />}>
            <MembershipPage />
          </Suspense>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <QuickActions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialHub;
