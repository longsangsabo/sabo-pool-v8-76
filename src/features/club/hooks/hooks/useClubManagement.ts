import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { ClubManagementNavigation } from '../types/navigation.types'
import { ClubDashboardStats, ClubActivity, QuickAction } from '../types/dashboard.types'

export function useClubManagement() {
  const { user } = useAuth()
  const [navigation, setNavigation] = useState<ClubManagementNavigation | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    stats: ClubDashboardStats;
    recentActivities: ClubActivity[];
    quickActions: QuickAction[];
  } | null>(null)

  // Fetch permissions and build navigation
  useEffect(() => {
    if (!user) return

    const fetchPermissions = async () => {
      const { data: permissions, error } = await supabase
        .from('club_staff_permissions')
        .select('permission')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching permissions:', error)
        return
      }

      const userPermissions = new Set(permissions.map(p => p.permission))

      const hasAccess = (requiredPermissions: string[]) => {
        return requiredPermissions.some(p => userPermissions.has(p))
      }

      const nav: ClubManagementNavigation = {
        tournaments: {
          create: {
            path: '/tournaments/create',
            permissions: ['tournament_create'],
          },
          manage: {
            path: '/tournaments/manage',
            permissions: ['tournament_manage'],
          },
          brackets: {
            path: '/tournaments/brackets',
            permissions: ['tournament_manage', 'bracket_manage'],
          },
          results: {
            path: '/tournaments/results',
            permissions: ['tournament_manage'],
          },
        },
        challenges: {
          pending: {
            path: '/challenges/pending',
            permissions: ['challenge_verify'],
          },
          verify: {
            path: '/challenges/verify',
            permissions: ['challenge_verify'],
          },
          history: {
            path: '/challenges/history',
            permissions: ['challenge_view'],
          },
        },
        members: {
          list: {
            path: '/members/list',
            permissions: ['member_manage'],
          },
          rankings: {
            path: '/members/rankings',
            permissions: ['member_view'],
          },
          activities: {
            path: '/members/activities',
            permissions: ['member_view'],
          },
        },
        tables: {
          status: {
            path: '/tables/status',
            permissions: ['table_manage'],
          },
          bookings: {
            path: '/tables/bookings',
            permissions: ['table_manage'],
          },
          maintenance: {
            path: '/tables/maintenance',
            permissions: ['table_manage'],
          },
        },
        hasAccess: (path: string) => {
          // Find the section and item that matches this path
          for (const section of Object.values(nav)) {
            for (const item of Object.values(section)) {
              if (item.path === path) {
                return hasAccess(item.permissions)
              }
            }
          }
          return false
        }
      }

      setNavigation(nav)
    }

    fetchPermissions()
  }, [user])

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      // Fetch stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_club_dashboard_stats', {
          p_user_id: user.id
        })

      if (statsError) {
        console.error('Error fetching stats:', statsError)
        return
      }

      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('club_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError)
        return
      }

      // Define quick actions
      const quickActions: QuickAction[] = [
        {
          id: 'create_tournament',
          label: 'Tạo giải đấu',
          icon: 'Trophy',
          action: () => {/* Navigate to create tournament */},
          requiredPermission: 'tournament_create'
        },
        {
          id: 'verify_challenge',
          label: 'Xác minh thách đấu',
          icon: 'Target',
          action: () => {/* Navigate to verify challenges */},
          requiredPermission: 'challenge_verify'
        },
        {
          id: 'add_member',
          label: 'Thêm thành viên',
          icon: 'UserPlus',
          action: () => {/* Navigate to add member */},
          requiredPermission: 'member_manage'
        },
        {
          id: 'manage_tables',
          label: 'Quản lý bàn',
          icon: 'Table2',
          action: () => {/* Navigate to table management */},
          requiredPermission: 'table_manage'
        }
      ]

      setDashboardData({
        stats,
        recentActivities: activities,
        quickActions: quickActions.filter(action => 
          !action.requiredPermission || navigation?.hasAccess(action.requiredPermission)
        )
      })
    }

    fetchDashboardData()
  }, [user, navigation])

  return {
    navigation,
    dashboardData
  }
}
