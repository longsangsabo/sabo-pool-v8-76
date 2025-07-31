import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';

interface ButtonProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  return (
    <ShadcnButton
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </ShadcnButton>
  );
};
