import React from 'react';
import { Button } from '@/components/ui/button';
import { useRewardTemplates } from '@/hooks/useRewardTemplates';
import { toast } from 'sonner';

const TestCopyTemplate = () => {
  const { templates, convertTemplatesToRewards, copyTemplateToTournament } =
    useRewardTemplates();

  const handleCopyTemplate = async () => {
    const tournamentId = 'c73a66a1-1698-4713-839c-dc62ae3469e5'; // test1 tournament ID

    try {
      // Use existing templates or create sample rewards
      let rewardsData;

      if (templates.length > 0) {
        rewardsData = convertTemplatesToRewards(templates);
        console.log('Using existing templates:', rewardsData);
      } else {
        // Create sample rewards data for all 16 positions
        rewardsData = {
          totalPrize: 2200000,
          showPrizes: true,
          positions: [
            {
              position: 1,
              name: 'Vô địch',
              cashPrize: 1100000,
              eloPoints: 100,
              spaPoints: 900,
              isVisible: true,
              items: [],
            },
            {
              position: 2,
              name: 'Á quân',
              cashPrize: 660000,
              eloPoints: 75,
              spaPoints: 700,
              isVisible: true,
              items: [],
            },
            {
              position: 3,
              name: 'Hạng 3',
              cashPrize: 440000,
              eloPoints: 50,
              spaPoints: 500,
              isVisible: true,
              items: [],
            },
            {
              position: 4,
              name: 'Hạng 4',
              cashPrize: 220000,
              eloPoints: 40,
              spaPoints: 400,
              isVisible: true,
              items: [],
            },
            {
              position: 5,
              name: 'Hạng 5-6',
              cashPrize: 110000,
              eloPoints: 30,
              spaPoints: 300,
              isVisible: true,
              items: [],
            },
            {
              position: 6,
              name: 'Hạng 5-6',
              cashPrize: 110000,
              eloPoints: 30,
              spaPoints: 300,
              isVisible: true,
              items: [],
            },
            {
              position: 7,
              name: 'Hạng 7-8',
              cashPrize: 55000,
              eloPoints: 25,
              spaPoints: 250,
              isVisible: true,
              items: [],
            },
            {
              position: 8,
              name: 'Hạng 7-8',
              cashPrize: 55000,
              eloPoints: 25,
              spaPoints: 250,
              isVisible: true,
              items: [],
            },
            {
              position: 9,
              name: 'Hạng 9-12',
              cashPrize: 30000,
              eloPoints: 20,
              spaPoints: 200,
              isVisible: true,
              items: [],
            },
            {
              position: 10,
              name: 'Hạng 9-12',
              cashPrize: 30000,
              eloPoints: 20,
              spaPoints: 200,
              isVisible: true,
              items: [],
            },
            {
              position: 11,
              name: 'Hạng 9-12',
              cashPrize: 30000,
              eloPoints: 20,
              spaPoints: 200,
              isVisible: true,
              items: [],
            },
            {
              position: 12,
              name: 'Hạng 9-12',
              cashPrize: 30000,
              eloPoints: 20,
              spaPoints: 200,
              isVisible: true,
              items: [],
            },
            {
              position: 13,
              name: 'Hạng 13-16',
              cashPrize: 15000,
              eloPoints: 15,
              spaPoints: 150,
              isVisible: true,
              items: [],
            },
            {
              position: 14,
              name: 'Hạng 13-16',
              cashPrize: 15000,
              eloPoints: 15,
              spaPoints: 150,
              isVisible: true,
              items: [],
            },
            {
              position: 15,
              name: 'Hạng 13-16',
              cashPrize: 15000,
              eloPoints: 15,
              spaPoints: 150,
              isVisible: true,
              items: [],
            },
            {
              position: 16,
              name: 'Hạng 13-16',
              cashPrize: 15000,
              eloPoints: 15,
              spaPoints: 150,
              isVisible: true,
              items: [],
            },
          ],
          specialAwards: [],
        };
        console.log('Using sample rewards data:', rewardsData);
      }

      const success = await copyTemplateToTournament(tournamentId, rewardsData);

      if (success) {
        toast.success('✅ Đã copy template vào giải test1 thành công!');
        console.log('Copy template to test1 tournament successful');
      } else {
        toast.error('❌ Lỗi khi copy template');
        console.error('Copy template failed');
      }
    } catch (error) {
      console.error('Error copying template:', error);
      toast.error('❌ Lỗi: ' + error);
    }
  };

  return (
    <div className='p-4 border rounded-lg'>
      <h3 className='text-lg font-semibold mb-4'>
        Test Copy Template to Tournament
      </h3>
      <p className='text-sm text-muted-foreground mb-4'>
        Chạy function copyTemplateToTournament cho giải test1
      </p>
      <Button onClick={handleCopyTemplate} className='w-full'>
        Copy Template to Test1 Tournament
      </Button>
      <p className='text-xs text-muted-foreground mt-2'>
        Tournament ID: c73a66a1-1698-4713-839c-dc62ae3469e5
      </p>
    </div>
  );
};

export default TestCopyTemplate;
