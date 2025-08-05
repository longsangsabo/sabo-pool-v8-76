import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { Progress } from '@/shared/components/ui/progress';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import {
  DollarSign,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Building,
  Users,
  Target,
  Zap,
  Shield,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
} from 'lucide-react';
import { AdminCoreProvider } from '@/features/admin/components/core/AdminCoreProvider';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { toast } from 'sonner';

interface Payment {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'wager_win'
    | 'wager_loss'
    | 'tournament_fee'
    | 'refund'
    | 'bonus';
  method: 'vnpay' | 'momo' | 'bank_transfer' | 'card' | 'wallet' | 'cash';
  amount: number;
  fee: number;
  netAmount: number;
  currency: 'VND' | 'USD';
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'refunded';
  description: string;
  reference?: string;
  gatewayResponse?: any;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
  adminNotes: string[];
  priority: 'low' | 'medium' | 'high';
  isAutomated: boolean;
  relatedChallenge?: string;
  relatedTournament?: string;
}

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  successRate: number;
  avgProcessingTime: number;
  dailyLimit: number;
  usedToday: number;
  fees: {
    fixed: number;
    percentage: number;
  };
  supportedMethods: string[];
}

interface PaymentAnalytics {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  avgTransactionValue: number;
  topMethods: { method: string; count: number; volume: number }[];
  dailyTrend: { date: string; volume: number; count: number }[];
  revenueByType: { type: string; amount: number }[];
}

