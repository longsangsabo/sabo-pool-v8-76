import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Plus, Calculator, Trophy, Info } from 'lucide-react';
import SaboChallengeModal from '@/components/sabo/SaboChallengeModal';
import { getRankDisplayName, getAllRanks } from '@/utils/saboHandicap';

const SaboSystemTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChallengeCreated = () => {
    // Refresh challenges or perform other actions
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className="space-y-6">
      {/* SABO System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hệ thống SABO Professional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thách đấu với Handicap chuyên nghiệp</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Hệ thống SABO tự động tính toán handicap dựa trên chênh lệch hạng và mức cược, 
              đảm bảo trận đấu công bằng và hấp dẫn cho cả hai bên.
            </p>
            
            <Button 
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tạo thách đấu SABO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How SABO Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cách tính Handicap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Quy tắc cơ bản
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Chỉ được thách đấu trong phạm vi ±2 hạng chính</li>
                <li>• Handicap tự động dựa trên chênh lệch hạng và mức cược</li>
                <li>• Người hạng thấp hơn được cộng bàn</li>
                <li>• Mức cược cao hơn = handicap lớn hơn</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Ví dụ tính toán
              </h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <strong>H vs G+:</strong> Người H được +1 bàn
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>I vs H+:</strong> Người I được +2 bàn
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>F vs F+:</strong> Không có handicap
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Ranks */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng hạng SABO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getAllRanks().map((rank) => (
              <div key={rank} className="p-3 border rounded-lg text-center">
                <Badge variant="outline" className="mb-2">{rank}</Badge>
                <div className="text-xs text-muted-foreground">
                  {getRankDisplayName(rank).split(' (')[1]?.replace(')', '') || rank}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SABO Challenge Modal */}
      <SaboChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChallengeCreated={handleChallengeCreated}
      />
    </div>
  );
};

export default SaboSystemTab;