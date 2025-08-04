import React, { useState } from 'react';
import { UserPlus, Play, CheckCircle, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const QuickRealUserCreator = () => {
  const { user: currentUser } = useAuth();
  const [userCount, setUserCount] = useState(5);
  const [skillDistribution, setSkillDistribution] = useState('mixed');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState<
    Array<{
      message: string;
      type: 'info' | 'error' | 'success';
      timestamp: string;
    }>
  >([]);
  const [createdUsers, setCreatedUsers] = useState<any[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const vietnamesePrefixes = [
    'Nguyễn',
    'Trần',
    'Lê',
    'Phạm',
    'Hoàng',
    'Huỳnh',
    'Phan',
    'Vũ',
    'Võ',
    'Đặng',
  ];
  const vietnameseFirstNames = [
    'Văn',
    'Thị',
    'Minh',
    'Tuấn',
    'Hương',
    'Lan',
    'Hùng',
    'Linh',
    'Nam',
    'Mai',
  ];
  const vietnameseLastNames = [
    'An',
    'Bình',
    'Cường',
    'Dũng',
    'Hải',
    'Khoa',
    'Long',
    'Phong',
    'Quân',
    'Sơn',
  ];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
  const cities = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Nha Trang',
    'Vũng Tàu',
  ];

  const generateVietnameseName = () => {
    const prefix =
      vietnamesePrefixes[Math.floor(Math.random() * vietnamesePrefixes.length)];
    const firstName =
      vietnameseFirstNames[
        Math.floor(Math.random() * vietnameseFirstNames.length)
      ];
    const lastName =
      vietnameseLastNames[
        Math.floor(Math.random() * vietnameseLastNames.length)
      ];
    return `${prefix} ${firstName} ${lastName}`;
  };

  const generatePhoneNumber = () => {
    const prefixes = [
      '096',
      '097',
      '098',
      '032',
      '033',
      '034',
      '035',
      '036',
      '037',
      '038',
      '039',
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, '0');
    return `${prefix}${number}`;
  };

  const generateEmail = (fullName: string) => {
    const cleanName = fullName
      .toLowerCase()
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]/g, ''); // Remove any non-alphanumeric characters
    const randomNum = Math.floor(Math.random() * 10000);
    return `${cleanName || 'user'}${randomNum}@gmail.com`;
  };

  const addLog = (
    message: string,
    type: 'info' | 'error' | 'success' = 'info'
  ) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      // Check recent users (last 20, excluding admins)
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select(
          `
          user_id,
          full_name,
          phone,
          skill_level,
          created_at
        `
        )
        .neq('is_admin', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Get detailed info for recent users
      const detailedUsers = [];
      if (recentUsers && recentUsers.length > 0) {
        for (const user of recentUsers) {
          const { data: authUser } = await supabase.auth.admin.getUserById(
            user.user_id
          );
          const { data: ranking } = await supabase
            .from('player_rankings')
            .select('elo_points, spa_points')
            .eq('user_id', user.user_id)
            .single();
          const { data: wallet } = await supabase
            .from('wallets')
            .select('points_balance')
            .eq('user_id', user.user_id)
            .single();

          detailedUsers.push({
            id: user.user_id,
            email: authUser?.user?.email || 'N/A',
            auth_created_at: authUser?.user?.created_at || user.created_at,
            full_name: user.full_name,
            phone: user.phone,
            skill_level: user.skill_level,
            elo_points: ranking?.elo_points,
            spa_points: ranking?.spa_points,
            balance: wallet?.points_balance,
          });
        }
      }

      // Count all totals
      const authUsers = await supabase.auth.admin.listUsers();
      const authCount = authUsers?.data?.users?.length || 0;

      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const { count: rankingsCount } = await supabase
        .from('player_rankings')
        .select('*', { count: 'exact', head: true });
      const { count: walletsCount } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true });

      setDatabaseStatus({
        authUsers: authCount || 0,
        profiles: profilesCount || 0,
        rankings: rankingsCount || 0,
        wallets: walletsCount || 0,
        recentUsers: detailedUsers,
      });
    } catch (error) {
      console.error('Error checking database:', error);
      toast.error('Lỗi kiểm tra database');
    } finally {
      setIsChecking(false);
    }
  };

  const createRealUsers = async () => {
    setIsCreating(true);
    setProgress(0);
    setCurrentStep('');
    setLogs([]);
    setCreatedUsers([]);

    try {
      addLog('🚀 Tạo demo users trực tiếp trong database...', 'info');
      addLog(`📊 Số lượng: ${userCount} users (không qua auth signup)`, 'info');
      setCurrentStep('Khởi tạo...');

      const createdUsersList = [];

      for (let i = 0; i < userCount; i++) {
        setCurrentStep(`Tạo user ${i + 1}/${userCount}...`);
        addLog(`👤 User ${i + 1}: Bắt đầu quy trình...`, 'info');

        const fullName = generateVietnameseName();
        const phone = generatePhoneNumber();
        const email = generateEmail(fullName);
        const city = cities[Math.floor(Math.random() * cities.length)];

        let skillLevel = 'beginner';
        if (skillDistribution === 'mixed') {
          skillLevel =
            skillLevels[Math.floor(Math.random() * skillLevels.length)];
        } else {
          skillLevel = skillDistribution;
        }

        try {
          // Use edge function to create real auth users
          addLog(`1️⃣ Tạo auth user và profile: ${fullName}`, 'info');

          const { data, error } = await supabase.functions.invoke(
            'create-admin-user',
            {
              body: {
                email: email,
                password: 'Demo123!@#',
                full_name: fullName,
                phone: phone,
                skill_level: skillLevel,
                current_rank: 'K',
                elo: 800 + Math.floor(Math.random() * 400),
                bio: `Real user - ${skillLevel} level`,
                is_demo_user: false,
              },
            }
          );

          if (error) {
            addLog(`❌ Lỗi tạo auth user: ${error.message}`, 'error');
            continue;
          }

          if (!data?.success) {
            addLog(
              `❌ Lỗi tạo user: ${data?.error || 'Unknown error'}`,
              'error'
            );
            continue;
          }

          const realUserId = data.user_id;
          addLog(
            `✅ User tạo thành công: ${fullName} (ID: ${realUserId.slice(0, 8)}...)`,
            'success'
          );
          addLog(`🎉 Hoàn thành user ${i + 1}: ${fullName}`, 'success');

          createdUsersList.push({
            id: realUserId,
            email: email,
            phone: phone,
            full_name: fullName,
            skill_level: skillLevel,
            ready_for_tournament: true,
          });
        } catch (userError) {
          addLog(`❌ Lỗi tạo user ${i + 1}: ${userError.message}`, 'error');
          console.error(`Lỗi tạo user ${i + 1}:`, userError);
          continue;
        }

        setProgress(((i + 1) / userCount) * 100);
      }

      setCurrentStep('Hoàn thành!');
      addLog(
        `🏁 Tạo thành công ${createdUsersList.length}/${userCount} users hoàn chỉnh!`,
        'success'
      );
      addLog(`🎯 Users đã sẵn sàng tham gia giải đấu!`, 'success');

      setCreatedUsers(createdUsersList);
      toast.success(
        `Thành công tạo ${createdUsersList.length} user hoàn chỉnh!`
      );
    } catch (error) {
      console.error('Lỗi tạo users:', error);
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserPlus className='h-5 w-5' />
          Tạo User Hoàn Chỉnh
        </CardTitle>
        <CardDescription>
          Tạo user với quy trình đầy đủ: Auth → Profile → Ranking → Wallet → Sẵn
          sàng tham gia giải
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Quy trình Info */}
        <div className='border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20'>
          <div className='flex items-center gap-2 mb-3'>
            <Info className='h-4 w-4 text-blue-600' />
            <h3 className='font-medium text-blue-800 dark:text-blue-300'>
              Quy trình tạo User
            </h3>
          </div>
          <div className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
            <div>
              1️⃣ <strong>Auth User:</strong> Email + Password (Demo123!@#)
            </div>
            <div>
              2️⃣ <strong>Profile:</strong> Tên, SĐT, Skill Level, Địa chỉ
            </div>
            <div>
              3️⃣ <strong>Player Ranking:</strong> ELO (800-1200), SPA Points
            </div>
            <div>
              4️⃣ <strong>Wallet:</strong> Số dư ban đầu (0-50k VNĐ)
            </div>
            <div>
              ✅ <strong>Kết quả:</strong> User sẵn sàng tham gia giải đấu
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='userCount'>Số lượng user</Label>
            <Input
              id='userCount'
              type='number'
              min='1'
              max='10'
              value={userCount}
              onChange={e => setUserCount(Number(e.target.value))}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='skillDistribution'>Phân bố kỹ năng</Label>
            <Select
              value={skillDistribution}
              onValueChange={setSkillDistribution}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='mixed'>Hỗn hợp</SelectItem>
                <SelectItem value='beginner'>Tất cả Beginner</SelectItem>
                <SelectItem value='intermediate'>
                  Tất cả Intermediate
                </SelectItem>
                <SelectItem value='advanced'>Tất cả Advanced</SelectItem>
                <SelectItem value='professional'>
                  Tất cả Professional
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isCreating && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm'>
                Đang tạo users... {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} className='w-full' />
          </div>
        )}

        <Button
          onClick={createRealUsers}
          disabled={isCreating || userCount < 1 || userCount > 10}
          className='w-full'
        >
          {isCreating ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Đang tạo...
            </>
          ) : (
            <>
              <Play className='h-4 w-4 mr-2' />
              Tạo {userCount} User Hoàn Chỉnh
            </>
          )}
        </Button>

        {/* Real-time Progress Display */}
        {(isCreating || logs.length > 0) && (
          <div className='space-y-4 mt-4'>
            {/* Current Step Display */}
            {isCreating && (
              <div className='flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
                <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                  {currentStep || 'Đang khởi tạo...'}
                </span>
              </div>
            )}

            {/* Real-time Logs */}
            <div className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border max-h-60 overflow-y-auto'>
              <div className='flex justify-between items-center mb-3'>
                <h4 className='font-medium text-sm text-gray-700 dark:text-gray-300'>
                  Quy trình tạo User ({logs.length} logs)
                </h4>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className='text-xs text-gray-500 hover:text-gray-700 underline'
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className='space-y-1'>
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs font-mono flex items-start gap-2 p-2 rounded ${
                      log.type === 'error'
                        ? 'bg-red-50 text-red-700 border-l-2 border-red-300'
                        : log.type === 'success'
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-300'
                          : 'bg-blue-50 text-blue-700 border-l-2 border-blue-300'
                    }`}
                  >
                    <span className='text-gray-500 min-w-fit'>
                      [{log.timestamp}]
                    </span>
                    <span className='flex-1'>{log.message}</span>
                  </div>
                ))}
              </div>
              {logs.length === 0 && (
                <p className='body-small text-muted-foreground'>
                  Chưa có log nào...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Database Verification Section */}
        <div className='mt-6 space-y-4'>
          <Button
            onClick={checkDatabaseStatus}
            variant='outline'
            className='w-full'
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Đang kiểm tra Database...
              </>
            ) : (
              <>
                <CheckCircle className='h-4 w-4 mr-2' />
                Kiểm tra Database
              </>
            )}
          </Button>

          {databaseStatus && (
            <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border'>
              <h3 className='font-medium text-blue-800 dark:text-blue-300 mb-3'>
                📊 Trạng thái Database (Tổng số)
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
                <div className='bg-white dark:bg-gray-800 p-3 rounded border'>
                  <div className='font-medium text-gray-700 dark:text-gray-300'>
                    Auth Users
                  </div>
                  <div className='text-lg font-bold text-blue-600'>
                    {databaseStatus.authUsers}
                  </div>
                </div>
                <div className='bg-white dark:bg-gray-800 p-3 rounded border'>
                  <div className='font-medium text-gray-700 dark:text-gray-300'>
                    Profiles
                  </div>
                  <div className='text-lg font-bold text-green-600'>
                    {databaseStatus.profiles}
                  </div>
                </div>
                <div className='bg-white dark:bg-gray-800 p-3 rounded border'>
                  <div className='font-medium text-gray-700 dark:text-gray-300'>
                    Rankings
                  </div>
                  <div className='text-lg font-bold text-purple-600'>
                    {databaseStatus.rankings}
                  </div>
                </div>
                <div className='bg-white dark:bg-gray-800 p-3 rounded border'>
                  <div className='font-medium text-gray-700 dark:text-gray-300'>
                    Wallets
                  </div>
                  <div className='text-lg font-bold text-orange-600'>
                    {databaseStatus.wallets}
                  </div>
                </div>
              </div>

              {databaseStatus.recentUsers &&
                databaseStatus.recentUsers.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Users gần nhất:
                    </h4>
                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                      {databaseStatus.recentUsers.map((user, index) => (
                        <div
                          key={user.id}
                          className='text-xs bg-white dark:bg-gray-800 p-2 rounded border'
                        >
                          <div className='flex justify-between items-start'>
                            <div>
                              <div>
                                <strong>{user.email}</strong>
                              </div>
                              <div className='text-gray-500'>
                                ID: {user.id.slice(0, 8)}...
                              </div>
                              <div className='text-gray-500'>
                                Tạo:{' '}
                                {new Date(user.auth_created_at).toLocaleString(
                                  'vi-VN'
                                )}
                              </div>
                            </div>
                            <div className='flex gap-1'>
                              <span
                                className={`w-2 h-2 rounded-full ${user.full_name ? 'bg-green-500' : 'bg-red-500'}`}
                                title='Profile'
                              ></span>
                              <span
                                className={`w-2 h-2 rounded-full ${user.elo_points !== null ? 'bg-green-500' : 'bg-red-500'}`}
                                title='Ranking'
                              ></span>
                              <span
                                className={`w-2 h-2 rounded-full ${user.balance !== null ? 'bg-green-500' : 'bg-red-500'}`}
                                title='Wallet'
                              ></span>
                            </div>
                          </div>
                          {user.full_name && (
                            <div className='mt-1 text-green-700 dark:text-green-300'>
                              <div>
                                {user.full_name} | {user.skill_level} |{' '}
                                {user.city}
                              </div>
                              <div>
                                ELO: {user.elo_points || 'N/A'} | SPA:{' '}
                                {user.spa_points || 'N/A'} | Wallet:{' '}
                                {user.balance || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {createdUsers.length > 0 && (
          <div className='mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <h3 className='font-medium text-green-800 dark:text-green-300'>
                Tạo thành công!
              </h3>
            </div>
            <p className='text-sm text-green-700 dark:text-green-300 mb-3'>
              Đã tạo {createdUsers.length} user hoàn chỉnh với password:{' '}
              <strong>Demo123!@#</strong>
              <span className='block text-xs mt-1'>
                🎯 Users đã sẵn sàng tham gia giải đấu!
              </span>
            </p>
            <div className='space-y-1 max-h-32 overflow-y-auto'>
              {createdUsers.map((user, index) => (
                <div
                  key={user.id}
                  className='text-xs bg-white dark:bg-gray-800 p-2 rounded border'
                >
                  <div>
                    <strong>{user.full_name}</strong> ({user.city})
                  </div>
                  <div>📧 {user.email}</div>
                  <div>
                    📱 {user.phone} | 🏆 {user.skill_level}
                  </div>
                  <div className='text-green-600'>
                    ✅ Sẵn sàng tham gia giải
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickRealUserCreator;
