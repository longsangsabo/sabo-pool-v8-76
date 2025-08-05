import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  TrendingUp,
  Users,
  Calendar,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Trophy,
  Flame,
} from 'lucide-react';

interface PerformanceData {
  strongestOpponents: Array<{
    name: string;
    elo: number;
    matchCount: number;
    winRate: number;
    lastPlayed: string;
  }>;
  weaknesses: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }>;
  strengths: Array<{
    category: string;
    description: string;
    level: 'good' | 'excellent' | 'exceptional';
  }>;
  playingPatterns: {
    bestTimeOfDay: string;
    bestDayOfWeek: string;
    preferredRackFormat: string;
    averageMatchDuration: number;
  };
  consistency: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
  };
  predictions: {
    nextRankProbability: number;
    estimatedGamesToNextRank: number;
    predictedEloIn30Days: number;
    riskFactors: string[];
  };
}

interface PlayerPerformanceAnalyticsProps {
  playerId?: string;
  className?: string;
}

export const PlayerPerformanceAnalytics: React.FC<
  PlayerPerformanceAnalyticsProps
> = ({ playerId, className }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    strongestOpponents: [
      {
        name: 'Nguyễn Văn A',
        elo: 2200,
        matchCount: 5,
        winRate: 40,
        lastPlayed: '2024-01-15',
      },
      {
        name: 'Trần Thị B',
        elo: 2100,
        matchCount: 3,
        winRate: 33,
        lastPlayed: '2024-01-10',
      },
      {
        name: 'Lê Văn C',
        elo: 1950,
        matchCount: 4,
        winRate: 50,
        lastPlayed: '2024-01-12',
      },
    ],
    weaknesses: [
      {
        category: 'Áp lực thời gian',
        description: 'Tỷ lệ thắng giảm trong các trận đấu dài',
        severity: 'medium',
        suggestions: [
          'Luyện tập kiểm soát thời gian',
          'Cải thiện sự tập trung',
        ],
      },
      {
        category: 'Đối thủ cấp cao',
        description: 'Khó khăn khi đối mặt với ELO >2000',
        severity: 'high',
        suggestions: [
          'Phân tích chiến thuật của cao thủ',
          'Tăng cường luyện tập',
        ],
      },
    ],
    strengths: [
      {
        category: 'Khởi đầu mạnh',
        description: 'Tỷ lệ thắng set đầu tiên cao',
        level: 'excellent',
      },
      {
        category: 'Ổn định',
        description: 'Biến động ELO thấp, phong độ đều',
        level: 'good',
      },
    ],
    playingPatterns: {
      bestTimeOfDay: '19:00-21:00',
      bestDayOfWeek: 'Thứ 7',
      preferredRackFormat: 'Race to 7',
      averageMatchDuration: 45,
    },
    consistency: {
      score: 75,
      trend: 'improving',
      factors: ['Phong độ ổn định 2 tuần qua', 'Cải thiện tỷ lệ thắng'],
    },
    predictions: {
      nextRankProbability: 68,
      estimatedGamesToNextRank: 12,
      predictedEloIn30Days: 1650,
      riskFactors: ['Cần tránh chuỗi thua dài'],
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'exceptional':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'declining':
        return <TrendingUp className='h-4 w-4 text-red-500 rotate-180' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue='analysis' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='analysis'>Phân Tích</TabsTrigger>
          <TabsTrigger value='opponents'>Đối Thủ</TabsTrigger>
          <TabsTrigger value='patterns'>Thói Quen</TabsTrigger>
          <TabsTrigger value='predictions'>Dự Báo</TabsTrigger>
        </TabsList>

        <TabsContent value='analysis' className='space-y-6'>
          {/* Strengths and Weaknesses */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-green-600'>
                  <Trophy className='h-5 w-5' />
                  Điểm Mạnh
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {performanceData.strengths.map((strength, index) => (
                  <div key={index} className='p-3 rounded-lg border bg-card'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium'>{strength.category}</h4>
                      <Badge className={getLevelColor(strength.level)}>
                        {strength.level === 'exceptional'
                          ? 'Xuất sắc'
                          : strength.level === 'excellent'
                            ? 'Rất tốt'
                            : 'Tốt'}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {strength.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-red-600'>
                  <Target className='h-5 w-5' />
                  Điểm Yếu & Cải Thiện
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {performanceData.weaknesses.map((weakness, index) => (
                  <div key={index} className='p-3 rounded-lg border bg-card'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium'>{weakness.category}</h4>
                      <Badge className={getSeverityColor(weakness.severity)}>
                        {weakness.severity === 'high'
                          ? 'Cao'
                          : weakness.severity === 'medium'
                            ? 'Trung bình'
                            : 'Thấp'}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground mb-2'>
                      {weakness.description}
                    </p>
                    <div className='space-y-1'>
                      <p className='text-xs font-medium text-primary'>
                        Gợi ý cải thiện:
                      </p>
                      {weakness.suggestions.map((suggestion, i) => (
                        <p key={i} className='text-xs text-muted-foreground'>
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Consistency Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Phân Tích Độ Ổn Định
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>Điểm Ổn Định</span>
                    {getTrendIcon(performanceData.consistency.trend)}
                  </div>
                  <span className='text-2xl font-bold text-primary'>
                    {performanceData.consistency.score}%
                  </span>
                </div>
                <Progress
                  value={performanceData.consistency.score}
                  className='h-2'
                />
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Yếu tố ảnh hưởng:</p>
                  {performanceData.consistency.factors.map((factor, index) => (
                    <p key={index} className='text-sm text-muted-foreground'>
                      • {factor}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='opponents' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Đối Thủ Mạnh Nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {performanceData.strongestOpponents.map((opponent, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 rounded-lg border bg-card'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-bold text-primary'>
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium'>{opponent.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          ELO: {opponent.elo} • {opponent.matchCount} trận
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p
                        className={`font-bold ${opponent.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {opponent.winRate}%
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(opponent.lastPlayed).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='patterns' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Thời Gian Thi Đấu
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>Giờ tốt nhất:</span>
                    <span className='font-bold text-primary'>
                      {performanceData.playingPatterns.bestTimeOfDay}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Ngày tốt nhất:</span>
                    <span className='font-bold text-primary'>
                      {performanceData.playingPatterns.bestDayOfWeek}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Thời lượng TB:</span>
                    <span className='font-bold text-primary'>
                      {performanceData.playingPatterns.averageMatchDuration}{' '}
                      phút
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Định Dạng Ưa Thích
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-2'>
                  <p className='text-2xl font-bold text-primary'>
                    {performanceData.playingPatterns.preferredRackFormat}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Format có tỷ lệ thắng cao nhất
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='predictions' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5' />
                  Dự Báo Thăng Hạng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center space-y-2'>
                  <p className='text-3xl font-bold text-primary'>
                    {performanceData.predictions.nextRankProbability}%
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Khả năng thăng hạng
                  </p>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>Ước tính số trận:</span>
                    <span className='font-bold'>
                      {performanceData.predictions.estimatedGamesToNextRank}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>ELO dự báo (30 ngày):</span>
                    <span className='font-bold text-green-600'>
                      {performanceData.predictions.predictedEloIn30Days}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='h-5 w-5' />
                  Yếu Tố Rủi Ro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {performanceData.predictions.riskFactors.map(
                    (risk, index) => (
                      <div key={index} className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-yellow-500 rounded-full' />
                        <p className='text-sm'>{risk}</p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
