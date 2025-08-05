import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Tournament } from '@/types/tournament';

interface SimpleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onRegister: (tournamentId: string) => Promise<void>;
  registering: boolean;
}

export const SimpleRegistrationModal: React.FC<
  SimpleRegistrationModalProps
> = ({ isOpen, onClose, tournament, onRegister, registering }) => {
  if (!tournament) return null;

  const handleRegister = async () => {
    await onRegister(tournament.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Register for Tournament</DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <p className='mb-2'>You are registering for:</p>
          <p className='font-bold text-lg'>{tournament.name}</p>
          <div className='mt-4'>
            <p>Tournament details:</p>
            <ul className='list-disc ml-5 mt-2'>
              <li>
                Start date:{' '}
                {new Date(tournament.tournament_start).toLocaleDateString()}
              </li>
              <li>Entry fee: {tournament.entry_fee || 'Free'}</li>
              <li>Format: {tournament.game_format}</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={registering}>
            {registering ? 'Registering...' : 'Confirm Registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
