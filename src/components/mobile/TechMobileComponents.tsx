import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';

// Tech Button Variants for Mobile Only
const techButtonVariants = cva(
  'tech-button inline-flex items-center justify-content gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'tech-button-primary',
        secondary: 'tech-button-secondary',
        success: 'tech-button-success',
        warning: 'tech-button-warning',
        danger: 'tech-button-danger',
        ghost: 'tech-button-ghost',
      },
      size: {
        default: 'tech-button-default',
        sm: 'tech-button-compact',
        lg: 'tech-button-large',
        icon: 'tech-button-icon',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface TechButtonProps extends Omit<ButtonProps, 'variant' | 'size'>, VariantProps<typeof techButtonVariants> {}

export const TechButton = React.forwardRef<HTMLButtonElement, TechButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(techButtonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TechButton.displayName = 'TechButton';

// Tech Card for Mobile Only
export interface TechCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'active' | 'inactive';
  interactive?: boolean;
}

export const TechCard = React.forwardRef<HTMLDivElement, TechCardProps>(
  ({ className, variant = 'default', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'tech-card',
          variant === 'active' && 'tech-card-active',
          variant === 'inactive' && 'tech-card-inactive',
          interactive && 'tech-card-interactive',
          className
        )}
        {...props}
      >
        <div className="tech-card-border"></div>
        <div className="tech-card-content">
          {children}
        </div>
      </div>
    );
  }
);
TechCard.displayName = 'TechCard';

// Tech Stats Card for Mobile
export interface TechStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const TechStatCard: React.FC<TechStatCardProps> = ({
  label,
  value,
  icon,
  variant = 'primary',
  className
}) => {
  return (
    <div className={cn('tech-stat-card', `tech-stat-${variant}`, className)}>
      <div className="tech-stat-content">
        {icon && <div className="tech-stat-icon">{icon}</div>}
        <div className="tech-stat-number">{value}</div>
        <div className="tech-stat-label">{label}</div>
      </div>
      <div className="tech-stat-glow"></div>
    </div>
  );
};

// Tech Chip for Mobile
export interface TechChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'ranked' | 'casual';
  onClick?: () => void;
  className?: string;
}

export const TechChip: React.FC<TechChipProps> = ({
  children,
  variant = 'default',
  onClick,
  className
}) => {
  return (
    <div
      className={cn(
        'tech-chip',
        `tech-chip-${variant}`,
        onClick && 'tech-chip-clickable',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};