import React from 'react';
import { cn } from '@/lib/utils';

export interface SaboTechBorderProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'premium'
    | 'rank';
  rankLevel?: 'K' | 'I' | 'H' | 'G' | 'F' | 'E';
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * SABO Tech Border System Component
 *
 * Advanced tech-style borders with animations and dynamic effects
 *
 * @param variant - Border style variant
 * @param rankLevel - Specific rank for rank-based borders
 * @param interactive - Enable hover/interaction effects
 * @param children - Content to wrap
 * @param className - Additional CSS classes
 * @param as - HTML element type to render
 */
export const SaboTechBorder: React.FC<SaboTechBorderProps> = ({
  variant = 'primary',
  rankLevel,
  interactive = false,
  children,
  className,
  as: Component = 'div',
}) => {
  const getBorderClass = () => {
    if (variant === 'rank' && rankLevel) {
      return `sabo-tech-border-rank-${rankLevel.toLowerCase()}`;
    }

    switch (variant) {
      case 'primary':
        return 'sabo-tech-border-primary';
      case 'secondary':
        return 'sabo-tech-border-secondary';
      case 'success':
        return 'sabo-tech-border-success';
      case 'warning':
        return 'sabo-tech-border-warning';
      case 'premium':
        return 'sabo-tech-border-premium';
      default:
        return 'sabo-tech-border-primary';
    }
  };

  const classes = cn(
    getBorderClass(),
    interactive && 'sabo-tech-border-interactive',
    className
  );

  return <Component className={classes}>{children}</Component>;
};

/**
 * Pre-configured SABO Tech Border Components
 */

export const SaboTechButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => (
  <button className={cn('sabo-tech-button', className)} onClick={onClick}>
    {children}
  </button>
);

export const SaboTechCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  premium?: boolean;
}> = ({ children, className, premium = false }) => (
  <div
    className={cn(
      premium ? 'sabo-tech-card-premium' : 'sabo-tech-card',
      className
    )}
  >
    {children}
  </div>
);

export const SaboTechInput: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
}> = ({ placeholder, value, onChange, className, type = 'text' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={cn('sabo-tech-input px-4 py-3', className)}
  />
);

export const SaboTechAvatar: React.FC<{
  src?: string;
  alt?: string;
  rank?: boolean;
  className?: string;
}> = ({ src, alt, rank = false, className }) => (
  <img
    src={src}
    alt={alt}
    className={cn(
      rank ? 'sabo-tech-avatar-rank' : 'sabo-tech-avatar',
      'w-20 h-20 object-cover',
      className
    )}
  />
);
