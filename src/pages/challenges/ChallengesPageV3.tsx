import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';

const ChallengesPageV3: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Thách đấu V3 - Thế hệ mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trang thách đấu thế hệ mới</h3>
            <p className="text-muted-foreground mb-4">
              Phiên bản 3 của hệ thống thách đấu với nhiều tính năng hiện đại đang được phát triển!
            </p>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Đang phát triển
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChallengesPageV3;