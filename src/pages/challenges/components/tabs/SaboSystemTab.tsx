import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Star } from 'lucide-react';

const SaboSystemTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hệ thống SABO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Hệ thống SABO chuyên nghiệp</h3>
            <p className="text-muted-foreground mb-4">
              Hệ thống handicap chuyên nghiệp SABO đang được phát triển. Sẽ có các thách đấu với handicap tự động và chấm điểm chuẩn quốc tế!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3" />
                Handicap tự động
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Sắp ra mắt
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaboSystemTab;