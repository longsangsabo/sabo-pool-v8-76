import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Users, Table2, ChevronRight } from "lucide-react"
import { ClubManagementNavigation } from "../types/navigation.types"
import { useNavigate } from "react-router-dom"

interface SidebarNavProps {
  navigation: ClubManagementNavigation
  className?: string
}

export function ClubManagementNav({ navigation, className }: SidebarNavProps) {
  const navigate = useNavigate()

  const NavGroup = ({ 
    title, 
    items, 
    icon: Icon 
  }: { 
    title: string
    items: Record<string, { path: string; permissions: string[] }>
    icon: any 
  }) => {
    return (
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 px-2 text-sm font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </h4>
        <div className="grid gap-1">
          {Object.entries(items).map(([key, { path, permissions }]) => {
            const hasPermission = navigation.hasAccess(path)
            if (!hasPermission) return null

            return (
              <Button
                key={path}
                variant="ghost"
                className={cn(
                  "w-full justify-between",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:bg-accent focus-visible:text-accent-foreground"
                )}
                onClick={() => navigate(path)}
              >
                <span className="truncate capitalize">{key.replace(/_/g, ' ')}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <nav className={cn("space-y-6", className)}>
      <NavGroup
        title="Giải đấu"
        items={navigation.tournaments}
        icon={Trophy}
      />
      
      <NavGroup
        title="Thách đấu" 
        items={navigation.challenges}
        icon={Target}
      />

      <NavGroup
        title="Thành viên"
        items={navigation.members} 
        icon={Users}
      />

      <NavGroup 
        title="Quản lý bàn"
        items={navigation.tables}
        icon={Table2}
      />
    </nav>
  )
}
