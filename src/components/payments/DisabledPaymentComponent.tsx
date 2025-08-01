import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DisabledPaymentComponentProps {
  title: string;
  description?: string;
}

const DisabledPaymentComponent = ({
  title,
  description,
}: DisabledPaymentComponentProps) => {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-center flex-col space-y-4 p-8 text-center'>
          <AlertTriangle className='w-12 h-12 text-amber-500' />
          <div>
            <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
            <p className='text-sm text-gray-500 mt-2'>
              {description ||
                'Tính năng này đang được cập nhật cơ sở dữ liệu. Vui lòng thử lại sau.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisabledPaymentComponent;
