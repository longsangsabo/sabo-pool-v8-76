// DEPRECATED - SABO_REBUILD
// This component has been deprecated in favor of SABODoubleEliminationViewer
// Kept for backup purposes only - DO NOT USE

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DoubleEliminationViewerProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
}

export const DoubleEliminationViewer: React.FC<
  DoubleEliminationViewerProps
> = () => {
  return (
    <Alert className='border-red-500 bg-red-50'>
      <AlertTriangle className='h-4 w-4' />
      <AlertDescription className='text-red-800'>
        <strong>DEPRECATED COMPONENT:</strong> This component has been replaced
        by SABODoubleEliminationViewer. Please use the new SABO system instead.
      </AlertDescription>
    </Alert>
  );
};

// Export for backward compatibility
export default DoubleEliminationViewer;
