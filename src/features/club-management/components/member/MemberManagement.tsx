import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  TrendingUp,
  History,
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { MemberList } from './MemberList';
import { MemberForm } from './MemberForm';
import { MemberStats } from './MemberStats';
import { MemberHistory } from './MemberHistory';
import { MemberFilters } from './MemberFilters';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { LoadingCard } from '@/components/ui/loading-card';

export function MemberManagement() {
  const {
    members,
    selectedMember,
    stats,
    loading,
    error,
    setSelectedMember,
    addMember,
    updateMember,
    deleteMember,
    filters,
    setFilters,
  } = useMemberManagement();

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
            <p className="font-semibold">Error loading members</p>
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
          <h2 className="text-2xl font-bold">Quản lý thành viên</h2>
          <p className="text-muted-foreground">
            Quản lý thành viên và hoạt động tại câu lạc bộ
          </p>
        </div>
        <Button onClick={() => setSelectedMember(null)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm thành viên
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm mới
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Thống kê
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

        <TabsContent value="list">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Danh sách thành viên</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Tìm kiếm thành viên..."
                      className="pl-8 rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MemberList
                  members={members}
                  onSelect={setSelectedMember}
                  selectedId={selectedMember?.id}
                />
              </CardContent>
            </Card>

            {selectedMember && (
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Chi tiết thành viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <MemberForm
                    member={selectedMember}
                    onSubmit={updateMember}
                    onDelete={deleteMember}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Thêm thành viên mới</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberForm onSubmit={addMember} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <MemberStats stats={stats} />
        </TabsContent>

        <TabsContent value="history">
          <MemberHistory members={members} />
        </TabsContent>

        <TabsContent value="filters">
          <MemberFilters filters={filters} onFilterChange={setFilters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
