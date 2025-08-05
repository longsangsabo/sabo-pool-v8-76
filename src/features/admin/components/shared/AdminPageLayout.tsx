import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminPageLayout({
  title,
  description,
  actions,
  filters,
  children,
  className = '',
}: AdminPageLayoutProps) {
  return (
    <div className={`admin-page-container space-y-6 ${className}`}>
      {/* Page Header */}
      <div className='admin-page-header'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
            {description && (
              <p className='text-muted-foreground mt-2'>{description}</p>
            )}
          </div>
          {actions && (
            <div className='admin-page-actions flex gap-2'>{actions}</div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {filters && (
        <Card>
          <CardContent className='pt-6'>{filters}</CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className='admin-page-content'>{children}</div>
    </div>
  );
}
