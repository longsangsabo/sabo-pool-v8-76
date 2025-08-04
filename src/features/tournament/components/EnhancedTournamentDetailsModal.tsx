import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog';
import { Tournament } from '@/types/tournament';

interface EnhancedTournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
}

export const EnhancedTournamentDetailsModal: React.FC<EnhancedTournamentDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  tournament 
}) => {
  if (!tournament) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{tournament.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold">Tournament Details</h3>
            <p>{tournament.description}</p>
          </div>
          {/* Add more tournament details here */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
