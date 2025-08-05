import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useReferrals } from '@/hooks/useReferrals';
import { supabase } from '@/integrations/supabase/client';
import { Check, Copy, Gift, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const ReferralSection: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading } = useReferrals();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('my_referral_code, full_name')
        .eq('user_id', user.id)
        .single();

      setProfile(data);
    };

    fetchProfile();
  }, [user]);
  const [copied, setCopied] = useState(false);

  const copyReferralLink = () => {
    if (!profile?.my_referral_code) return;

    const link = `${window.location.origin}/auth/register?ref=${profile.my_referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Đã sao chép link giới thiệu!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card className='p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-muted rounded w-1/3 mb-4'></div>
          <div className='h-10 bg-muted rounded mb-4'></div>
          <div className='h-20 bg-muted rounded'></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className='p-6'>
      <div className='flex items-center gap-2 mb-4'>
        <Users className='h-5 w-5 text-primary' />
        <h3 className='text-lg font-semibold'>Giới thiệu bạn bè</h3>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='text-sm text-muted-foreground'>
            Mã giới thiệu của bạn
          </label>
          <div className='flex gap-2 mt-1'>
            <Input
              value={profile?.my_referral_code || 'Đang tạo...'}
              readOnly
              className='font-mono font-medium'
            />
            <Button
              onClick={copyReferralLink}
              variant='outline'
              disabled={!profile?.my_referral_code}
            >
              {copied ? (
                <Check className='h-4 w-4' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>

        <Alert>
          <Gift className='h-4 w-4' />
          <AlertDescription>
            <strong>Nhận 100 SPA</strong> khi bạn bè đăng ký và xác thực hạng
            thành công! Bạn bè cũng nhận 100 SPA khi đăng ký.
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center p-4 bg-muted/50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='text-2xl font-bold'>
                {stats?.totalReferrals || 0}
              </span>
            </div>
            <div className='text-sm text-muted-foreground'>Tổng giới thiệu</div>
          </div>

          <div className='text-center p-4 bg-muted/50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <TrendingUp className='h-4 w-4 text-green-600' />
              <span className='text-2xl font-bold text-green-600'>
                {stats?.totalEarned || 0}
              </span>
              <span className='text-sm text-muted-foreground'>SPA</span>
            </div>
            <div className='text-sm text-muted-foreground'>Đã nhận</div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className='flex gap-2 justify-center'>
          <Badge variant='secondary'>
            <span className='w-2 h-2 bg-yellow-500 rounded-full mr-1'></span>
            Chờ: {stats?.pendingRewards || 0}
          </Badge>
          <Badge variant='default'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-1'></span>
            Hoàn thành: {stats?.successfulReferrals || 0}
          </Badge>
        </div>

        {profile?.my_referral_code && (
          <div className='pt-2 border-t'>
            <p className='text-xs text-muted-foreground text-center'>
              Chia sẻ link: {window.location.origin}/auth/register?ref=
              {profile.my_referral_code}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReferralSection;
