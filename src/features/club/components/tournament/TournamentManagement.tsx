import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tournament } from '../../../types/tournament.types';
import { useClubRole } from '../../../hooks/useClubRole';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TournamentList } from './TournamentList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TournamentForm } from './TournamentForm';

interface TournamentManagementProps {
  clubId: string;
}

export const TournamentManagement: React.FC<TournamentManagementProps> = ({ clubId }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { permissions } = useClubRole({});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý giải đấu</CardTitle>
          {permissions.canManageTournaments && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo giải đấu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo giải đấu mới</DialogTitle>
                </DialogHeader>
                <TournamentForm
                  clubId={clubId}
                  onSuccess={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <TournamentList clubId={clubId} />
        </CardContent>
      </Card>
    </div>
  );
};
