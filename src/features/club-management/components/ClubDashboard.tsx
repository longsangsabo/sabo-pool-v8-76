import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClubActivity, ClubDashboardStats, QuickAction } from "../types/dashboard.types"
import { Trophy, Users, Target, Table2 } from "lucide-react"

interface ClubDashboardProps {
  stats: ClubDashboardStats;
  recentActivities: ClubActivity[];
  quickActions: QuickAction[];
}

const StatsCard = ({ title, value, icon: Icon, description }: { 
  title: string;
  value: number | string;
  icon: any;
  description?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const ActivityList = ({ activities }: { activities: ClubActivity[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${
                activity.status === 'pending' 
                  ? 'bg-yellow-100' 
                  : activity.status === 'completed'
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}>
                {activity.type === 'tournament' && <Trophy className="h-4 w-4" />}
                {activity.type === 'challenge' && <Target className="h-4 w-4" />}
                {activity.type === 'membership' && <Users className="h-4 w-4" />}
                {activity.type === 'table_booking' && <Table2 className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                activity.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : activity.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {activity.status === 'pending' && 'Đang chờ'}
                {activity.status === 'completed' && 'Hoàn thành'}
                {activity.status === 'cancelled' && 'Đã hủy'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const QuickActions = ({ actions }: { actions: QuickAction[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = require('lucide-react')[action.icon]
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent"
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="text-sm text-center">{action.label}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ClubDashboard({ stats, recentActivities, quickActions }: ClubDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan CLB</h2>
        <p className="text-muted-foreground">
          Thống kê và hoạt động của câu lạc bộ
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="activities">Hoạt động</TabsTrigger>
          <TabsTrigger value="actions">Thao tác nhanh</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tổng thành viên"
              value={stats.totalMembers}
              icon={Users}
              description="Thành viên đang hoạt động"
            />
            <StatsCard
              title="Giải đấu"
              value={stats.activeTournaments}
              icon={Trophy}
              description="Giải đấu đang diễn ra"  
            />
            <StatsCard
              title="Thách đấu"
              value={stats.dailyChallenges}
              icon={Target}
              description="Thách đấu trong ngày"
            />
            <StatsCard
              title="Tình trạng bàn"
              value={`${stats.tableUtilization}%`}
              icon={Table2}
              description="Tỷ lệ sử dụng bàn"
            />
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <ActivityList activities={recentActivities} />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActions actions={quickActions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
