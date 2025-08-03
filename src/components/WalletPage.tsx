import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  RotateCcw,
  DollarSign,
  Plus,
  Minus,
  Receipt,
  Loader2,
  Gift,
  Users,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import { TransactionMetadata } from '@/types/common';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id: string;
  payment_method: string;
  status: string;
  metadata: TransactionMetadata;
  created_at: string;
}

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Use mock wallet data since wallets table doesn't exist
      const mockWallet = {
        id: 'wallet-1',
        user_id: user?.id || '',
        balance: 150000,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          wallet_id: 'wallet-1',
          transaction_type: 'deposit',
          amount: 100000,
          balance_before: 50000,
          balance_after: 150000,
          description: 'Nạp tiền vào ví',
          reference_id: 'ref-1',
          payment_method: 'vnpay',
          status: 'completed',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          wallet_id: 'wallet-1',
          transaction_type: 'payment',
          amount: 50000,
          balance_before: 100000,
          balance_after: 50000,
          description: 'Thanh toán phí tham gia giải đấu',
          reference_id: 'ref-2',
          payment_method: 'wallet',
          status: 'completed',
          metadata: {},
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setWallet(mockWallet);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className='w-5 h-5 text-green-600' />;
      case 'withdraw':
        return <ArrowUpRight className='w-5 h-5 text-red-600' />;
      case 'payment':
        return <CreditCard className='w-5 h-5 text-blue-600' />;
      case 'refund':
        return <RotateCcw className='w-5 h-5 text-purple-600' />;
      default:
        return <DollarSign className='w-5 h-5 text-gray-600' />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdraw':
        return 'text-red-600';
      case 'payment':
        return 'text-blue-600';
      case 'refund':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Nạp tiền';
      case 'withdraw':
        return 'Rút tiền';
      case 'payment':
        return 'Thanh toán';
      case 'refund':
        return 'Hoàn tiền';
      default:
        return 'Giao dịch';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Ví của tôi</h1>
          <p className='mt-2 text-gray-600'>
            Quản lý số dư và giao dịch trong ví điện tử
          </p>
        </div>

        {/* Wallet Balance Card */}
        <Card className='bg-gradient-to-r from-blue-600 to-blue-700 text-white mb-6'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-100 text-sm'>Số dư khả dụng</p>
                <p className='text-3xl font-bold'>
                  {wallet?.balance?.toLocaleString('vi-VN') || '0'} VNĐ
                </p>
              </div>
              <div className='text-right'>
                <Wallet className='w-12 h-12 text-blue-200 mb-2' />
                <p className='text-blue-100 text-sm'>
                  ID: {wallet?.id?.slice(-8)}
                </p>
              </div>
            </div>

            <div className='flex space-x-3 mt-6'>
              <Button
                onClick={() => setShowDepositModal(true)}
                className='bg-white text-blue-600 hover:bg-blue-50'
              >
                <Plus className='w-4 h-4 mr-2' />
                Nạp tiền
              </Button>
              <Button
                onClick={() => setShowWithdrawModal(true)}
                className='bg-blue-500 hover:bg-blue-400'
              >
                <Minus className='w-4 h-4 mr-2' />
                Rút tiền
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <Card className='text-center'>
            <CardContent className='p-4'>
              <CreditCard className='w-8 h-8 text-blue-600 mx-auto mb-2' />
              <p className='text-sm font-medium text-gray-900'>Thanh toán</p>
              <p className='text-xs text-gray-500'>Giải đấu, CLB</p>
            </CardContent>
          </Card>
          <Card className='text-center'>
            <CardContent className='p-4'>
              <Gift className='w-8 h-8 text-green-600 mx-auto mb-2' />
              <p className='text-sm font-medium text-gray-900'>Nhận thưởng</p>
              <p className='text-xs text-gray-500'>Giải đấu, sự kiện</p>
            </CardContent>
          </Card>
          <Card className='text-center'>
            <CardContent className='p-4'>
              <Users className='w-8 h-8 text-purple-600 mx-auto mb-2' />
              <p className='text-sm font-medium text-gray-900'>Chuyển tiền</p>
              <p className='text-xs text-gray-500'>Cho bạn bè</p>
            </CardContent>
          </Card>
          <Card className='text-center'>
            <CardContent className='p-4'>
              <Shield className='w-8 h-8 text-orange-600 mx-auto mb-2' />
              <p className='text-sm font-medium text-gray-900'>Bảo mật</p>
              <p className='text-xs text-gray-500'>Cài đặt PIN</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='divide-y divide-gray-200'>
              {transactions.length > 0 ? (
                transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className='py-4 flex items-center justify-between'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='flex-shrink-0'>
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {transaction.description ||
                            getTransactionLabel(transaction.transaction_type)}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {new Date(transaction.created_at).toLocaleString(
                            'vi-VN'
                          )}
                        </p>
                        {transaction.payment_method && (
                          <p className='text-xs text-gray-400'>
                            Qua {transaction.payment_method.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='text-right'>
                      <p
                        className={`text-sm font-medium ${getTransactionColor(transaction.transaction_type)}`}
                      >
                        {transaction.transaction_type === 'deposit' ||
                        transaction.transaction_type === 'refund'
                          ? '+'
                          : '-'}
                        {transaction.amount.toLocaleString('vi-VN')} VNĐ
                      </p>
                      <p className='text-xs text-gray-500'>
                        Số dư:{' '}
                        {transaction.balance_after.toLocaleString('vi-VN')} VNĐ
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status === 'completed'
                          ? 'Thành công'
                          : transaction.status === 'pending'
                            ? 'Đang xử lý'
                            : 'Thất bại'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='py-12 text-center'>
                  <Receipt className='w-12 h-12 mx-auto text-gray-400 mb-4' />
                  <p className='text-gray-500'>Chưa có giao dịch nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={fetchWalletData}
        />

        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          wallet={wallet}
          onSuccess={fetchWalletData}
        />
      </div>
    </div>
  );
};

export default WalletPage;
