import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

const HistoryTab: React.FC = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <History className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Lịch sử thách đấu</h3>
        <p className="text-muted-foreground">
          Lịch sử các trận đấu sẽ được hiển thị ở đây!
        </p>
      </CardContent>
    </Card>
  );
};

export default HistoryTab;