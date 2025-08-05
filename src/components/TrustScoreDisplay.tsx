import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Users, Star, RefreshCw } from 'lucide-react';
import { useClubTrustScore } from '@/hooks/useClubTrustScore';
import { Button } from '@/components/ui/button';

interface TrustScoreDisplayProps {
  compact?: boolean;
}

const TrustScoreDisplay = ({ compact = false }: TrustScoreDisplayProps) => {
  const { data, loading, error, refetch } = useClubTrustScore();

  const getTrustBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    if (score >= 60) return 'outline';
    return 'destructive';
  };

  const getTrustLabel = (score: number) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 75) return 'Tốt';
    if (score >= 60) return 'Khá';
    return 'Cần cải thiện';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center py-4'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
            <span className='ml-2 text-sm text-muted-foreground'>
              Đang tải điểm tin cậy...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-4'>
            <p className='text-sm text-red-600'>Lỗi tải điểm tin cậy</p>
            <Button
              variant='outline'
              size='sm'
              onClick={refetch}
              className='mt-2'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Club Trust Score */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Điểm tin cậy CLB
            </CardTitle>
            <Star className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {data.clubTrustScore.toFixed(1)}%
            </div>
            <Badge
              variant={getTrustBadgeVariant(data.clubTrustScore)}
              className='mt-2'
            >
              {getTrustLabel(data.clubTrustScore)}
            </Badge>
          </CardContent>
        </Card>

        {/* Average Member Trust */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Điểm tin cậy TB
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {data.averageMemberTrust.toFixed(1)}%
            </div>
            <p className='text-xs text-muted-foreground'>
              {data.memberTrustScores.length} thành viên
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Trust Score Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Star className='w-5 h-5 text-yellow-500' />
              Điểm tin cậy CLB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-yellow-600 mb-2'>
              {data.clubTrustScore.toFixed(1)}%
            </div>
            <Badge variant={getTrustBadgeVariant(data.clubTrustScore)}>
              {getTrustLabel(data.clubTrustScore)}
            </Badge>
            <p className='text-sm text-muted-foreground mt-2'>
              Dựa trên đánh giá từ người chơi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-purple-500' />
              Điểm tin cậy trung bình thành viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-purple-600 mb-2'>
              {data.averageMemberTrust.toFixed(1)}%
            </div>
            <Badge variant={getTrustBadgeVariant(data.averageMemberTrust)}>
              {getTrustLabel(data.averageMemberTrust)}
            </Badge>
            <p className='text-sm text-muted-foreground mt-2'>
              Từ {data.memberTrustScores.length} thành viên đã xác thực
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Trust Scores */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Thành viên tích cực
            </div>
            <Button variant='outline' size='sm' onClick={refetch}>
              <RefreshCw className='w-4 h-4 mr-2' />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.memberTrustScores.length === 0 ? (
            <div className='text-center py-8'>
              <Users className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p className='text-muted-foreground'>
                Chưa có thành viên nào được xác thực
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {data.memberTrustScores
                .sort((a, b) => b.trust_score - a.trust_score)
                .map(member => (
                  <div
                    key={member.user_id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{member.full_name}</p>
                        {member.phone && (
                          <p className='text-sm text-muted-foreground'>
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-lg font-bold'>
                        {member.trust_score.toFixed(1)}%
                      </div>
                      <Badge
                        variant={getTrustBadgeVariant(member.trust_score)}
                        className='text-xs'
                      >
                        {getTrustLabel(member.trust_score)}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustScoreDisplay;
