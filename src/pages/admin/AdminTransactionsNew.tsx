import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Ban,
  RefreshCw,
  ArrowUpDown,
  Receipt,
  Wallet,
  CreditCard,
  Filter
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { AdminDataTable, ColumnDef } from '@/components/admin/shared/AdminDataTable';
import { AdminStatusBadge } from '@/components/admin/shared/AdminStatusBadge';
import { AdminStatsGrid } from '@/components/admin/shared/AdminStatsGrid';
import { EnhancedAdminDataTable, BulkAction } from '@/components/admin/shared/AdminBulkActions';
import { useAdminTransactions, useAdminTransactionStats, AdminTransaction } from '@/hooks/admin/useAdminData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Transaction type and payment method badges
const TransactionTypeBadge = ({ type }: { type: string }) => {
  const config = {
    deposit: { label: 'Nạp tiền', className: 'bg-green-100 text-green-800' },
    withdraw: { label: 'Rút tiền', className: 'bg-orange-100 text-orange-800' },
    tournament_fee: { label: 'Phí giải đấu', className: 'bg-purple-100 text-purple-800' },
    membership: { label: 'Hội viên', className: 'bg-blue-100 text-blue-800' },
    challenge_stake: { label: 'Cược thách đấu', className: 'bg-pink-100 text-pink-800' },
  };

  const typeConfig = config[type as keyof typeof config] || { 
    label: type, 
    className: 'bg-gray-100 text-gray-800' 
  };

  return (
    <Badge className={typeConfig.className}>
      {typeConfig.label}
    </Badge>
  );
};

const PaymentMethodBadge = ({ method }: { method: string | null }) => {
  if (!method) return <span className="text-gray-400">-</span>;

  const config = {
    vnpay: { label: 'VNPay', icon: <CreditCard className="h-3 w-3" /> },
    wallet: { label: 'Ví', icon: <Wallet className="h-3 w-3" /> },
    bank_transfer: { label: 'Chuyển khoản', icon: <ArrowUpDown className="h-3 w-3" /> },
  };

  const methodConfig = config[method as keyof typeof config] || { 
    label: method, 
    icon: <Receipt className="h-3 w-3" /> 
  };

  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600">
      {methodConfig.icon}
      <span>{methodConfig.label}</span>
    </div>
  );
};

interface TransactionManagementProps {
  transactions: AdminTransaction[];
  onViewTransaction: (transaction: AdminTransaction) => void;
  onApproveTransaction: (transaction: AdminTransaction) => void;
  onRejectTransaction: (transaction: AdminTransaction) => void;
  onRefundTransaction: (transaction: AdminTransaction) => void;
  loading?: boolean;
}

