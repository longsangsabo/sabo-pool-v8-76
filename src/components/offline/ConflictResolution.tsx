import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';

interface ConflictResolutionProps {
  showConflicts?: boolean;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  showConflicts = true
}) => {
  const { syncCoordinator } = useOffline();
  const conflicts = syncCoordinator.getPendingConflicts();

  if (!showConflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Có {conflicts.length} xung đột cần được giải quyết
        </AlertDescription>
      </Alert>
      
      {conflicts.map((conflict: any) => (
        <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Xung đột dữ liệu: {conflict.type}</h4>
            <Button
              size="sm"
              onClick={() => syncCoordinator.resolveConflict(conflict.id, conflict.localVersion)}
            >
              Giải quyết
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};