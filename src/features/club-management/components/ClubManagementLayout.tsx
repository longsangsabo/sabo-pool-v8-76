import { useState } from "react"
import { ClubManagementNav } from "./ClubManagementNav"
import { ClubDashboard } from "./ClubDashboard"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useClubManagement } from "../hooks/useClubManagement"

interface ClubManagementLayoutProps {
  children: React.ReactNode
}

export function ClubManagementLayout({ children }: ClubManagementLayoutProps) {
  const [open, setOpen] = useState(false)
  const { navigation, dashboardData } = useClubManagement()

  if (!navigation || !dashboardData) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r min-h-screen">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Quản lý CLB</h2>
          <p className="text-sm text-muted-foreground">
            Dashboard quản lý câu lạc bộ
          </p>
        </div>
        <ScrollArea className="flex-1 px-4">
          <ClubManagementNav navigation={navigation} />
        </ScrollArea>
      </aside>

      {/* Mobile navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden px-0 w-12 -ml-2"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Quản lý CLB</h2>
            <p className="text-sm text-muted-foreground">
              Dashboard quản lý câu lạc bộ
            </p>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="px-4">
              <ClubManagementNav navigation={navigation} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="h-full px-4 py-6 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
