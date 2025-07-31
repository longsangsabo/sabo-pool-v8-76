import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface TournamentsTabProps {
  onStatsUpdate: () => void;
}

const TournamentsTab: React.FC<TournamentsTabProps> = ({ onStatsUpdate }) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Giải đấu</h3>
        <p className="text-muted-foreground">
          Tính năng giải đấu sẽ được triển khai sớm!
        </p>
      </CardContent>
    </Card>
  );
};

export default TournamentsTab;