import React from 'react';
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardWithHeaderProps extends CardProps {
  title?: string;
  headerContent?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <ShadcnCard className={className}>{children}</ShadcnCard>;
};

export const CardWithHeader: React.FC<CardWithHeaderProps> = ({
  title,
  headerContent,
  children,
  className = '',
}) => {
  return (
    <ShadcnCard className={className}>
      {(title || headerContent) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {headerContent}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </ShadcnCard>
  );
};
