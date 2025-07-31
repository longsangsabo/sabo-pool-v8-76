import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

const LeaderboardTab: React.FC = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Award className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Bảng xếp hạng</h3>
        <p className="text-muted-foreground">
          Bảng xếp hạng sẽ được hiển thị ở đây!
        </p>
      </CardContent>
    </Card>
  );
};

export default LeaderboardTab;