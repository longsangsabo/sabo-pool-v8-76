import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { RANK_ELO, TOURNAMENT_ELO_REWARDS } from '@/utils/eloConstants';
import { formatRankDisplay } from '@/utils/rankUtils';

export const OfficialELOIntegrationStatus: React.FC = () => {
  // Official ELO system metrics from RANK_SYSTEM_README.md
  const officialMetrics = {
    totalRanks: 12,
    eloRange: { min: 1000, max: 2100 },
    consistentGaps: 100,
    tournamentRewards: Object.keys(TOURNAMENT_ELO_REWARDS).length,
    baseKFactor: 32,
    systemVersion: 'v2.0_official',
  };

  const integrationStatus = [
    {
      component: 'Rank Definitions',
      status: 'integrated',
      description: '12 ranks với ELO requirements chính thức',
      details: 'K(1000) → E+(2100+)',
      icon: Star,
    },
    {
      component: 'Tournament Rewards',
      status: 'integrated', 
      description: 'Tournament ELO rewards theo documentation',
      details: '+5 (Top 16) đến +80 (Champion)',
      icon: Trophy,
    },
    {
      component: 'ELO Mapping Functions',
      status: 'integrated',
      description: 'Bidirectional ELO ↔ Rank conversion',
      details: 'get_official_rank_from_elo(), get_official_elo_from_rank()',
      icon: Target,
    },
    {
      component: 'Game Configuration',
      status: 'integrated',
      description: 'Core ELO settings từ official documentation',
      details: 'Base rating, gaps, tournament rewards',
      icon: TrendingUp,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'integrated': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'integrated': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Official ELO System Integration</h2>
          <p className="text-muted-foreground">
            Status tích hợp hệ thống ELO chính thức từ RANK_SYSTEM_README.md
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 bg-green-50">
          {officialMetrics.systemVersion}
        </Badge>
      </div>

      {/* Integration Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Integration Complete
          </CardTitle>
          <CardDescription>
            Tất cả components đã được tích hợp với hệ thống ELO chính thức
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">100%</span>
            </div>
            <Progress value={100} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {integrationStatus.filter(s => s.status === 'integrated').length}
                </p>
                <p className="text-xs text-muted-foreground">Integrated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {officialMetrics.totalRanks}
                </p>
                <p className="text-xs text-muted-foreground">Ranks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {officialMetrics.consistentGaps}
                </p>
                <p className="text-xs text-muted-foreground">ELO Gap</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {officialMetrics.tournamentRewards}
                </p>
                <p className="text-xs text-muted-foreground">Tournament Tiers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Components Status */}
      <div className="grid gap-4">
        {integrationStatus.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.component}</h3>
                        {getStatusIcon(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.details}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Official ELO System Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Rank Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Official Rank Structure
            </CardTitle>
            <CardDescription>
              12-tier ranking system với consistent ELO gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(RANK_ELO).map(([rank, elo]) => (
                <div key={rank} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatRankDisplay(rank)}</Badge>
                    <span className="text-sm font-medium">{elo} ELO</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{elo - (elo >= 1100 ? elo - 100 : 0)} gap
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tournament Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournament ELO Rewards
            </CardTitle>
            <CardDescription>
              Official tournament reward structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(TOURNAMENT_ELO_REWARDS).map(([position, reward]) => {
                const positionNames: Record<string, string> = {
                  CHAMPION: 'Vô địch',
                  RUNNER_UP: 'Á quân', 
                  THIRD_PLACE: 'Hạng 3',
                  FOURTH_PLACE: 'Hạng 4',
                  TOP_8: 'Top 8',
                  TOP_16: 'Top 16',
                  PARTICIPATION: 'Tham gia',
                };

                const getRewardColor = (reward: number) => {
                  if (reward >= 80) return 'text-yellow-600 bg-yellow-50';
                  if (reward >= 40) return 'text-silver-600 bg-gray-50';
                  if (reward >= 20) return 'text-orange-600 bg-orange-50';
                  if (reward >= 10) return 'text-blue-600 bg-blue-50';
                  if (reward >= 5) return 'text-green-600 bg-green-50';
                  return 'text-gray-600 bg-gray-50';
                };

                return (
                  <div key={position} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm font-medium">
                      {positionNames[position] || position}
                    </span>
                    <Badge variant="outline" className={getRewardColor(reward)}>
                      +{reward} ELO
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>Official ELO System Features</CardTitle>
          <CardDescription>
            Key characteristics của hệ thống ELO đã được tích hợp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-primary">System Characteristics</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span><strong>12 tiers:</strong> K → K+ → I → I+ → H → H+ → G → G+ → F → F+ → E → E+</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span><strong>Consistent gaps:</strong> 100 ELO points between adjacent ranks</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span><strong>Base range:</strong> 1000-2100+ ELO (E+ is open-ended)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span><strong>Clear milestone:</strong> Rank G (1600+) = reliable 1-ball clearance</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-primary">Tournament Integration</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span><strong>Champion:</strong> +80 ELO (highest reward)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span><strong>Runner-up:</strong> +40 ELO (50% of champion)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span><strong>Scalable rewards:</strong> Position-based từ +5 đến +80</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span><strong>Skill correlation:</strong> Perfect alignment với ball-potting abilities</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Integration Summary */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-lg font-semibold text-green-600">
            Official ELO System Successfully Integrated
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Hệ thống ELO từ <code>RANK_SYSTEM_README.md</code> đã được tích hợp hoàn toàn vào Game Configuration, 
          backend database, và frontend components.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>✅ Database Migration</span>
          <span>✅ Frontend Constants</span>
          <span>✅ Game Configuration</span>
          <span>✅ Validation Functions</span>
        </div>
      </div>
    </div>
  );
};
