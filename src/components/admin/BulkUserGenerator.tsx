import React, { useState } from 'react';
import { Users, Play, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const BulkUserGenerator = () => {
  const { t } = useLanguage();
  const [userCount, setUserCount] = useState(10);
  const [includeRanks, setIncludeRanks] = useState(true);
  const [includeSpaPoints, setIncludeSpaPoints] = useState(true);
  const [skillDistribution, setSkillDistribution] = useState('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUsers, setGeneratedUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<Array<{message: string, type: 'info' | 'error' | 'success' | 'warning', timestamp: string}>>([]);

  const vietnamesePrefixes = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const vietnameseFirstNames = ['Văn', 'Thị', 'Minh', 'Tuấn', 'Hương', 'Lan', 'Hùng', 'Linh', 'Nam', 'Mai'];
  const vietnameseLastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khoa', 'Long', 'Phong', 'Quân', 'Sơn'];

  const skillLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
  const rankCodes = ['K', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

  const generateVietnameseName = () => {
    const prefix = vietnamesePrefixes[Math.floor(Math.random() * vietnamesePrefixes.length)];
    const firstName = vietnameseFirstNames[Math.floor(Math.random() * vietnameseFirstNames.length)];
    const lastName = vietnameseLastNames[Math.floor(Math.random() * vietnameseLastNames.length)];
    return `${prefix} ${firstName} ${lastName}`;
  };

  const generatePhoneNumber = () => {
    const prefixes = ['096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${number}`;
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const generateUsers = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedUsers([]);
    setLogs([]); // Clear previous logs

    try {
      addLog('🚀 Bắt đầu tạo người dùng...', 'info');
      addLog(`📊 Số lượng: ${userCount} người dùng`, 'info');
      addLog(`🎯 Kỹ năng: ${skillDistribution}`, 'info');
      
      // Check auth status
      addLog('🔒 Kiểm tra quyền admin...', 'info');
      const { data: { user } } = await supabase.auth.getUser();
      addLog(`👤 User hiện tại: ${user?.email || user?.phone || user?.id}`, 'info');
      
      // TRIỆT ĐỂ: Tạo test profiles hoàn toàn độc lập, không liên quan đến wallets
      addLog('⚙️ Tạo dữ liệu test profiles (KHÔNG có wallet)...', 'info');
      
      const profiles = [];
      for (let i = 0; i < userCount; i++) {
        const fullName = generateVietnameseName();
        const phone = generatePhoneNumber();
        
        let skillLevel = 'beginner';
        if (skillDistribution === 'mixed') {
          skillLevel = skillLevels[Math.floor(Math.random() * skillLevels.length)];
        } else {
          skillLevel = skillDistribution;
        }

        // CHẮC CHẮN: Chỉ tạo profile, KHÔNG có user_id (để tránh trigger)
        const profileData = {
          // user_id: NULL - Cố tình để NULL để tránh mọi trigger wallet
          phone: phone,
          display_name: fullName.split(' ').slice(-2).join(' '),
          full_name: fullName,
          role: 'player',
          skill_level: skillLevel,
          city: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'][Math.floor(Math.random() * 5)],
          district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
          bio: `Test user ${skillLevel} - NO WALLET`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        profiles.push(profileData);
        setProgress(((i + 1) / userCount) * 60);
        
        if ((i + 1) % 5 === 0 || i === userCount - 1) {
          addLog(`📝 Đã tạo ${i + 1}/${userCount} test profiles`, 'info');
        }
      }

      addLog(`✅ Hoàn thành tạo ${profiles.length} test profiles (KHÔNG có wallet)`, 'success');

      // TRIỆT ĐỂ: Insert trực tiếp với xử lý lỗi chi tiết
      addLog('💾 Lưu test profiles vào database (BỎ QUA wallet)...', 'info');
      
      // Thử insert từng batch nhỏ để tránh lỗi
      const batchSize = 5;
      const insertedProfiles = [];
      
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        addLog(`📦 Đang lưu batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(profiles.length/batchSize)}...`, 'info');
        
        const { data: batchResult, error: batchError } = await supabase
          .from('profiles')
          .insert(batch)
          .select('id, phone, display_name, full_name, role');

        if (batchError) {
          addLog(`❌ Lỗi batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`, 'error');
          addLog(`🔍 Chi tiết lỗi: ${JSON.stringify(batchError)}`, 'error');
          throw batchError;
        }

        if (batchResult) {
          insertedProfiles.push(...batchResult);
          addLog(`✅ Batch ${Math.floor(i/batchSize) + 1} thành công: ${batchResult.length} profiles`, 'success');
        }
        
        setProgress(60 + ((i + batchSize) / profiles.length) * 25);
      }

      addLog(`🎉 THÀNH CÔNG! Đã lưu ${insertedProfiles.length} test profiles`, 'success');
      setProgress(85);

      // Generate rankings if requested
      if (includeRanks && insertedProfiles.length > 0) {
        addLog('🏆 Tạo dữ liệu xếp hạng cho test profiles...', 'info');
        
        const rankings = insertedProfiles.map((profile) => {
          const elo = 800 + Math.floor(Math.random() * 1200);
          const spaPoints = includeSpaPoints ? Math.floor(Math.random() * 500) : 0;
          
          return {
            user_id: profile.id, // Sử dụng profile.id
            elo: elo,
            spa_points: spaPoints,
            total_matches: Math.floor(Math.random() * 50),
            wins: Math.floor(Math.random() * 30),
            losses: Math.floor(Math.random() * 20),
            created_at: new Date().toISOString(),
          };
        });

        const { error: rankingError } = await supabase
          .from('player_rankings')
          .insert(rankings);

        if (rankingError) {
          addLog(`⚠️ Không tạo được ranking: ${rankingError.message}`, 'warning');
        } else {
          addLog(`✅ Đã tạo ranking cho ${rankings.length} test profiles`, 'success');
        }
      }

      setProgress(100);
      setGeneratedUsers(insertedProfiles);
      addLog('🎊 HOÀN THÀNH TRIỆT ĐỂ! Không có wallet nào được tạo!', 'success');
      
      toast.success(`Thành công tạo ${insertedProfiles.length} test profiles (KHÔNG có wallet)!`);

    } catch (error) {
      addLog(`💥 THẤT BẠI TRIỆT ĐỂ: ${error.message}`, 'error');
      addLog(`🔍 Chi tiết lỗi: ${JSON.stringify(error)}`, 'error');
      
      console.error('❌ PHÂN TÍCH LỖI CHI TIẾT:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
        userCount,
        skillDistribution
      });
      
      toast.error(`Thất bại: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('dev.bulk_user_title')}
        </CardTitle>
        <CardDescription>
          {t('dev.bulk_user_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userCount">{t('dev.user_count')}</Label>
            <Input
              id="userCount"
              type="number"
              min="10"
              max="100"
              value={userCount}
              onChange={(e) => setUserCount(Number(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skillDistribution">{t('dev.skill_distribution')}</Label>
            <Select value={skillDistribution} onValueChange={setSkillDistribution}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">{t('dev.mixed_levels') || 'Mixed Levels'}</SelectItem>
                <SelectItem value="beginner">{t('dev.all_beginner') || 'All Beginner'}</SelectItem>
                <SelectItem value="intermediate">{t('dev.all_intermediate') || 'All Intermediate'}</SelectItem>
                <SelectItem value="advanced">{t('dev.all_advanced') || 'All Advanced'}</SelectItem>
                <SelectItem value="professional">{t('dev.all_professional') || 'All Professional'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRanks"
              checked={includeRanks}
              onCheckedChange={(checked) => setIncludeRanks(checked as boolean)}
            />
            <Label htmlFor="includeRanks">{t('dev.generate_ranking') || 'Generate ranking data'}</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSpaPoints"
              checked={includeSpaPoints}
              onCheckedChange={(checked) => setIncludeSpaPoints(checked as boolean)}
            />
            <Label htmlFor="includeSpaPoints">{t('dev.include_spa_points') || 'Include SPA points'}</Label>
          </div>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('dev.generating_users') || 'Generating users...'} {progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          onClick={generateUsers} 
          disabled={isGenerating || userCount < 10 || userCount > 100}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('dev.generating') || 'Generating...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {(t('dev.generate_users') || 'Generate {count} Users').replace('{count}', userCount.toString())}
            </>
          )}
        </Button>

        {/* Real-time Log Display */}
        {logs.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-3 text-sm text-gray-700 dark:text-gray-300">
                Quá trình tạo người dùng:
              </h4>
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`text-xs font-mono flex items-start gap-2 p-2 rounded ${
                      log.type === 'error' 
                        ? 'bg-red-50 text-red-700 border-l-2 border-red-300' 
                        : log.type === 'success'
                        ? 'bg-green-50 text-green-700 border-l-2 border-green-300'
                        : log.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-300'
                        : 'bg-blue-50 text-blue-700 border-l-2 border-blue-300'
                    }`}
                  >
                    <span className="text-gray-500 min-w-fit">
                      [{log.timestamp}]
                    </span>
                    <span className="flex-1">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Status Indicator */}
        {isGenerating && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Đang xử lý... {progress.toFixed(0)}%
            </span>
          </div>
        )}

        {generatedUsers.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800">{t('dev.generation_complete') || 'Generation Complete'}</h3>
            </div>
            <p className="text-sm text-green-700">
              {(t('dev.users_created') || 'Successfully created {count} test users with profiles').replace('{count}', generatedUsers.length.toString())}
              {includeRanks && ` ${t('dev.with_ranking') || 'and ranking data'}`}
              {includeSpaPoints && ` ${t('dev.with_spa_points') || 'including SPA points'}`}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUserGenerator;