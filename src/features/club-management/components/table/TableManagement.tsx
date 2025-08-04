import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table2,
  CalendarDays,
  Tool,
  Settings,
  Plus,
  History,
  RefreshCcw
} from 'lucide-react';
import { TableGrid } from './TableGrid';
import { TableBookings } from './TableBookings';
import { TableMaintenance } from './TableMaintenance';
import { TableSettings } from './TableSettings';
import { useTableManagement } from '../hooks/useTableManagement';
import { LoadingCard } from '@/components/ui/loading-card';

export function TableManagement() {
  const {
    tables,
    bookings,
    maintenance,
    loading,
    error,
    settings,
    addTable,
    updateTable,
    deleteTable,
    addBooking,
    updateBooking,
    cancelBooking,
    addMaintenance,
    completeMaintenance,
    updateSettings,
    refreshData,
  } = useTableManagement();

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
            <p className="font-semibold">Error loading table data</p>
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
          <h2 className="text-2xl font-bold">Quản lý bàn</h2>
          <p className="text-muted-foreground">
            Quản lý bàn, đặt chỗ và bảo trì
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => addTable()}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm bàn
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Tình trạng
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Đặt bàn
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Tool className="w-4 h-4" />
            Bảo trì
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Cài đặt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <TableGrid
            tables={tables}
            onUpdateTable={updateTable}
            onDeleteTable={deleteTable}
          />
        </TabsContent>

        <TabsContent value="bookings">
          <TableBookings
            tables={tables}
            bookings={bookings}
            onAddBooking={addBooking}
            onUpdateBooking={updateBooking}
            onCancelBooking={cancelBooking}
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <TableMaintenance
            tables={tables}
            maintenance={maintenance}
            onAddMaintenance={addMaintenance}
            onCompleteMaintenance={completeMaintenance}
          />
        </TabsContent>

        <TabsContent value="settings">
          <TableSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        </TabsContent>
      </Tabs>

      {/* Table Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số bàn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Bàn đang sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.filter(t => t.status === 'occupied').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Đặt bàn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter(b => 
                new Date(b.start_time).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Bàn đang bảo trì
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.filter(t => t.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