const AdminPaymentsNew = () => {
  const { t } = useTranslation();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      transactionId: 'TXN_20250803_001',
      userId: 'user1',
      userName: 'Nguyễn Văn A',
      type: 'deposit',
      method: 'vnpay',
      amount: 500000,
      fee: 15000,
      netAmount: 485000,
      currency: 'VND',
      status: 'completed',
      description: 'Nạp tiền vào ví',
      reference: 'VNP_20250803_123456',
      createdAt: new Date('2025-08-03T09:00:00'),
      processedAt: new Date('2025-08-03T09:02:00'),
      adminNotes: [],
      priority: 'medium',
      isAutomated: true,
    },
    {
      id: '2',
      transactionId: 'TXN_20250803_002',
      userId: 'user2',
      userName: 'Trần Thị B',
      type: 'withdrawal',
      method: 'bank_transfer',
      amount: 200000,
      fee: 5000,
      netAmount: 195000,
      currency: 'VND',
      status: 'pending',
      description: 'Rút tiền về tài khoản ngân hàng',
      createdAt: new Date('2025-08-03T10:30:00'),
      adminNotes: ['Awaiting bank verification'],
      priority: 'high',
      isAutomated: false,
    },
    {
      id: '3',
      transactionId: 'TXN_20250803_003',
      userId: 'user3',
      userName: 'Lê Văn C',
      type: 'wager_win',
      method: 'wallet',
      amount: 100000,
      fee: 0,
      netAmount: 100000,
      currency: 'VND',
      status: 'completed',
      description: 'Thắng cược thách đấu',
      relatedChallenge: 'challenge_123',
      createdAt: new Date('2025-08-03T11:45:00'),
      processedAt: new Date('2025-08-03T11:45:00'),
      adminNotes: [],
      priority: 'low',
      isAutomated: true,
    },
    {
      id: '4',
      transactionId: 'TXN_20250803_004',
      userId: 'user4',
      userName: 'Phạm Thị D',
      type: 'tournament_fee',
      method: 'momo',
      amount: 50000,
      fee: 2000,
      netAmount: 48000,
      currency: 'VND',
      status: 'failed',
      description: 'Phí tham gia giải đấu',
      failureReason: 'Insufficient funds in MoMo wallet',
      relatedTournament: 'tournament_456',
      createdAt: new Date('2025-08-03T12:15:00'),
      adminNotes: ['User notified of failure', 'Retry requested'],
      priority: 'medium',
      isAutomated: true,
    },
  ]);

  const [gateways] = useState<PaymentGateway[]>([
    {
      id: 'vnpay',
      name: 'VNPay',
      provider: 'Vietnam National Payment Corporation',
      status: 'active',
      successRate: 98.5,
      avgProcessingTime: 30,
      dailyLimit: 100000000,
      usedToday: 25000000,
      fees: { fixed: 0, percentage: 2.5 },
      supportedMethods: ['card', 'bank_transfer', 'qr_code'],
    },
    {
      id: 'momo',
      name: 'MoMo',
      provider: 'M_Service',
      status: 'active',
      successRate: 97.2,
      avgProcessingTime: 15,
      dailyLimit: 50000000,
      usedToday: 12000000,
      fees: { fixed: 1000, percentage: 1.5 },
      supportedMethods: ['wallet', 'qr_code'],
    },
    {
      id: 'banking',
      name: 'Bank Transfer',
      provider: 'Multi-bank Integration',
      status: 'maintenance',
      successRate: 99.1,
      avgProcessingTime: 120,
      dailyLimit: 200000000,
      usedToday: 0,
      fees: { fixed: 5000, percentage: 0.5 },
      supportedMethods: ['bank_transfer'],
    },
  ]);

  const analytics: PaymentAnalytics = {
    totalVolume: 15750000,
    totalTransactions: 247,
    successRate: 94.3,
    avgTransactionValue: 63765,
    topMethods: [
      { method: 'vnpay', count: 120, volume: 8500000 },
      { method: 'momo', count: 80, volume: 4200000 },
      { method: 'bank_transfer', count: 30, volume: 2800000 },
      { method: 'wallet', count: 17, volume: 250000 },
    ],
    dailyTrend: [
      { date: '2025-08-01', volume: 5200000, count: 82 },
      { date: '2025-08-02', volume: 6100000, count: 95 },
      { date: '2025-08-03', volume: 4450000, count: 70 },
    ],
    revenueByType: [
      { type: 'deposit', amount: 8500000 },
      { type: 'tournament_fee', amount: 3200000 },
      { type: 'wager_win', amount: 2800000 },
      { type: 'withdrawal', amount: 1250000 },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'processing':
        return <RefreshCw className='h-4 w-4 animate-spin' />;
      case 'failed':
        return <XCircle className='h-4 w-4' />;
      case 'cancelled':
        return <XCircle className='h-4 w-4' />;
      case 'refunded':
        return <ArrowDownLeft className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-blue-100 text-blue-800';
      case 'wager_win':
        return 'bg-yellow-100 text-yellow-800';
      case 'wager_loss':
        return 'bg-red-100 text-red-800';
      case 'tournament_fee':
        return 'bg-purple-100 text-purple-800';
      case 'refund':
        return 'bg-gray-100 text-gray-800';
      case 'bonus':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className='h-4 w-4' />;
      case 'withdrawal':
        return <ArrowUpRight className='h-4 w-4' />;
      case 'wager_win':
        return <Target className='h-4 w-4' />;
      case 'wager_loss':
        return <Target className='h-4 w-4' />;
      case 'tournament_fee':
        return <Trophy className='h-4 w-4' />;
      case 'refund':
        return <RefreshCw className='h-4 w-4' />;
      case 'bonus':
        return <Zap className='h-4 w-4' />;
      default:
        return <DollarSign className='h-4 w-4' />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'vnpay':
        return <CreditCard className='h-4 w-4' />;
      case 'momo':
        return <Wallet className='h-4 w-4' />;
      case 'bank_transfer':
        return <Building className='h-4 w-4' />;
      case 'card':
        return <CreditCard className='h-4 w-4' />;
      case 'wallet':
        return <Wallet className='h-4 w-4' />;
      case 'cash':
        return <DollarSign className='h-4 w-4' />;
      default:
        return <DollarSign className='h-4 w-4' />;
    }
  };

  const handleUpdateStatus = (paymentId: string, newStatus: string) => {
    setPayments(prev =>
      prev.map(payment =>
        payment.id === paymentId
          ? {
              ...payment,
              status: newStatus as Payment['status'],
              processedAt:
                newStatus === 'completed' ? new Date() : payment.processedAt,
            }
          : payment
      )
    );
    toast.success(`Payment status updated to ${newStatus}!`);
  };

  const handleAddAdminNote = () => {
    if (!newAdminNote.trim() || !selectedPayment) return;

    setPayments(prev =>
      prev.map(payment =>
        payment.id === selectedPayment.id
          ? { ...payment, adminNotes: [...payment.adminNotes, newAdminNote] }
          : payment
      )
    );

    setNewAdminNote('');
    toast.success('Admin note added successfully!');
  };

  const handleRefund = () => {
    if (!selectedPayment || !refundAmount || !refundReason) return;

    const refundPayment: Payment = {
      id: Date.now().toString(),
      transactionId: `REFUND_${selectedPayment.transactionId}`,
      userId: selectedPayment.userId,
      userName: selectedPayment.userName,
      type: 'refund',
      method: selectedPayment.method,
      amount: parseFloat(refundAmount),
      fee: 0,
      netAmount: parseFloat(refundAmount),
      currency: 'VND',
      status: 'processing',
      description: `Refund for ${selectedPayment.transactionId}: ${refundReason}`,
      reference: selectedPayment.reference,
      createdAt: new Date(),
      adminNotes: [`Refund initiated: ${refundReason}`],
      priority: 'high',
      isAutomated: false,
    };

    setPayments(prev => [refundPayment, ...prev]);
    setShowRefundModal(false);
    setRefundAmount('');
    setRefundReason('');
    toast.success('Refund initiated successfully!');
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch =
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    {
      title: "Today's Volume",
      value: `${analytics.totalVolume.toLocaleString()}đ`,
      description: `${analytics.totalTransactions} transactions`,
      icon: DollarSign,
      trend: 'up',
      change: '+12.5%',
    },
    {
      title: 'Success Rate',
      value: `${analytics.successRate}%`,
      description: 'Overall success',
      icon: CheckCircle,
      trend: 'up',
      change: '+2.1%',
    },
    {
      title: 'Pending Payments',
      value: payments.filter(p => p.status === 'pending').length.toString(),
      description: 'Need attention',
      icon: Clock,
      trend: 'down',
      change: '-5',
    },
    {
      title: 'Avg Transaction',
      value: `${analytics.avgTransactionValue.toLocaleString()}đ`,
      description: 'Per transaction',
      icon: TrendingUp,
      trend: 'up',
      change: '+8.3%',
    },
  ];

  const pageActions = (
    <div className='flex items-center gap-2'>
      <Button variant='outline' size='sm'>
        <Download className='h-4 w-4 mr-2' />
        Export
      </Button>
      <Button variant='outline' size='sm'>
        <Upload className='h-4 w-4 mr-2' />
        Bulk Process
      </Button>
      <Button onClick={() => setShowProcessModal(true)} size='sm'>
        <Plus className='h-4 w-4 mr-2' />
        Manual Payment
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title={t('payments.title')}
        description={t('payments.description')}
        actions={pageActions}
      >
        <div className='space-y-6'>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        {stat.title}
                      </p>
                      <p className='text-2xl font-bold'>{stat.value}</p>
                      <div className='flex items-center gap-1 mt-1'>
                        <span
                          className={`text-xs ${
                            stat.trend === 'up'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.trend === 'up' ? (
                            <TrendingUp className='h-3 w-3' />
                          ) : (
                            <TrendingDown className='h-3 w-3' />
                          )}
                        </span>
                        <span
                          className={`text-xs ${
                            stat.trend === 'up'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {stat.description}
                        </span>
                      </div>
                    </div>
                    <stat.icon className='h-8 w-8 text-muted-foreground' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue='transactions' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='transactions'>Transactions</TabsTrigger>
              <TabsTrigger value='gateways'>Payment Gateways</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value='transactions' className='space-y-6'>
              {/* Filters */}
              <Card>
                <CardContent className='p-4'>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder={t('payments.search_placeholder')}
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className='pl-10'
                        />
                      </div>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className='w-48'>
                        <SelectValue placeholder='Filter by status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Transactions</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='processing'>Processing</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='failed'>Failed</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                        <SelectItem value='refunded'>Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Grid */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Transactions List */}
                <div className='lg:col-span-2 space-y-4'>
                  {filteredPayments.map(payment => (
                    <Card
                      key={payment.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPayment?.id === payment.id
                          ? 'ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <CardContent className='p-6'>
                        <div className='space-y-4'>
                          {/* Header */}
                          <div className='flex items-start justify-between'>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2'>
                                <h3 className='font-medium'>
                                  {payment.transactionId}
                                </h3>
                                {!payment.isAutomated && (
                                  <Badge className='bg-blue-100 text-blue-800'>
                                    <Eye className='h-3 w-3 mr-1' />
                                    Manual
                                  </Badge>
                                )}
                              </div>
                              <p className='text-sm text-muted-foreground'>
                                {payment.description}
                              </p>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                              <Badge className={getStatusColor(payment.status)}>
                                {getStatusIcon(payment.status)}
                                <span className='ml-1 capitalize'>
                                  {payment.status}
                                </span>
                              </Badge>
                              <div className='text-right'>
                                <div className='font-bold text-lg'>
                                  {payment.amount.toLocaleString()}đ
                                </div>
                                {payment.fee > 0 && (
                                  <div className='text-xs text-muted-foreground'>
                                    Fee: -{payment.fee.toLocaleString()}đ
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* User Info */}
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={payment.userAvatar} />
                              <AvatarFallback>
                                {payment.userName
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1'>
                              <div className='text-sm font-medium'>
                                {payment.userName}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                ID: {payment.userId}
                              </div>
                            </div>
                          </div>

                          {/* Transaction Details */}
                          <div className='flex items-center gap-4 text-sm'>
                            <div className='flex items-center gap-1'>
                              <Badge className={getTypeColor(payment.type)}>
                                {getTypeIcon(payment.type)}
                                <span className='ml-1'>
                                  {payment.type.replace('_', ' ')}
                                </span>
                              </Badge>
                            </div>
                            <div className='flex items-center gap-1'>
                              {getMethodIcon(payment.method)}
                              <span className='capitalize'>
                                {payment.method.replace('_', ' ')}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-4 w-4' />
                              <span>{payment.createdAt.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                            {payment.reference && (
                              <div className='flex items-center gap-1'>
                                <Receipt className='h-4 w-4' />
                                <span>Ref: {payment.reference}</span>
                              </div>
                            )}
                            {payment.adminNotes.length > 0 && (
                              <div className='flex items-center gap-1'>
                                <Eye className='h-4 w-4' />
                                <span>{payment.adminNotes.length} note(s)</span>
                              </div>
                            )}
                            {payment.relatedChallenge && (
                              <div className='flex items-center gap-1'>
                                <Target className='h-4 w-4' />
                                <span>Challenge</span>
                              </div>
                            )}
                            {payment.relatedTournament && (
                              <div className='flex items-center gap-1'>
                                <Trophy className='h-4 w-4' />
                                <span>Tournament</span>
                              </div>
                            )}
                          </div>

                          {/* Failure Info */}
                          {payment.status === 'failed' &&
                            payment.failureReason && (
                              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                                <div className='flex items-center gap-2 text-red-800'>
                                  <AlertTriangle className='h-4 w-4' />
                                  <span className='text-sm font-medium'>
                                    Failure Reason:
                                  </span>
                                </div>
                                <p className='text-sm text-red-700 mt-1'>
                                  {payment.failureReason}
                                </p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredPayments.length === 0 && (
                    <Card>
                      <CardContent className='p-12 text-center'>
                        <DollarSign className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                        <h3 className='text-lg font-medium mb-2'>
                          No transactions found
                        </h3>
                        <p className='text-muted-foreground'>
                          No payment transactions match your current filters.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Payment Details Panel */}
                <div className='space-y-6'>
                  {selectedPayment ? (
                    <>
                      {/* Payment Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <CreditCard className='h-5 w-5' />
                            Payment Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='space-y-3'>
                            <div>
                              <Label className='text-sm font-medium'>
                                Status
                              </Label>
                              <div className='mt-1'>
                                <Select
                                  value={selectedPayment.status}
                                  onValueChange={value =>
                                    handleUpdateStatus(
                                      selectedPayment.id,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='pending'>
                                      Pending
                                    </SelectItem>
                                    <SelectItem value='processing'>
                                      Processing
                                    </SelectItem>
                                    <SelectItem value='completed'>
                                      Completed
                                    </SelectItem>
                                    <SelectItem value='failed'>
                                      Failed
                                    </SelectItem>
                                    <SelectItem value='cancelled'>
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Separator />

                            <div className='space-y-2'>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Transaction ID:</span>
                                <span className='text-sm font-mono'>
                                  {selectedPayment.transactionId}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Type:</span>
                                <Badge
                                  className={getTypeColor(selectedPayment.type)}
                                >
                                  {selectedPayment.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Method:</span>
                                <span className='text-sm capitalize'>
                                  {selectedPayment.method.replace('_', ' ')}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Amount:</span>
                                <span className='text-sm font-medium'>
                                  {selectedPayment.amount.toLocaleString()}đ
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Fee:</span>
                                <span className='text-sm'>
                                  -{selectedPayment.fee.toLocaleString()}đ
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-sm font-medium'>
                                  Net Amount:
                                </span>
                                <span className='text-sm font-bold'>
                                  {selectedPayment.netAmount.toLocaleString()}đ
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div className='space-y-2'>
                              <div className='flex justify-between'>
                                <span className='text-sm'>Created:</span>
                                <span className='text-sm'>
                                  {selectedPayment.createdAt.toLocaleString()}
                                </span>
                              </div>
                              {selectedPayment.processedAt && (
                                <div className='flex justify-between'>
                                  <span className='text-sm'>Processed:</span>
                                  <span className='text-sm'>
                                    {selectedPayment.processedAt.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {selectedPayment.reference && (
                                <div className='flex justify-between'>
                                  <span className='text-sm'>Reference:</span>
                                  <span className='text-sm font-mono'>
                                    {selectedPayment.reference}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedPayment.status === 'completed' && (
                            <div className='flex gap-2 pt-4'>
                              <Button
                                onClick={() => setShowRefundModal(true)}
                                variant='outline'
                                size='sm'
                                className='flex-1'
                              >
                                <ArrowDownLeft className='h-4 w-4 mr-2' />
                                Refund
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Admin Notes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <Eye className='h-5 w-5' />
                            Admin Notes ({selectedPayment.adminNotes.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='space-y-2'>
                            {selectedPayment.adminNotes.map((note, index) => (
                              <div
                                key={index}
                                className='p-3 bg-muted rounded-lg text-sm'
                              >
                                {note}
                              </div>
                            ))}
                          </div>

                          <div className='space-y-3'>
                            <Textarea
                              placeholder='Add admin note...'
                              value={newAdminNote}
                              onChange={e => setNewAdminNote(e.target.value)}
                              rows={3}
                            />
                            <Button
                              onClick={handleAddAdminNote}
                              size='sm'
                              className='w-full'
                            >
                              <Plus className='h-4 w-4 mr-2' />
                              Add Note
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className='p-12 text-center'>
                        <CreditCard className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                        <h3 className='text-lg font-medium mb-2'>
                          Select a Transaction
                        </h3>
                        <p className='text-muted-foreground'>
                          Choose a payment transaction to view details and take
                          action.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Payment Gateways Tab */}
            <TabsContent value='gateways' className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {gateways.map(gateway => (
                  <Card key={gateway.id}>
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg'>
                          {gateway.name}
                        </CardTitle>
                        <Badge
                          className={
                            gateway.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : gateway.status === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {gateway.status}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {gateway.provider}
                      </p>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-3'>
                        <div className='flex justify-between'>
                          <span className='text-sm'>Success Rate:</span>
                          <span className='text-sm font-medium'>
                            {gateway.successRate}%
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-sm'>Avg Processing:</span>
                          <span className='text-sm'>
                            {gateway.avgProcessingTime}s
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-sm'>Daily Usage:</span>
                          <span className='text-sm'>
                            {(
                              (gateway.usedToday / gateway.dailyLimit) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={(gateway.usedToday / gateway.dailyLimit) * 100}
                          className='h-2'
                        />
                        <div className='text-xs text-muted-foreground'>
                          {gateway.usedToday.toLocaleString()}đ /{' '}
                          {gateway.dailyLimit.toLocaleString()}đ
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className='text-sm font-medium mb-2'>
                          Supported Methods:
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {gateway.supportedMethods.map((method, index) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='text-xs'
                            >
                              {method.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className='text-sm font-medium mb-2'>Fees:</div>
                        <div className='text-sm text-muted-foreground'>
                          Fixed: {gateway.fees.fixed.toLocaleString()}đ +{' '}
                          {gateway.fees.percentage}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value='analytics' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <PieChart className='h-5 w-5' />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {analytics.topMethods.map((method, index) => (
                        <div key={index} className='space-y-2'>
                          <div className='flex justify-between'>
                            <span className='text-sm capitalize'>
                              {method.method.replace('_', ' ')}
                            </span>
                            <span className='text-sm font-medium'>
                              {method.volume.toLocaleString()}đ
                            </span>
                          </div>
                          <Progress
                            value={
                              (method.volume / analytics.totalVolume) * 100
                            }
                            className='h-2'
                          />
                          <div className='text-xs text-muted-foreground'>
                            {method.count} transactions
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <BarChart3 className='h-5 w-5' />
                      Revenue by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {analytics.revenueByType.map((type, index) => (
                        <div key={index} className='space-y-2'>
                          <div className='flex justify-between'>
                            <span className='text-sm capitalize'>
                              {type.type.replace('_', ' ')}
                            </span>
                            <span className='text-sm font-medium'>
                              {type.amount.toLocaleString()}đ
                            </span>
                          </div>
                          <Progress
                            value={(type.amount / analytics.totalVolume) * 100}
                            className='h-2'
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value='settings' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-center py-12'>
                    <Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-medium mb-2'>
                      Payment Configuration
                    </h3>
                    <p className='text-muted-foreground'>
                      Payment gateway settings and configuration options will be
                      available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Refund Modal */}
        <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Issue a refund for this payment transaction
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label>Refund Amount (đ)</Label>
                <Input
                  type='number'
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder='Enter refund amount'
                  max={selectedPayment?.amount}
                />
              </div>
              <div>
                <Label>Reason for Refund</Label>
                <Textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder='Explain the reason for this refund...'
                  rows={3}
                />
              </div>
              <div className='flex gap-2'>
                <Button onClick={handleRefund} className='flex-1'>
                  Process Refund
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowRefundModal(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminPaymentsNew;
