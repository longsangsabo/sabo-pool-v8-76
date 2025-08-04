import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useClubRole } from '../../hooks/useClubRole';
import { TableGrid } from './TableGrid';
import { TableList } from './TableList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableForm } from './TableForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TableManagementProps {
  clubId: string;
}

export const TableManagement: React.FC<TableManagementProps> = ({ clubId }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { permissions } = useClubRole({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý bàn chơi</CardTitle>
          {permissions.canManageClub && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bàn mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm bàn mới</DialogTitle>
                </DialogHeader>
                <TableForm
                  clubId={clubId}
                  onSuccess={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <TabsContent value="grid">
              <TableGrid clubId={clubId} />
            </TabsContent>
            <TabsContent value="list">
              <TableList clubId={clubId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
