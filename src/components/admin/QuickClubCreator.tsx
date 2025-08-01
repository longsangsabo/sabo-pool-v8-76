import React, { useState } from 'react';
import { Building2, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QuickClubCreator = () => {
  const [clubCount, setClubCount] = useState(5);
  const [autoApprove, setAutoApprove] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdClubs, setCreatedClubs] = useState<any[]>([]);

  const clubNames = [
    'Sài Gòn Billiards Club',
    'Hà Nội Pool Arena',
    'Đà Nẵng Cue Sports',
    'Vũng Tàu Billiards Center',
    'Cần Thơ Pool House',
    'Hải Phòng Cue Club',
    'Nha Trang Billiards',
    'Huế Pool Center',
    'Quy Nhon Cue Sports',
    'Bình Dương Billiards',
  ];

  const districts = [
    'Quận 1',
    'Quận 2',
    'Quận 3',
    'Quận 4',
    'Quận 5',
    'Quận 7',
    'Quận 10',
    'Quận Bình Thạnh',
    'Quận Tân Bình',
    'Quận Phú Nhuận',
    'Quận Gò Vấp',
    'Quận Thủ Đức',
  ];

  const streets = [
    'Nguyễn Huệ',
    'Lê Lợi',
    'Hai Bà Trưng',
    'Trần Hưng Đạo',
    'Nguyễn Thị Minh Khai',
    'Võ Văn Tần',
    'Cách Mạng Tháng 8',
    'Phan Xích Long',
    'Hoàng Văn Thụ',
    'Lý Tự Trọng',
  ];

  const generateClubData = () => {
    const name = clubNames[Math.floor(Math.random() * clubNames.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const streetNumber = Math.floor(Math.random() * 999) + 1;

    return {
      club_name: `${name} ${Math.floor(Math.random() * 99) + 1}`,
      address: `${streetNumber} ${street}, ${district}, TP.HCM`,
      phone: `028${Math.floor(Math.random() * 90000000) + 10000000}`,
      email: `info@${name.toLowerCase().replace(/\s+/g, '')}.com`,
      opening_time: '08:00:00',
      closing_time: '23:00:00',
      table_count: Math.floor(Math.random() * 20) + 5, // 5-25 tables
      basic_price: (Math.floor(Math.random() * 5) + 3) * 10000, // 30k-80k VND
      normal_hour_price: (Math.floor(Math.random() * 5) + 4) * 10000, // 40k-90k VND
      peak_hour_price: (Math.floor(Math.random() * 5) + 6) * 10000, // 60k-110k VND
      weekend_price: (Math.floor(Math.random() * 5) + 7) * 10000, // 70k-120k VND
      table_types: ['9-ball', '8-ball', 'Carom'],
      amenities: {
        wifi: true,
        parking: Math.random() > 0.3,
        restaurant: Math.random() > 0.5,
        bar: Math.random() > 0.6,
        air_conditioning: true,
        smoking_area: Math.random() > 0.7,
      },
      manager_name: 'Quản lý CLB',
      manager_phone: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      status: autoApprove ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
    };
  };

  const createTestUser = async () => {
    // Create a test user for club ownership
    const userData = {
      user_id: crypto.randomUUID(),
      full_name: `Club Owner ${Date.now()}`,
      phone: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      role: 'club_owner',
      created_at: new Date().toISOString(),
    };

    const { data: user, error } = await supabase
      .from('profiles')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return user;
  };

  const createClubs = async () => {
    setIsCreating(true);
    setCreatedClubs([]);

    try {
      const clubs = [];

      for (let i = 0; i < clubCount; i++) {
        // Create test user for club
        const clubOwner = await createTestUser();

        // Generate club data
        const clubData = {
          ...generateClubData(),
          user_id: clubOwner.user_id,
        };

        clubs.push(clubData);
      }

      // Quick club creator disabled - club_registrations table doesn't exist
      console.warn('Quick club creator disabled - missing database tables');
      toast.error(
        'Club creator is currently disabled - missing database tables'
      );
      return;
      toast.success(`Successfully created ${clubCount} test clubs!`);
    } catch (error) {
      console.error('Error creating clubs:', error);
      toast.error('Failed to create clubs. Check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building2 className='h-5 w-5' />
          Quick Club Creator
        </CardTitle>
        <CardDescription>
          Generate test clubs with realistic business information and locations
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='clubCount'>Number of Clubs (1-10)</Label>
            <Input
              id='clubCount'
              type='number'
              min='1'
              max='10'
              value={clubCount}
              onChange={e => setClubCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='autoApprove'
              checked={autoApprove}
              onCheckedChange={checked => setAutoApprove(checked as boolean)}
            />
            <Label htmlFor='autoApprove'>
              Auto-approve clubs (create club profiles)
            </Label>
          </div>
        </div>

        <div className='p-4 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>
            Generated Club Features:
          </h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>• Realistic Vietnamese club names and addresses</li>
            <li>• Random operating hours and table counts</li>
            <li>• Varied pricing structures (basic, normal, peak, weekend)</li>
            <li>• Random amenities (WiFi, parking, restaurant, etc.)</li>
            <li>• Auto-generated manager contact information</li>
            <li>• Test user accounts for club ownership</li>
          </ul>
        </div>

        <Button
          onClick={createClubs}
          disabled={isCreating || clubCount < 1 || clubCount > 10}
          className='w-full'
        >
          {isCreating ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Creating Clubs...
            </>
          ) : (
            <>
              <Plus className='h-4 w-4 mr-2' />
              Create {clubCount} Test Clubs
            </>
          )}
        </Button>

        {createdClubs.length > 0 && (
          <div className='mt-6 p-4 bg-green-50 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <h3 className='font-medium text-green-800'>
                Clubs Created Successfully
              </h3>
            </div>
            <p className='text-sm text-green-700 mb-3'>
              Created {createdClubs.length} test clubs
              {autoApprove
                ? ' with approved status and club profiles'
                : ' pending approval'}
              .
            </p>
            <div className='space-y-1'>
              {createdClubs.slice(0, 3).map((club, index) => (
                <div key={index} className='text-xs text-green-600'>
                  • {club.club_name} - {club.address}
                </div>
              ))}
              {createdClubs.length > 3 && (
                <div className='text-xs text-green-600'>
                  ... and {createdClubs.length - 3} more clubs
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickClubCreator;
