import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trophy } from 'lucide-react';
import { RANK_DEFINITIONS, getRanksByGroup } from '@/utils/rankDefinitions';

const RankDefinitionsGuide = () => {
  const rankGroups = getRanksByGroup();

  const getGroupName = (groupKey: string) => {
    const names: Record<string, string> = {
      beginner: 'Sơ cấp',
      novice: 'Mới học',
      intermediate: 'Trung bình',
      advanced: 'Khá',
      expert: 'Giỏi',
      master: 'Chuyên nghiệp',
    };
    return names[groupKey] || groupKey;
  };

  const getGroupColor = (groupKey: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-gray-100 text-gray-800',
      novice: 'bg-blue-100 text-blue-800',
      intermediate: 'bg-green-100 text-green-800',
      advanced: 'bg-yellow-100 text-yellow-800',
      expert: 'bg-orange-100 text-orange-800',
      master: 'bg-red-100 text-red-800',
    };
    return colors[groupKey] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='w-5 h-5' />
          Định nghĩa hạng trong hệ thống
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {Object.entries(rankGroups).map(([groupKey, ranks]) => (
            <div key={groupKey}>
              <div className='flex items-center gap-2 mb-4'>
                <Badge className={getGroupColor(groupKey)}>
                  {getGroupName(groupKey)}
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  ({ranks.length} hạng)
                </span>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                {ranks.map(rank => {
                  const rankInfo = RANK_DEFINITIONS[rank];
                  return (
                    <div key={rank} className='border rounded-lg p-4'>
                      <h3 className='font-semibold mb-2 text-primary'>
                        {rankInfo.name}
                      </h3>
                      <p className='text-sm text-muted-foreground mb-3'>
                        {rankInfo.description}
                      </p>
                      <div>
                        <h4 className='font-medium mb-2 text-sm'>
                          Yêu cầu kiểm tra:
                        </h4>
                        <ul className='space-y-1'>
                          {rankInfo.requirements.map((req, index) => (
                            <li
                              key={index}
                              className='flex items-start text-xs'
                            >
                              <CheckCircle className='w-3 h-3 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='font-semibold text-blue-800 mb-2'>
            Lưu ý về hệ thống xếp hạng
          </h4>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>
              • Tất cả định nghĩa hạng được áp dụng thống nhất trên toàn hệ
              thống
            </li>
            <li>• CLB cần test kỹ lưỡng theo đúng yêu cầu của từng hạng</li>
            <li>• Xác thực sai sẽ ảnh hưởng đến uy tín của câu lạc bộ</li>
            <li>
              • Người chơi có thể thăng hạng dựa trên SPA points và rank points
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankDefinitionsGuide;
