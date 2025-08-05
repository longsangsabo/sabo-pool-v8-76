import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EnhancedAuthTabsProps {
  children: React.ReactNode;
  defaultTab?: 'phone' | 'email';
}

export const EnhancedAuthTabs = ({
  children,
  defaultTab = 'phone',
}: EnhancedAuthTabsProps) => {
  return (
    <Tabs defaultValue={defaultTab} className='w-full'>
      <TabsList className='grid w-full grid-cols-2 mb-6'>
        <TabsTrigger value='phone' className='text-sm font-medium'>
          Số điện thoại
        </TabsTrigger>
        <TabsTrigger value='email' className='text-sm font-medium'>
          Email
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};

export const PhoneTabContent = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <TabsContent value='phone' className='space-y-4'>
    {children}
  </TabsContent>
);

export const EmailTabContent = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <TabsContent value='email' className='space-y-4'>
    {children}
  </TabsContent>
);
