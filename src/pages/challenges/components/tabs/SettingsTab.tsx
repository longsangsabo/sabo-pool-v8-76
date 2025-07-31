import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface SettingsTabProps {
  onStatsUpdate: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onStatsUpdate }) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Settings className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Cài đặt thách đấu</h3>
        <p className="text-muted-foreground">
          Cài đặt sẽ được triển khai sớm!
        </p>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;