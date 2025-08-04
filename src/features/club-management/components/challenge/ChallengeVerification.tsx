import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Filter,
  RefreshCcw
} from 'lucide-react';
import { ChallengeList } from './ChallengeList';
import { ChallengeDetails } from './ChallengeDetails';
import { ChallengeFilters } from './ChallengeFilters';
import { ChallengeHistory } from './ChallengeHistory';
import { useChallengeVerification } from '../hooks/useChallengeVerification';
import { LoadingCard } from '@/components/ui/loading-card';
import { format } from 'date-fns';

export function ChallengeVerification() {
  const {
    challenges,
    selectedChallenge,
    loading,
    error,
    filters,
    setSelectedChallenge,
    setFilters,
    verifyChallenge,
    rejectChallenge,
    refreshChallenges,
  } = useChallengeVerification();

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <p className="font-semibold">Error loading challenges</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Xác minh thách đấu</h2>
          <p className="text-muted-foreground">
            Xác minh kết quả các trận thách đấu tại CLB
          </p>
        </div>
        <Button variant="outline" onClick={refreshChallenges}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Chờ xác minh
            {challenges.filter(c => c.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {challenges.filter(c => c.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Lịch sử
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Danh sách chờ</CardTitle>
              </CardHeader>
              <CardContent>
                <ChallengeList
                  challenges={challenges.filter(c => c.status === 'pending')}
                  onSelect={setSelectedChallenge}
                  selectedId={selectedChallenge?.id}
                />
              </CardContent>
            </Card>

            {selectedChallenge && (
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Chi tiết thách đấu</CardTitle>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="success"
                      onClick={() => verifyChallenge(selectedChallenge.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Xác nhận
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectChallenge(selectedChallenge.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChallengeDetails challenge={selectedChallenge} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <ChallengeHistory
            challenges={challenges.filter(c => c.status !== 'pending')}
          />
        </TabsContent>

        <TabsContent value="filters">
          <ChallengeFilters filters={filters} onFilterChange={setFilters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