const AdminTransactionsNew = () => {
  const { t } = useTranslation();
  const { transactions, loading: transactionsLoading } = useAdminTransactions();
  const { stats, loading: statsLoading } = useAdminTransactionStats();
  const [activeTab, setActiveTab] = useState('all');

  // Filter transactions by status
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    return transaction.status === activeTab;
  });

  const handleViewTransaction = (transaction: AdminTransaction) => {
    toast.info(`Xem chi tiết giao dịch ${transaction.transaction_id}`);
  };

  const handleApproveTransaction = (transaction: AdminTransaction) => {
    toast.success(`Đã phê duyệt giao dịch ${transaction.transaction_id}`);
  };

  const handleRejectTransaction = (transaction: AdminTransaction) => {
    toast.error(`Đã từ chối giao dịch ${transaction.transaction_id}`);
  };

  const handleRefundTransaction = (transaction: AdminTransaction) => {
    toast.info(`Đã hoàn tiền giao dịch ${transaction.transaction_id}`);
  };

  const pageActions = (
    <div className="flex space-x-2">
      <Button
        onClick={() => {
          // Export functionality
          const csv = transactions.map(t => 
            `${t.transaction_id},${t.user_name},${t.type},${t.amount},${t.status}`
          ).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'transactions_report.csv';
          a.click();
          toast.success('Đã xuất báo cáo giao dịch');
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        Xuất báo cáo
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          window.location.reload();
        }}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Làm mới
      </Button>
    </div>
  );

  // Stats configuration
  const statsConfig = [
    {
      title: 'Tổng giao dịch',
      value: stats.totalTransactions.toLocaleString(),
      description: 'Tất cả giao dịch',
      icon: Receipt,
    },
    {
      title: 'Tổng giá trị',
      value: `${(stats.totalAmount / 1000000).toFixed(1)}M`,
      description: 'VNĐ',
      icon: DollarSign,
    },
    {
      title: 'Chờ xử lý',
      value: stats.pendingTransactions.toString(),
      description: 'Giao dịch',
      icon: Clock,
    },
    {
      title: 'Hôm nay',
      value: `${(stats.todayAmount / 1000000).toFixed(1)}M`,
      description: 'VNĐ',
      icon: TrendingUp,
    },
  ];

  return (
    <AdminCoreProvider>
            <AdminPageLayout
        title={t('transactions.title')}
        description={t('transactions.description')}
        actions={pageActions}
      >
        {/* Stats Grid */}
        <AdminStatsGrid 
          stats={statsConfig}
        />

        {/* Filters and Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">{t('transactions.all_transactions')} ({transactions.length})</TabsTrigger>
              <TabsTrigger value="pending">
                {t('transactions.pending')} ({transactions.filter(t => t.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {t('transactions.completed')} ({transactions.filter(t => t.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                {t('transactions.failed')} ({transactions.filter(t => t.status === 'failed').length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                {t('transactions.cancelled')} ({transactions.filter(t => t.status === 'cancelled').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <TransactionManagementTableWithBulkActions
                transactions={filteredTransactions}
                onViewTransaction={handleViewTransaction}
                onApproveTransaction={handleApproveTransaction}
                onRejectTransaction={handleRejectTransaction}
                onRefundTransaction={handleRefundTransaction}
                loading={transactionsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

const TransactionManagementTableWithBulkActions = ({ 
  transactions, 
  onViewTransaction,
  onApproveTransaction,
  onRejectTransaction,
  onRefundTransaction,
  loading = false 
}: TransactionManagementProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-approve',
      label: 'Phê duyệt hàng loạt',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      confirmMessage: `Bạn có chắc chắn muốn phê duyệt ${selectedIds.length} giao dịch đã chọn?`,
      onExecute: async (ids: string[]) => {
        for (const id of ids) {
          const transaction = transactions.find(t => t.transaction_id === id);
          if (transaction && transaction.status === 'pending') {
            onApproveTransaction(transaction);
          }
        }
        toast.success(`Đã phê duyệt ${ids.length} giao dịch`);
      }
    },
    {
      id: 'bulk-reject',
      label: 'Từ chối hàng loạt',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      confirmMessage: `Bạn có chắc chắn muốn từ chối ${selectedIds.length} giao dịch đã chọn?`,
      onExecute: async (ids: string[]) => {
        for (const id of ids) {
          const transaction = transactions.find(t => t.transaction_id === id);
          if (transaction && transaction.status === 'pending') {
            onRejectTransaction(transaction);
          }
        }
        toast.success(`Đã từ chối ${ids.length} giao dịch`);
      }
    },
    {
      id: 'bulk-export',
      label: 'Xuất danh sách',
      icon: <Download className="h-4 w-4" />,
      onExecute: async (ids: string[]) => {
        const selectedTransactions = transactions.filter(t => ids.includes(t.transaction_id));
        const csv = selectedTransactions.map(t => 
          `${t.transaction_id},${t.user_name},${t.type},${t.amount},${t.status},${t.created_at}`
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected_transactions.csv';
        a.click();
        toast.success(`Đã xuất ${ids.length} giao dịch`);
      }
    },
  ];

  const columns: ColumnDef<AdminTransaction>[] = [
    {
      key: 'transaction_info',
      header: 'Thông tin giao dịch',
      render: (_, transaction) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{transaction.transaction_id}</div>
          <div className="text-xs text-gray-500">{transaction.reference_id}</div>
          <div className="text-xs text-gray-400">
            {new Date(transaction.created_at).toLocaleString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      key: 'user_info',
      header: 'Người dùng',
      render: (_, transaction) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {transaction.user_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{transaction.user_name || 'Chưa xác định'}</div>
            <div className="text-xs text-gray-500">ID: {transaction.user_id.slice(0, 8)}...</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại giao dịch',
      render: (value) => <TransactionTypeBadge type={value} />,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      sortable: true,
      render: (value) => (
        <div className="text-right">
          <div className="font-bold text-green-600">
            {value.toLocaleString('vi-VN')} VNĐ
          </div>
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Phương thức',
      render: (value) => <PaymentMethodBadge method={value} />,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => <AdminStatusBadge type="transaction" status={value} />,
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (value) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-600 truncate" title={value}>
            {value || '-'}
          </div>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: onViewTransaction,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Phê duyệt',
      onClick: onApproveTransaction,
      icon: <CheckCircle className="h-4 w-4" />,
      condition: (transaction: AdminTransaction) => transaction.status === 'pending',
    },
    {
      label: 'Từ chối',
      onClick: onRejectTransaction,
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const,
      condition: (transaction: AdminTransaction) => transaction.status === 'pending',
    },
    {
      label: 'Hoàn tiền',
      onClick: onRefundTransaction,
      icon: <RefreshCw className="h-4 w-4" />,
      condition: (transaction: AdminTransaction) => transaction.status === 'completed',
    },
  ];

  return (
    <EnhancedAdminDataTable
      data={transactions}
      columns={columns}
      loading={loading}
      actions={actions}
      bulkActions={bulkActions}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      idKey="transaction_id"
      searchPlaceholder="Tìm kiếm ID giao dịch, tên người dùng..."
      emptyMessage="Không có giao dịch nào"
    />
  );
};

export default AdminTransactionsNew;
