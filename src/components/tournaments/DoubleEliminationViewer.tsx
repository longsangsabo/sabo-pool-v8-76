// DEPRECATED - SABO_REBUILD
// This component has been deprecated in favor of SABODoubleEliminationViewer
// Automatically redirecting to new SABO system

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SABODoubleEliminationViewer } from '@/tournaments/sabo/SABODoubleEliminationViewer';

interface DoubleEliminationViewerProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
}

export const DoubleEliminationViewer: React.FC<
  DoubleEliminationViewerProps
> = ({ tournamentId, isClubOwner = false, adminMode = false }) => {
  const [showSABO, setShowSABO] = React.useState(false);

  if (showSABO) {
    // Redirect to SABO system
    return (
      <SABODoubleEliminationViewer
        tournamentId={tournamentId}
        isClubOwner={isClubOwner}
        adminMode={adminMode}
      />
    );
  }
  // Show migration notice by default
  return (
    <div className='space-y-4'>
      <Alert className='border-orange-500 bg-orange-50'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription className='text-orange-800'>
          <div className='space-y-2'>
            <p>
              <strong>DEPRECATED COMPONENT:</strong> This component has been
              replaced by the new SABO system.
            </p>
            <p>
              The new system provides better performance, more accurate bracket
              logic, and improved user experience.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowSABO(true)}
              className='mt-2 bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200'
            >
              <ArrowRight className='h-4 w-4 mr-1' />
              Switch to SABO System
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
