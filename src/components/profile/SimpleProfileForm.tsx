import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSimpleProfile } from '@/contexts/SimpleProfileContext';
import { toast } from 'sonner';

const SimpleProfileForm: React.FC = () => {
  const { profile, isLoading, updateProfile } = useSimpleProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    district: profile?.district || '',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        district: profile.district || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const success = await updateProfile(formData);
      if (success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='full_name'>Full Name</Label>
              <Input
                id='full_name'
                value={formData.full_name}
                onChange={e => updateField('full_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor='display_name'>Display Name</Label>
              <Input
                id='display_name'
                value={formData.display_name}
                onChange={e => updateField('display_name', e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='city'>City</Label>
              <Input
                id='city'
                value={formData.city}
                onChange={e => updateField('city', e.target.value)}
              />
            </div>
          </div>

          <div>
            <div>
              <Label htmlFor='district'>District</Label>
              <Input
                id='district'
                value={formData.district}
                onChange={e => updateField('district', e.target.value)}
              />
            </div>
          </div>

          <Button type='submit' disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleProfileForm;
